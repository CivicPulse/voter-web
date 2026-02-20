import { describe, it, expect } from "vitest"
import { slugify, countySlugPath, districtSlugPath } from "@/lib/slugs"

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Ben Hill")).toBe("ben-hill")
  })

  it("strips non-alphanumeric characters", () => {
    expect(slugify("DeKalb")).toBe("dekalb")
  })

  it("trims leading/trailing hyphens", () => {
    expect(slugify(" --Hello World-- ")).toBe("hello-world")
  })

  it("handles empty string", () => {
    expect(slugify("")).toBe("")
  })
})

describe("countySlugPath", () => {
  it("builds county URL from name and full FIPS code", () => {
    expect(countySlugPath("Bibb", "13021")).toBe("/counties/ga/bibb")
  })

  it("builds county URL from name and 2-digit state FIPS", () => {
    expect(countySlugPath("Bibb", "13")).toBe("/counties/ga/bibb")
  })

  it("handles multi-word county names", () => {
    expect(countySlugPath("Ben Hill", "13")).toBe("/counties/ga/ben-hill")
  })

  it("returns empty string for unknown FIPS code", () => {
    expect(countySlugPath("Fake", "99")).toBe("")
  })
})

describe("districtSlugPath", () => {
  describe("deprecated 2-arg signature", () => {
    it("builds legacy district URL", () => {
      expect(districtSlugPath("005", "county_commission")).toBe(
        "/districts/county-commission/005",
      )
    })

    it("slugifies boundary type with underscores", () => {
      expect(districtSlugPath("018", "state_senate")).toBe(
        "/districts/state-senate/018",
      )
    })
  })

  describe("4-arg signature with state/county context", () => {
    it("builds county-scoped district URL", () => {
      expect(districtSlugPath("005", "county_commission", "ga", "Bibb")).toBe(
        "/districts/ga/bibb/county-commission/005",
      )
    })

    it("builds state-scoped district URL when county is null", () => {
      expect(districtSlugPath("018", "state_senate", "ga", null)).toBe(
        "/districts/ga/state-senate/018",
      )
    })

    it("slugifies county name in URL", () => {
      expect(
        districtSlugPath("001", "school_board", "ga", "Ben Hill"),
      ).toBe("/districts/ga/ben-hill/school-board/001")
    })

    it("handles different states", () => {
      expect(districtSlugPath("005", "county_commission", "al", "Monroe")).toBe(
        "/districts/al/monroe/county-commission/005",
      )
    })

    it("handles congressional district (state-level)", () => {
      expect(
        districtSlugPath("District 5", "congressional", "ga", null),
      ).toBe("/districts/ga/congressional/district-5")
    })
  })
})
