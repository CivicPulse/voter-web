import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useCreateExport } from "@/lib/hooks/use-export-jobs"
import type { ExportType } from "@/types/admin"

interface ExportRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportRequestDialog({
  open,
  onOpenChange,
}: ExportRequestDialogProps) {
  const [exportType, setExportType] = useState<ExportType>("voters")
  const createExportMutation = useCreateExport()

  const handleCreateExport = () => {
    createExportMutation.mutate(
      { export_type: exportType },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Data Export</DialogTitle>
          <DialogDescription>
            Generate a bulk data export for download
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="exportType">Export Type</Label>
            <Select
              value={exportType}
              onValueChange={(value) => setExportType(value as ExportType)}
            >
              <SelectTrigger id="exportType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="voters">Voter Data</SelectItem>
                <SelectItem value="boundaries">Boundary Data</SelectItem>
                <SelectItem value="full_database">Full Database</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {exportType === "voters" && "Export all voter registration records"}
              {exportType === "boundaries" && "Export all boundary geometries"}
              {exportType === "full_database" && "Export complete database snapshot"}
            </p>
          </div>

          {createExportMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to create export: {createExportMutation.error.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              The export will be processed in the background. You'll be able to
              download the file once processing is complete.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createExportMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateExport}
            disabled={createExportMutation.isPending}
          >
            {createExportMutation.isPending ? "Creating..." : "Create Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
