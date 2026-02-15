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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import type { ImportType } from "@/types/admin"

interface ImportUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportUploadDialog({
  open,
  onOpenChange,
}: ImportUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importType, setImportType] = useState<ImportType>("voters")
  const [showConfirm, setShowConfirm] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const createVoterMutation = useCreateVoterImport()
  const createBoundaryMutation = useCreateBoundaryImport()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setValidationError(null)

    // Validate based on import type
    const validationResult =
      importType === "voters"
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

  const handleConfirmUpload = () => {
    if (!selectedFile) return

    if (importType === "voters") {
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
            <DialogTitle>Upload Import File</DialogTitle>
            <DialogDescription>
              Select the type of import and choose a file to upload
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="importType">Import Type</Label>
              <Select
                value={importType}
                onValueChange={(value) => setImportType(value as ImportType)}
              >
                <SelectTrigger id="importType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="voters">Voter Data (CSV)</SelectItem>
                  <SelectItem value="boundaries">
                    Boundary Data (GeoJSON/Shapefile)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {importType === "voters"
                  ? "CSV file containing voter registration data"
                  : "GeoJSON or zipped Shapefile containing boundary geometries"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                accept={
                  importType === "voters"
                    ? ".csv"
                    : ".geojson,.json,.zip"
                }
                onChange={handleFileSelect}
              />
              <p className="text-xs text-muted-foreground">
                Maximum file size: 100MB
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
            <DialogTitle>Confirm Import</DialogTitle>
            <DialogDescription>
              Review the file details before uploading
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
                {importType === "voters" ? "Voter Import" : "Boundary Import"}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              The import will be processed in the background. You can monitor
              progress on the imports page.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelConfirm}>
              Cancel
            </Button>
            <Button onClick={handleConfirmUpload} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Confirm Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
