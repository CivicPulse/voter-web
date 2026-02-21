import { useCallback, useEffect, useRef, useState } from "react"
import { CreditCard, Loader2 } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuthStore } from "@/stores/authStore"
import { searchVoters } from "@/api/voters"
import { verifyAddress, geocodeAddress } from "@/api/lookup"

/** Parse AAMVA-encoded PDF417 barcode data from a US driver's license. */
function parseAAMVA(raw: string): {
  firstName?: string
  lastName?: string
  street?: string
  city?: string
  state?: string
  postalCode?: string
} {
  const fields: Record<string, string> = {}
  // Each field is a 3-uppercase-letter code followed by data until CR/LF
  const fieldRegex = /([A-Z]{3})([^\r\n]*)/g
  let match: RegExpExecArray | null
  while ((match = fieldRegex.exec(raw)) !== null) {
    const value = match[2].trim()
    if (value) fields[match[1]] = value
  }
  // AAMVA field codes:
  // DCS = family name, DCT = first name (post-2000), DAC = first name (pre-2000)
  // DAG = street address, DAI = city, DAJ = state, DAK = postal code (9-char, e.g. "303030000")
  return {
    firstName: fields["DCT"] || fields["DAC"],
    lastName: fields["DCS"],
    street: fields["DAG"],
    city: fields["DAI"],
    state: fields["DAJ"],
    postalCode: fields["DAK"]?.slice(0, 5), // Take 5-digit zip from 9-char AAMVA field
  }
}

export function DriverLicenseScannerButton() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const navigate = useNavigate()

  // Stop camera stream/refs without touching React state.
  // Safe to call synchronously inside useEffect bodies.
  const stopCameraStream = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  // Full stop: clean up resources and reset scanning state.
  // Only call from async callbacks, not directly in effect bodies.
  const stopCamera = useCallback(() => {
    stopCameraStream()
    setScanning(false)
  }, [stopCameraStream])

  useEffect(() => {
    if (!open) {
      stopCameraStream()
      return
    }

    const video = videoRef.current
    if (!video) return

    let cancelled = false

    async function startScanning() {
      try {
        // Check BarcodeDetector availability inside the async function to avoid
        // calling setState synchronously in the effect body.
        if (!("BarcodeDetector" in window)) {
          setError(
            "Barcode scanning is not supported on iOS or Firefox. Please use Chrome or Edge on Android or desktop.",
          )
          return
        }

        const supported = await BarcodeDetector.getSupportedFormats()
        if (!supported.includes("pdf417")) {
          setError(
            "PDF417 barcode format is not supported in this browser. Please use Chrome or Edge.",
          )
          return
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        })

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream
        video!.srcObject = stream
        // On iOS Safari, play() may reject even with a valid stream; the
        // autoPlay attribute handles playback in that case.
        try {
          await video!.play()
        } catch {
          // Ignore — video renders via autoPlay on iOS when play() throws
        }

        const detector = new BarcodeDetector({ formats: ["pdf417"] })
        setScanning(true)

        async function scan() {
          if (cancelled) return
          try {
            const barcodes = await detector.detect(video!)
            if (cancelled) return // Post-await cancellation guard
            if (barcodes.length > 0) {
              const parsed = parseAAMVA(barcodes[0].rawValue)
              const q =
                [parsed.firstName, parsed.lastName].filter(Boolean).join(" ") ||
                undefined
              if (!q) {
                setError(
                  "Could not extract a name from the barcode. Please try again.",
                )
                return
              }

              // Stop camera but keep dialog open while looking up voter
              stopCamera()
              setLookingUp(true)

              try {
                const result = await searchVoters({ q })
                if (cancelled) return

                if (result.total > 0) {
                  // Voter(s) found — navigate to voter search results
                  setLookingUp(false)
                  setOpen(false)
                  navigate({ to: "/voters", search: { q }, replace: true })
                  return
                }

                // No voter results — try address-based district lookup
                const addressParts = [
                  parsed.street,
                  parsed.city,
                  parsed.state,
                  parsed.postalCode,
                ].filter(Boolean)

                if (addressParts.length > 0) {
                  const addressStr = addressParts.join(", ")
                  try {
                    const verified = await verifyAddress(addressStr)
                    if (cancelled) return
                    if (verified.suggestions.length > 0) {
                      const suggestion = verified.suggestions[0]
                      if (
                        Number.isFinite(suggestion.latitude) &&
                        Number.isFinite(suggestion.longitude)
                      ) {
                        setLookingUp(false)
                        setOpen(false)
                        navigate({
                          to: "/lookup/results",
                          search: {
                            lat: suggestion.latitude,
                            lng: suggestion.longitude,
                            address: suggestion.address,
                          },
                        })
                        return
                      }
                    }
                    // No suggestions from verify — try direct geocode
                    const geocoded = await geocodeAddress(addressStr)
                    if (cancelled) return
                    setLookingUp(false)
                    setOpen(false)
                    navigate({
                      to: "/lookup/results",
                      search: {
                        lat: geocoded.latitude,
                        lng: geocoded.longitude,
                        address: geocoded.formatted_address,
                      },
                    })
                    return
                  } catch {
                    // Address lookup failed — fall through to voter search page
                    if (cancelled) return
                  }
                }

                // No voter results and address lookup unavailable/failed —
                // still navigate to voter search so the user can refine manually
                setLookingUp(false)
                setOpen(false)
                navigate({ to: "/voters", search: { q }, replace: true })
              } catch {
                // Voter search API error — fall back to voter search page
                if (cancelled) return
                setLookingUp(false)
                setOpen(false)
                navigate({ to: "/voters", search: { q }, replace: true })
              }
              return
            }
          } catch {
            // Ignore per-frame detection errors and continue scanning
          }
          rafRef.current = requestAnimationFrame(() => {
            void scan()
          })
        }

        void scan()
      } catch (e: unknown) {
        if (cancelled) return
        stopCameraStream()
        let message = "Unable to access camera. Please try again."
        if (e instanceof Error) {
          if (e.name === "NotAllowedError") {
            message =
              "Camera access denied. Please allow camera access and try again."
          } else if (e.name === "NotFoundError") {
            message = "No camera found. Please connect a camera and try again."
          } else if (e.name === "NotReadableError") {
            message =
              "Camera is in use by another application. Please close other apps using the camera and try again."
          }
        }
        setError(message)
        setScanning(false)
      }
    }

    void startScanning()

    return () => {
      cancelled = true
      stopCameraStream()
    }
  }, [open, stopCameraStream, stopCamera, navigate])

  if (!isAuthenticated) return null

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <CreditCard className="h-4 w-4 mr-2" />
        Scan License
      </Button>

      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen)
          if (!isOpen) {
            setError(null)
            setLookingUp(false)
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Scan Driver's License</DialogTitle>
            <DialogDescription>
              Point your camera at the PDF417 barcode on the back of the
              driver's license to search for voter registration.
            </DialogDescription>
          </DialogHeader>

          <div className="relative aspect-video bg-black rounded-md overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
              autoPlay
            />
            {scanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-white/60 rounded w-4/5 h-2/5" />
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
                <p className="text-sm text-white text-center">{error}</p>
              </div>
            )}
          </div>

          {scanning && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning... Hold the barcode steady
            </div>
          )}

          {lookingUp && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Looking up voter...
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
