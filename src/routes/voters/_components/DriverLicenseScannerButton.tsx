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

/** Parse AAMVA-encoded PDF417 barcode data from a US driver's license. */
function parseAAMVA(raw: string): { firstName?: string; lastName?: string } {
  const fields: Record<string, string> = {}
  // Each field is a 3-uppercase-letter code followed by data until CR/LF
  const fieldRegex = /([A-Z]{3})([^\r\n]*)/g
  let match: RegExpExecArray | null
  while ((match = fieldRegex.exec(raw)) !== null) {
    const value = match[2].trim()
    if (value) fields[match[1]] = value
  }
  // AAMVA field codes: DCS = family name, DAC = first name
  return { firstName: fields["DAC"], lastName: fields["DCS"] }
}

export function DriverLicenseScannerButton() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
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

    if (!("BarcodeDetector" in window)) {
      setError(
        "Barcode scanning requires Chrome or Edge. Please try a supported browser.",
      )
      return
    }

    let cancelled = false

    async function startScanning() {
      try {
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
        await video!.play()

        const detector = new BarcodeDetector({ formats: ["pdf417"] })
        setScanning(true)

        async function scan() {
          if (cancelled) return
          try {
            const barcodes = await detector.detect(video!)
            if (barcodes.length > 0) {
              const parsed = parseAAMVA(barcodes[0].rawValue)
              const q =
                [parsed.firstName, parsed.lastName].filter(Boolean).join(" ") ||
                undefined
              stopCamera()
              setOpen(false)
              navigate({ to: "/voters", search: { q } })
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
        setError(
          e instanceof Error && e.name === "NotAllowedError"
            ? "Camera access denied. Please allow camera access and try again."
            : "Unable to access camera. Please try again.",
        )
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
          if (!isOpen) setError(null)
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
            />
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-white/60 rounded w-4/5 h-2/5" />
              </div>
            )}
          </div>

          {scanning && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning... Hold the barcode steady
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </DialogContent>
      </Dialog>
    </>
  )
}
