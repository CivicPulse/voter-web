import { Link } from "@tanstack/react-router"
import { Map, BarChart3, Users, Layers, LogIn } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "welcome_dismissed"

export function WelcomeModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to Voter Data Explorer</DialogTitle>
          <DialogDescription>
            An open-source tool for exploring election results, elected
            officials, boundaries, and demographics across Georgia.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <h3 className="text-sm font-medium">Getting started</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Map className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Click any county on the map to view its details, demographics,
                and district boundaries.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <BarChart3 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Explore election results with candidate-colored maps at both
                county and precinct levels.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Users className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                View current elected officials for congressional, state house,
                and state senate districts.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Layers className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Toggle district overlays to see how political boundaries
                intersect with counties.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <LogIn className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Sign in to access voter registration data and the address lookup
                tool.
              </span>
            </li>
          </ul>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" asChild>
            <Link to="/about" onClick={handleDismiss}>
              Learn more
            </Link>
          </Button>
          <Button onClick={handleDismiss}>Get started</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
