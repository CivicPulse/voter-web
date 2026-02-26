import { createFileRoute, Link } from "@tanstack/react-router"
import {
  ChevronRight,
  ExternalLink,
  Globe,
  Loader2,
} from "lucide-react"
import { useCandidateDetail } from "@/lib/hooks/use-candidates"
import { getCandidateInitials, FILING_STATUS_LABELS } from "@/types/candidates"
import type { CandidateLinkType } from "@/types/candidates"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const Route = createFileRoute("/candidates/$candidateId")({
  component: CandidateDetailPage,
})

/** Map link_type to a Lucide icon component and display label */
function linkMeta(linkType: CandidateLinkType) {
  switch (linkType) {
    case "website":
      return { Icon: Globe, label: "Website" }
    case "campaign":
      return { Icon: ExternalLink, label: "Campaign" }
    case "facebook":
      return { Icon: ExternalLink, label: "Facebook" }
    case "twitter":
      return { Icon: ExternalLink, label: "Twitter/X" }
    case "instagram":
      return { Icon: ExternalLink, label: "Instagram" }
    case "youtube":
      return { Icon: ExternalLink, label: "YouTube" }
    case "linkedin":
      return { Icon: ExternalLink, label: "LinkedIn" }
    case "other":
      return { Icon: ExternalLink, label: "Link" }
  }
}

function CandidateDetailPage() {
  const { candidateId } = Route.useParams()
  const { data: candidate, isLoading, error } = useCandidateDetail(candidateId)

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error / 404 state
  if (error || !candidate) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl text-center">
        <p className="text-destructive mb-4">
          {error?.message ?? "Candidate not found."}
        </p>
        <Link
          to="/elections"
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Back to elections
        </Link>
      </div>
    )
  }

  const initials = getCandidateInitials(candidate.full_name)

  return (
    <div className="container mx-auto px-4 py-4 sm:p-6 max-w-3xl">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4"
      >
        <Link
          to="/elections"
          className="hover:text-foreground transition-colors"
        >
          Elections
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground truncate">{candidate.full_name}</span>
      </nav>

      {/* Header: Avatar + Name + Badges */}
      <div className="flex items-start gap-4 mb-6">
        <Avatar className="h-16 w-16 text-lg">
          {candidate.photo_url ? (
            <AvatarImage src={candidate.photo_url} alt={candidate.full_name} />
          ) : null}
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">{candidate.full_name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {candidate.party && (
              <Badge variant="secondary">{candidate.party}</Badge>
            )}
            {candidate.is_incumbent && (
              <Badge variant="outline">Incumbent</Badge>
            )}
            {candidate.filing_status !== "qualified" && (
              <Badge variant="destructive">
                {FILING_STATUS_LABELS[candidate.filing_status] ?? candidate.filing_status}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Bio section */}
      {candidate.bio && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {candidate.bio}
            </p>
          </CardContent>
        </Card>
      )}

      {/* External links */}
      {candidate.links.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Links</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {candidate.links.map((link) => {
                const { Icon, label } = linkMeta(link.link_type)
                return (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline underline-offset-4 transition-colors"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {link.label || label}
                    </a>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Election results */}
      {candidate.result_vote_count != null && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Election Results</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Votes Received</dt>
                <dd className="font-semibold text-lg">
                  {candidate.result_vote_count.toLocaleString()}
                </dd>
              </div>
              {candidate.result_political_party && (
                <div>
                  <dt className="text-muted-foreground">Party</dt>
                  <dd className="font-semibold">
                    {candidate.result_political_party}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Back navigation */}
      <Link
        to="/elections/$electionDate"
        params={{ electionDate: candidate.election_id }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        &larr; Back to election
      </Link>
    </div>
  )
}
