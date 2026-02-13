import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { Search, LocateFixed, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { requireAuth } from "@/lib/auth-guards"

export const Route = createFileRoute("/lookup/")({
  component: LookupPage,
  beforeLoad: ({ location }) => {
    requireAuth(location.pathname)
  },
})

const addressSchema = z.object({
  address: z.string().min(1, "Address is required"),
})

type AddressFormData = z.infer<typeof addressSchema>

function LookupPage() {
  const navigate = useNavigate()
  const [geoError, setGeoError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  })

  const onSubmit = (data: AddressFormData) => {
    navigate({
      to: "/lookup/results",
      search: { address: data.address },
    })
  }

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.")
      return
    }

    setGeoError(null)
    setIsLocating(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)
        navigate({
          to: "/lookup/results",
          search: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        })
      },
      (error) => {
        setIsLocating(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError(
              "Location permission denied. Please enable location access.",
            )
            break
          case error.POSITION_UNAVAILABLE:
            setGeoError("Location information is unavailable.")
            break
          case error.TIMEOUT:
            setGeoError("Location request timed out.")
            break
          default:
            setGeoError(
              "An unknown error occurred while getting your location.",
            )
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Address Lookup
          </CardTitle>
          <CardDescription>
            Look up all districts for an address or your current location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                type="text"
                placeholder="123 Main St, Atlanta, GA 30303"
                aria-invalid={!!errors.address}
                {...register("address")}
              />
              {errors.address && (
                <p className="text-sm text-destructive">
                  {errors.address.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full">
              <Search className="h-4 w-4" />
              Look Up Address
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleUseMyLocation}
            disabled={isLocating}
          >
            {isLocating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Getting location...
              </>
            ) : (
              <>
                <LocateFixed className="h-4 w-4" />
                Use My Location
              </>
            )}
          </Button>

          {geoError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{geoError}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
