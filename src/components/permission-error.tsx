import { AlertCircle, Home, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useNavigate } from "@tanstack/react-router"
import { AuthenticationError, PermissionError } from "@/types/admin"

interface PermissionErrorProps {
  error: AuthenticationError | PermissionError | Error
}

/**
 * Displays permission-related errors with appropriate actions
 *
 * - Authentication errors (session expired): Show login button
 * - Permission errors (access denied): Show go home button
 * - Generic errors: Show both options
 */
export function PermissionErrorComponent({ error }: PermissionErrorProps) {
  const navigate = useNavigate()

  const isAuthError = error instanceof AuthenticationError
  const isPermError = error instanceof PermissionError

  const handleLogin = () => {
    // Clear any stale tokens
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    // Navigate to login (you'll need to adjust this path based on your auth setup)
    navigate({ to: "/" })
  }

  const handleGoHome = () => {
    navigate({ to: "/" })
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>
          {isAuthError && "Session Expired"}
          {isPermError && "Access Denied"}
          {!isAuthError && !isPermError && "Error"}
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-4">{error.message}</p>
          <div className="flex gap-2">
            {(isAuthError || !isPermError) && (
              <Button onClick={handleLogin} size="sm">
                <LogIn className="h-4 w-4 mr-2" />
                Log In
              </Button>
            )}
            {(isPermError || !isAuthError) && (
              <Button onClick={handleGoHome} variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
