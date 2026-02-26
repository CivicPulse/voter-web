import { Globe } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Election } from "@/types/elections"

interface ElectionMetadataProps {
  election: Election
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function ElectionMetadata({ election }: ElectionMetadataProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Date</span>
        <span className="font-medium">{formatDate(election.election_date)}</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Type</span>
        <span className="font-medium">{capitalize(election.election_type)}</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Status</span>
        {election.status === "active" ? (
          <Badge className="bg-green-600 text-white">Active</Badge>
        ) : (
          <Badge variant="outline">Finalized</Badge>
        )}
      </div>

      {election.data_source_url && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Data Source</span>
          <a
            href={election.data_source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            <Globe className="h-3.5 w-3.5" />
            View Source
          </a>
        </div>
      )}
    </div>
  )
}
