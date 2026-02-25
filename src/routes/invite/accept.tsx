import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState, useEffect } from "react"
import { Loader2, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react"
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
import {
  acceptInviteSchema,
  type AcceptInviteFormValues,
} from "@/lib/schemas/user-form"
import { useAcceptInvite } from "@/lib/hooks/use-invites"
import { HTTPError } from "ky"

const acceptSearchSchema = z.object({
  token: z.string().optional().catch(undefined),
})

export const Route = createFileRoute("/invite/accept")({
  component: AcceptInvitePage,
  validateSearch: acceptSearchSchema,
})

function AcceptInvitePage() {
  const { token } = Route.useSearch()
  const navigate = useNavigate()
  const acceptInviteMutation = useAcceptInvite()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors },
  } = useForm<AcceptInviteFormValues>({
    resolver: zodResolver(acceptInviteSchema),
  })

  // Auto-redirect to login after successful acceptance
  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => {
      navigate({ to: "/login" })
    }, 3000)
    return () => clearTimeout(timer)
  }, [success, navigate])

  if (!token) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Invalid Invitation
            </CardTitle>
            <CardDescription>
              No invitation token was provided. Please check the link from your
              invitation email.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Account Created
            </CardTitle>
            <CardDescription>
              Your account has been created successfully. Redirecting to sign
              in...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const onSubmit = async (data: AcceptInviteFormValues) => {
    setError(null)

    acceptInviteMutation.mutate(
      {
        token,
        username: data.username,
        password: data.password,
      },
      {
        onSuccess: () => {
          setSuccess(true)
        },
        onError: async (err) => {
          if (err instanceof HTTPError) {
            const status = err.response.status
            try {
              const body = await err.response.json<{ detail?: string }>()
              const detail = body.detail ?? ""

              if (status === 400) {
                if (detail.toLowerCase().includes("expired")) {
                  setError(
                    "This invitation has expired. Please ask your administrator to send a new one."
                  )
                } else if (detail.toLowerCase().includes("already accepted") || detail.toLowerCase().includes("already been accepted")) {
                  setError("This invitation has already been accepted.")
                } else {
                  setError(
                    "This invitation link is invalid. Please check the link from your invitation email."
                  )
                }
              } else if (status === 409) {
                setFieldError("username", {
                  type: "manual",
                  message: "This username is already taken. Please choose a different one.",
                })
              } else {
                setError(
                  "An unexpected error occurred. Please try again."
                )
              }
            } catch {
              setError("An unexpected error occurred. Please try again.")
            }
          } else {
            setError("An unexpected error occurred. Please try again.")
          }
        },
      }
    )
  }

  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create Your Account
          </CardTitle>
          <CardDescription>
            Set up your username and password to accept the invitation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="Choose a username"
                aria-invalid={!!errors.username}
                {...register("username")}
              />
              {errors.username && (
                <p className="text-sm text-destructive">
                  {errors.username.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                3-50 characters, letters, numbers, and underscores only
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Choose a password"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters, must include letters and numbers
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                aria-invalid={!!errors.confirmPassword}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={acceptInviteMutation.isPending}
            >
              {acceptInviteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
