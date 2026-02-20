import { ABBREV_TO_NAME } from "@/lib/states"

export function resolveHeaderTitle(ctx: {
  isOnDistrictRoute: boolean
  district: { name: string; boundary_type: string } | undefined
  isOnCountyRoute: boolean
  county: { name: string } | undefined
  isOnStatePage: boolean
  stateAbbrev: string | undefined
  isOnLookupPage: boolean
  isOnHomePage: boolean
}): string | null {
  if (ctx.isOnDistrictRoute && ctx.district) {
    const typeLabel = ctx.district.boundary_type.replaceAll("_", " ")
    return `${ctx.district.name} (${typeLabel})`
  }
  if (ctx.isOnCountyRoute && ctx.county) return `${ctx.county.name} County`
  if (ctx.isOnStatePage && ctx.stateAbbrev) {
    return ABBREV_TO_NAME[ctx.stateAbbrev] ?? ctx.stateAbbrev.toUpperCase()
  }
  if (ctx.isOnLookupPage) return "Address Lookup"
  if (ctx.isOnHomePage) return "Voter Web"
  return null
}
