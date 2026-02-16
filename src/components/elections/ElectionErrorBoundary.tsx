import React from "react"
import { Link } from "@tanstack/react-router"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface ElectionErrorBoundaryProps {
  children: React.ReactNode
}

interface ElectionErrorBoundaryState {
  error: Error | null
}

export class ElectionErrorBoundary extends React.Component<
  ElectionErrorBoundaryProps,
  ElectionErrorBoundaryState
> {
  constructor(props: ElectionErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ElectionErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Election page error:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="container mx-auto p-6 max-w-2xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something Went Wrong</AlertTitle>
            <AlertDescription>
              <p className="mb-4">
                {this.state.error.message ||
                  "An unexpected error occurred while loading election data."}
              </p>
              <div className="flex gap-3">
                <Button onClick={this.handleReset} variant="outline">
                  Try Again
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/elections">Back to Elections</Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    return this.props.children
  }
}
