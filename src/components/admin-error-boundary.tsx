import React from "react"
import { PermissionErrorComponent } from "@/components/permission-error"
import { AuthenticationError, PermissionError } from "@/types/admin"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface AdminErrorBoundaryProps {
  children: React.ReactNode
}

interface AdminErrorBoundaryState {
  error: Error | null
}

/**
 * Error boundary for admin pages
 *
 * Catches errors during rendering and displays appropriate error UI:
 * - AuthenticationError/PermissionError: Shows PermissionErrorComponent
 * - Other errors: Shows generic error message with reset button
 */
export class AdminErrorBoundary extends React.Component<
  AdminErrorBoundaryProps,
  AdminErrorBoundaryState
> {
  constructor(props: AdminErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): AdminErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.error("Admin page error:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ error: null })
    window.location.reload()
  }

  render() {
    if (this.state.error) {
      // Handle auth/permission errors with specialized component
      if (
        this.state.error instanceof AuthenticationError ||
        this.state.error instanceof PermissionError
      ) {
        return <PermissionErrorComponent error={this.state.error} />
      }

      // Generic error fallback
      return (
        <div className="container mx-auto p-6 max-w-2xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something Went Wrong</AlertTitle>
            <AlertDescription>
              <p className="mb-4">
                {this.state.error.message || "An unexpected error occurred"}
              </p>
              <Button onClick={this.handleReset} variant="outline">
                Reload Page
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    return this.props.children
  }
}
