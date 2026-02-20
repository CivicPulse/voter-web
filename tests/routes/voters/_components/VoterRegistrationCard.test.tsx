import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { VoterRegistrationCard } from "@/routes/voters/_components/VoterRegistrationCard"
import { mockVoterDetail } from "@/test/mocks/voters"

describe("VoterRegistrationCard", () => {
  it("renders full name including middle name", () => {
    const voter = mockVoterDetail({ middle_name: "Marie" })
    render(<VoterRegistrationCard voter={voter} />)

    expect(screen.getByText("Jane Marie Smith")).toBeInTheDocument()
  })

  it("renders full name with suffix", () => {
    const voter = mockVoterDetail({ suffix: "Jr." })
    render(<VoterRegistrationCard voter={voter} />)

    expect(screen.getByText("Jane Marie Smith Jr.")).toBeInTheDocument()
  })

  it("renders name without optional fields", () => {
    const voter = mockVoterDetail({ middle_name: null, suffix: null })
    render(<VoterRegistrationCard voter={voter} />)

    expect(screen.getByText("Jane Smith")).toBeInTheDocument()
  })

  it("renders voter ID", () => {
    const voter = mockVoterDetail()
    render(<VoterRegistrationCard voter={voter} />)

    expect(screen.getByText("GA-12345678")).toBeInTheDocument()
  })

  it("renders county", () => {
    const voter = mockVoterDetail()
    render(<VoterRegistrationCard voter={voter} />)

    expect(screen.getByText("Bibb")).toBeInTheDocument()
  })

  it("renders formatted registration date", () => {
    const voter = mockVoterDetail({ registration_date: "2020-01-15" })
    render(<VoterRegistrationCard voter={voter} />)

    expect(screen.getByText("January 15, 2020")).toBeInTheDocument()
  })

  it("renders full address including apartment", () => {
    const voter = mockVoterDetail({
      address_line_1: "123 Main St, Macon, GA 31201",
      address_line_2: "Apt 4B",
    })
    render(<VoterRegistrationCard voter={voter} />)

    expect(screen.getByText(/123 Main St, Macon, GA 31201/)).toBeInTheDocument()
    expect(screen.getByText(/Apt 4B/)).toBeInTheDocument()
  })

  it("renders status badge as Active", () => {
    const voter = mockVoterDetail({ status: "Active" })
    render(<VoterRegistrationCard voter={voter} />)

    expect(screen.getByText("Active")).toBeInTheDocument()
  })

  it("renders status badge as Inactive", () => {
    const voter = mockVoterDetail({ status: "Inactive" })
    render(<VoterRegistrationCard voter={voter} />)

    expect(screen.getByText("Inactive")).toBeInTheDocument()
  })
})
