import { describe, it, expect } from "vitest"
import { extractDistrictNumber } from "@/hooks/useDistrictBoundary"

describe("extractDistrictNumber", () => {
  it("extracts and zero-pads single-digit district number", () => {
    expect(extractDistrictNumber("US Congressional District 5")).toBe("005")
  })

  it("extracts and zero-pads two-digit district number", () => {
    expect(extractDistrictNumber("State Senate District 18")).toBe("018")
  })

  it("extracts three-digit district number without padding", () => {
    expect(extractDistrictNumber("State House District 145")).toBe("145")
  })

  it("handles trailing whitespace after the number", () => {
    expect(extractDistrictNumber("District 42  ")).toBe("042")
  })

  it("returns null when no number is present", () => {
    expect(extractDistrictNumber("Sheriff")).toBeNull()
  })

  it("returns null for empty string", () => {
    expect(extractDistrictNumber("")).toBeNull()
  })

  it("extracts number from 'State Senate - District 18' format", () => {
    expect(extractDistrictNumber("State Senate - District 18")).toBe("018")
  })

  it("extracts number from 'House District 101' format", () => {
    expect(extractDistrictNumber("House District 101")).toBe("101")
  })
})
