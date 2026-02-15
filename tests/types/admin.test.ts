import { describe, it, expect } from "vitest"
import {
  AuthenticationError,
  PermissionError,
  NetworkError,
  isActiveJob,
  isTerminalJob,
  isFailedImport,
  isCompletedExport,
  getImportProgress,
} from "@/types/admin"
import type { ImportJob, ExportJob } from "@/types/admin"

describe("Error classes", () => {
  it("AuthenticationError has correct name and default message", () => {
    const err = new AuthenticationError()
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe("AuthenticationError")
    expect(err.message).toBe(
      "Your session has expired. Please log in again.",
    )
  })

  it("AuthenticationError accepts custom message", () => {
    const err = new AuthenticationError("Token invalid")
    expect(err.message).toBe("Token invalid")
  })

  it("PermissionError has correct name and default message", () => {
    const err = new PermissionError()
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe("PermissionError")
    expect(err.message).toBe(
      "You don't have permission to access this feature.",
    )
  })

  it("PermissionError accepts custom message", () => {
    const err = new PermissionError("Admin only")
    expect(err.message).toBe("Admin only")
  })

  it("NetworkError has correct name and default message", () => {
    const err = new NetworkError()
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe("NetworkError")
    expect(err.message).toBe("Network connection failed. Retrying...")
  })

  it("NetworkError accepts custom message", () => {
    const err = new NetworkError("DNS failure")
    expect(err.message).toBe("DNS failure")
  })
})

describe("isActiveJob", () => {
  it("returns true for pending jobs", () => {
    expect(isActiveJob({ status: "pending" } as ImportJob)).toBe(true)
  })

  it("returns true for processing jobs", () => {
    expect(isActiveJob({ status: "processing" } as ImportJob)).toBe(true)
  })

  it("returns false for completed jobs", () => {
    expect(isActiveJob({ status: "completed" } as ExportJob)).toBe(false)
  })

  it("returns false for failed jobs", () => {
    expect(isActiveJob({ status: "failed" } as ImportJob)).toBe(false)
  })
})

describe("isTerminalJob", () => {
  it("returns true for completed jobs", () => {
    expect(isTerminalJob({ status: "completed" } as ExportJob)).toBe(true)
  })

  it("returns true for failed jobs", () => {
    expect(isTerminalJob({ status: "failed" } as ImportJob)).toBe(true)
  })

  it("returns false for pending jobs", () => {
    expect(isTerminalJob({ status: "pending" } as ImportJob)).toBe(false)
  })

  it("returns false for processing jobs", () => {
    expect(isTerminalJob({ status: "processing" } as ExportJob)).toBe(false)
  })
})

describe("isFailedImport", () => {
  it("returns true for failed import", () => {
    const job = {
      status: "failed",
      error_message: "Bad data",
    } as ImportJob
    expect(isFailedImport(job)).toBe(true)
  })

  it("returns false for completed import", () => {
    const job = { status: "completed" } as ImportJob
    expect(isFailedImport(job)).toBe(false)
  })
})

describe("isCompletedExport", () => {
  it("returns true for completed export", () => {
    const job = {
      status: "completed",
      download_url: "https://example.com/file.zip",
    } as ExportJob
    expect(isCompletedExport(job)).toBe(true)
  })

  it("returns false for pending export", () => {
    const job = { status: "pending" } as ExportJob
    expect(isCompletedExport(job)).toBe(false)
  })
})

describe("getImportProgress", () => {
  it("returns percentage for processing job", () => {
    const job = {
      status: "processing",
      total_records: 200,
      processed_records: 100,
    } as ImportJob
    expect(getImportProgress(job)).toBe(50)
  })

  it("returns 100 for completed job", () => {
    const job = { status: "completed" } as ImportJob
    expect(getImportProgress(job)).toBe(100)
  })

  it("returns null for pending job", () => {
    const job = { status: "pending" } as ImportJob
    expect(getImportProgress(job)).toBeNull()
  })

  it("returns null for failed job", () => {
    const job = { status: "failed" } as ImportJob
    expect(getImportProgress(job)).toBeNull()
  })
})
