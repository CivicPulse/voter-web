/** Top-level structure of the Georgia SOS election results JSON feed */
export interface SosFeedResponse {
  electionDate: string | null
  electionName: string | null
  createdAt: string | null
  results: SosFeedResults | null
  localResults: unknown[]
}

export interface SosFeedResults {
  id: string
  name: string
  ballotItems: SosFeedBallotItem[] | null
  reportingStatuses: unknown[]
}

export interface SosFeedBallotItem {
  type: string | null
  id: string
  name: string | null
  contestType: string | null
  precinctsParticipating: number | null
  precinctsReporting: number | null
  ballotOptions: unknown[]
}
