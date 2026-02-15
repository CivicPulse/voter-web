/**
 * Maximum file size for uploads (100MB in bytes)
 */
export const MAX_FILE_SIZE = 100 * 1024 * 1024

/**
 * Accepted MIME types and extensions for voter import files
 */
export const VOTER_FILE_TYPES = ["text/csv", "application/csv", ".csv"] as const

/**
 * Accepted MIME types and extensions for boundary import files
 */
export const BOUNDARY_FILE_TYPES = [
  "application/geo+json",
  "application/json",
  ".geojson",
  ".json",
  "application/zip",
  "application/x-zip-compressed",
  ".zip",
] as const

/**
 * File validation error types
 */
export interface FileValidationError {
  type: "size" | "type" | "unknown" | "shapefile"
  message: string
  maxSize?: number
  actualSize?: number
  allowedTypes?: readonly string[]
  actualType?: string
}

/**
 * File validation result
 */
export type FileValidationResult = true | FileValidationError

/**
 * Validate file type against allowed types
 */
export function validateFileType(file: File, allowedTypes: readonly string[]): boolean {
  return allowedTypes.some((type) => {
    if (type.startsWith(".")) {
      return file.name.toLowerCase().endsWith(type)
    }
    return file.type === type
  })
}

/**
 * Validate file size
 */
export function validateFileSize(
  file: File,
  maxSize: number = MAX_FILE_SIZE
): boolean {
  return file.size <= maxSize
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

/**
 * Validate a voter import file (CSV)
 */
export function validateVoterFile(file: File): FileValidationResult {
  if (!validateFileSize(file)) {
    return {
      type: "size",
      message: `File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`,
      maxSize: MAX_FILE_SIZE,
      actualSize: file.size,
    }
  }

  if (!validateFileType(file, VOTER_FILE_TYPES)) {
    return {
      type: "type",
      message: "File must be in CSV format",
      allowedTypes: VOTER_FILE_TYPES,
      actualType: file.type,
    }
  }

  return true
}

/**
 * Validate a boundary import file (GeoJSON or ZIP/shapefile)
 *
 * For ZIP files, this performs basic validation. The backend will verify
 * that the ZIP contains at least one .shp file for shapefile imports.
 */
export function validateBoundaryFile(file: File): FileValidationResult {
  if (!validateFileSize(file)) {
    return {
      type: "size",
      message: `File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`,
      maxSize: MAX_FILE_SIZE,
      actualSize: file.size,
    }
  }

  if (!validateFileType(file, BOUNDARY_FILE_TYPES)) {
    return {
      type: "type",
      message: "File must be in GeoJSON format (.geojson, .json) or zipped Shapefile (.zip)",
      allowedTypes: BOUNDARY_FILE_TYPES,
      actualType: file.type,
    }
  }

  // For ZIP files, we can't validate shapefile contents client-side
  // The backend will check for required .shp files
  const isZip = file.name.toLowerCase().endsWith('.zip') ||
                file.type === 'application/zip' ||
                file.type === 'application/x-zip-compressed'

  if (isZip) {
    // Provide a helpful note that backend will validate shapefile structure
    // This is informational, not a validation error
  }

  return true
}
