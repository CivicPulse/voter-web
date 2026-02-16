import { describe, it, expect } from "vitest"
import { escapeHtml, stripCountySuffix } from "@/lib/utils"

describe("escapeHtml", () => {
  it("escapes ampersand", () => {
    expect(escapeHtml("A & B")).toBe("A &amp; B")
  })

  it("escapes angle brackets", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;",
    )
  })

  it("escapes double quotes", () => {
    expect(escapeHtml('value="test"')).toBe("value=&quot;test&quot;")
  })

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#039;s")
  })

  it("handles multiple special characters in one string", () => {
    expect(escapeHtml('<a href="x">&</a>')).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;",
    )
  })

  it("returns unmodified string when no special characters", () => {
    expect(escapeHtml("Jane Doe (Dem)")).toBe("Jane Doe (Dem)")
  })

  it("handles empty string", () => {
    expect(escapeHtml("")).toBe("")
  })
})

describe("stripCountySuffix", () => {
  it("strips ' County' suffix", () => {
    expect(stripCountySuffix("Bibb County")).toBe("Bibb")
  })

  it("strips case-insensitively", () => {
    expect(stripCountySuffix("Bibb COUNTY")).toBe("Bibb")
    expect(stripCountySuffix("Bibb county")).toBe("Bibb")
  })

  it("returns bare name unchanged", () => {
    expect(stripCountySuffix("Bibb")).toBe("Bibb")
  })

  it("does not strip 'County' from the middle of a name", () => {
    expect(stripCountySuffix("County Line")).toBe("County Line")
  })

  it("handles empty string", () => {
    expect(stripCountySuffix("")).toBe("")
  })
})
