import { useState } from "react"
import { AlertCircle, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useCandidates } from "@/lib/hooks/use-candidates"
import { useCandidateDetail } from "@/lib/hooks/use-candidates"
import { useRaceResults } from "@/lib/hooks/use-race-results"
import { useUserRole } from "@/lib/hooks/use-user-role"
import { useDeleteCandidate } from "@/lib/hooks/use-admin-candidates"
import { sortCandidates } from "@/types/candidates"
import { CandidateCard } from "@/components/elections/CandidateCard"
import { AdminCandidateDialog } from "@/components/elections/AdminCandidateDialog"
import type { CandidateSummary } from "@/types/candidates"

interface CandidateListProps {
  electionId: string
}

export function CandidateList({ electionId }: CandidateListProps) {
  const {
    data: candidatesData,
    isLoading,
    error,
    refetch,
  } = useCandidates(electionId, { page_size: 100 })

  const { data: raceData } = useRaceResults(electionId)
  const { data: userProfile } = useUserRole()
  const isAdmin = userProfile?.role === "admin"

  const deleteMutation = useDeleteCandidate()

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [editCandidateId, setEditCandidateId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
  } | null>(null)

  // Determine candidates to display
  const apiCandidates = candidatesData?.items ?? []
  const hasApiCandidates = apiCandidates.length > 0
  let displayCandidates: CandidateSummary[]

  if (apiCandidates.length > 0) {
    displayCandidates = sortCandidates(apiCandidates)
  } else if (raceData?.results.candidates && raceData.results.candidates.length > 0) {
    displayCandidates = raceData.results.candidates.map((rc) => ({
      id: rc.id,
      election_id: electionId,
      full_name: rc.name,
      party: rc.political_party,
      photo_url: null,
      ballot_order: rc.ballot_order ?? null,
      filing_status: "qualified" as const,
      is_incumbent: false,
      created_at: "",
    }))
    displayCandidates = sortCandidates(displayCandidates)
  } else {
    displayCandidates = []
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(
      { candidateId: deleteTarget.id, electionId },
      { onSettled: () => setDeleteTarget(null) },
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg border border-destructive/50 bg-destructive/5">
        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
        <p className="text-sm text-destructive">Failed to load candidates.</p>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Candidates</h3>
        {isAdmin && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Candidate
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && displayCandidates.length === 0 && (
        <p className="text-sm text-muted-foreground py-4">
          Candidates not yet announced.
        </p>
      )}

      {!isLoading && displayCandidates.length > 0 && (
        <div className="space-y-2">
          {displayCandidates.map((candidate) => (
            <div key={candidate.id} className="flex items-center gap-2">
              <div className="flex-1">
                <CandidateCard candidate={candidate} />
              </div>
              {isAdmin && hasApiCandidates && (
                <div className="flex flex-col gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditCandidateId(candidate.id)}
                    aria-label={`Edit ${candidate.full_name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() =>
                      setDeleteTarget({
                        id: candidate.id,
                        name: candidate.full_name,
                      })
                    }
                    aria-label={`Delete ${candidate.full_name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <AdminCandidateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        electionId={electionId}
      />

      {/* Edit dialog */}
      {editCandidateId && (
        <EditCandidateDialog
          candidateId={editCandidateId}
          electionId={electionId}
          onClose={() => setEditCandidateId(null)}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete candidate?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{deleteTarget?.name}</strong> and all their links.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/** Wrapper that fetches candidate detail before opening the edit dialog */
function EditCandidateDialog({
  candidateId,
  electionId,
  onClose,
}: {
  candidateId: string
  electionId: string
  onClose: () => void
}) {
  const { data: candidate } = useCandidateDetail(candidateId)

  return (
    <AdminCandidateDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      mode="edit"
      electionId={electionId}
      candidate={candidate}
    />
  )
}
