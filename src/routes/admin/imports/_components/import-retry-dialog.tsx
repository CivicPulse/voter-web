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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import {
  useCreateVoterImport,
  useCreateBoundaryImport,
} from "@/lib/hooks/use-import-jobs"
import {
  validateVoterFile,
  validateBoundaryFile,
  formatFileSize,
} from "@/lib/utils/file-validation"
import type { ImportJob } from "@/types/admin"

interface ImportRetryDialogProps {
  job: ImportJob
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportRetryDialog({
  job,
  open,
  onOpenChange,
}: ImportRetryDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const createVoterMutation = useCreateVoterImport()
  const createBoundaryMutation = useCreateBoundaryImport()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setValidationError(null)

    // Validate based on previous job's import type
    const validationResult =
      job.import_type === "voters"
        ? validateVoterFile(file)
        : validateBoundaryFile(file)

    if (validationResult !== true) {
      setValidationError(validationResult.message)
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
    setShowConfirm(true)
  }

  const handleConfirmRetry = () => {
    if (!selectedFile) return

    if (job.import_type === "voters") {
      createVoterMutation.mutate(selectedFile, {
        onSuccess: () => {
          handleClose()
        },
      })
    } else {
      createBoundaryMutation.mutate(
        { file: selectedFile },
        {
          onSuccess: () => {
            handleClose()
          },
        }
      )
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setShowConfirm(false)
    setValidationError(null)
    onOpenChange(false)
  }

  const handleCancelConfirm = () => {
    setShowConfirm(false)
    setSelectedFile(null)
  }

  const isUploading =
    createVoterMutation.isPending || createBoundaryMutation.isPending
  const uploadError = createVoterMutation.error || createBoundaryMutation.error

  return (
    <>
      {/* File Selection Dialog */}
      <Dialog open={open && !showConfirm} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retry Import</DialogTitle>
            <DialogDescription>
              Upload a corrected file to retry this import
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-3 space-y-1">
              <div className="text-sm font-medium">Previous Import</div>
              <div className="text-sm text-muted-foreground">
                File: {job.filename}
              </div>
              <div className="text-sm text-muted-foreground">
                Type: {job.import_type}
              </div>
              {job.error_message && (
                <div className="text-sm text-destructive mt-2">
                  Error: {job.error_message}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="retryFile">Select Corrected File</Label>
              <Input
                id="retryFile"
                type="file"
                accept={
                  job.import_type === "voters"
                    ? ".csv"
                    : ".geojson,.json,.zip"
                }
                onChange={handleFileSelect}
              />
              <p className="text-xs text-muted-foreground">
                Upload a corrected {job.import_type === "voters" ? "CSV" : "GeoJSON/Shapefile"} file
                (max 100MB)
              </p>
            </div>

            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Upload failed: {uploadError.message}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Retry</DialogTitle>
            <DialogDescription>
              Review the file details before creating a new import job
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">File:</div>
              <div className="text-muted-foreground">{selectedFile?.name}</div>

              <div className="font-medium">Size:</div>
              <div className="text-muted-foreground">
                {selectedFile ? formatFileSize(selectedFile.size) : ""}
              </div>

              <div className="font-medium">Type:</div>
              <div className="text-muted-foreground">
                {job.import_type === "voters" ? "Voter Import" : "Boundary Import"}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              This will create a new import job. The previous failed job will
              remain in the history.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelConfirm}>
              Cancel
            </Button>
            <Button onClick={handleConfirmRetry} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Retry Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
