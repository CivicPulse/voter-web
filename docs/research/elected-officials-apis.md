# Elected Officials API Research

Research into official and non-official sources and APIs for retrieving current office holders by political district, focused on Georgia.

**Date:** 2026-02-13
**Relevant districts in voter-web:** Congressional Districts, State Senate Districts, State House Districts

---

## Part 1: Official Government Sources

---

## 1. Congress.gov API (Library of Congress)

The official US government API for federal legislative data, maintained by the Library of Congress.

- **Base URL:** `https://api.congress.gov/v3/member/`
- **Coverage:** US Senators and Representatives (current and historical)
- **Auth:** Free API key — register at <https://api.data.gov>
- **Rate limit:** 5,000 requests/hour
- **Format:** JSON and XML

### Congress.gov Key Endpoints

| Endpoint | Description |
|---|---|
| `/member/congress/{congress}/{state}?currentMember=true` | All current members for a state |
| `/member/congress/{congress}/{state}/{district}?currentMember=true` | Member for a specific district |

**Georgia examples** (119th Congress):

```
GET /member/congress/119/GA?currentMember=true&api_key={key}
GET /member/congress/119/GA/5?currentMember=true&api_key={key}
```

### Congress.gov Response Data

- `bioguideId` — unique identifier from Biographical Directory
- `name` — member name (last-name-first format)
- `partyName` — political party
- `state`, `district`
- `memberType` — Representative, Senator, Delegate, or Resident Commissioner
- `terms` — service history with chamber, start/end years
- `leadership` — leadership positions held
- Portrait image URL with attribution
- Official website URL
- Sponsored/cosponsored legislation counts

### Congress.gov Documentation

- [API overview](https://www.loc.gov/apis/additional-apis/congress-dot-gov-api/)
- [Member endpoint docs](https://github.com/LibraryOfCongress/api.congress.gov/blob/main/Documentation/MemberEndpoint.md)
- [GitHub repo](https://github.com/LibraryOfCongress/api.congress.gov)

---

## 2. Open States API v3 (Plural Policy)

Non-profit maintained API providing state legislative data for all 50 states. Also includes federal representatives. This is the **best available source for Georgia state legislators**.

- **Base URL:** `https://v3.openstates.org/`
- **Coverage:** State legislators (Senate + House) for all states, plus US Congress
- **Auth:** Free API key — register at <https://open.pluralpolicy.com/>
- **Format:** JSON

### Open States Key Endpoints

| Endpoint | Description |
|---|---|
| `/people?jurisdiction=georgia&org_classification=upper` | GA State Senators |
| `/people?jurisdiction=georgia&org_classification=lower` | GA State House Representatives |
| `/people?jurisdiction=georgia&district={N}&org_classification=upper` | Specific state senate district |
| `/people?jurisdiction=georgia&district={N}&org_classification=lower` | Specific state house district |
| `/people.geo?lat={lat}&lng={lng}` | **All representatives** (state + federal) for a coordinate |

### Open States Query Parameters

| Parameter | Description |
|---|---|
| `jurisdiction` | Filter by jurisdiction name or ID (e.g., `georgia`) |
| `org_classification` | Filter by role: `upper` (senate), `lower` (house), `legislature`, `executive` |
| `district` | Filter by district name/number |
| `name` | Case-insensitive name search |
| `include` | Additional data: `other_names`, `other_identifiers`, `links`, `sources`, `offices` |
| `page`, `per_page` | Pagination (default: 10 per page) |

### Open States Response Data

- `id`, `name`, `given_name`, `family_name`
- `party` — political party
- `current_role` — title, org_classification, district, division_id
- `jurisdiction` — id, name, classification
- `image` — photo URL
- `email`
- `gender`, `birth_date`
- `openstates_url`
- `offices` — contact information (requires `include=offices`)

The `/people.geo` endpoint is especially useful for the voter-web map — given a latitude/longitude coordinate, it returns **every representative at every level** (state house, state senate, US House, US Senate) in a single API call.

### Open States Documentation

- [API v3 overview](https://docs.openstates.org/api-v3/)
- [Interactive API docs](https://v3.openstates.org/docs)
- [OpenAPI spec](https://v3.openstates.org/openapi.json)

---

## 3. unitedstates/congress-legislators (GitHub)

A public domain dataset of all members of Congress (1789–present), maintained by a community project sourced from official records.

- **URL:** <https://github.com/unitedstates/congress-legislators>
- **Coverage:** US Senators and Representatives (current and historical)
- **Auth:** None required — static files hosted on GitHub
- **Format:** YAML, JSON, CSV

### congress-legislators Key Files

| File | Description |
|---|---|
| `legislators-current.yaml` / `.json` | All current members of Congress |
| `legislators-historical.yaml` / `.json` | Historical members |
| `committee-membership-current.yaml` | Current committee assignments |
| `committees-current.yaml` | Current committees |

### congress-legislators Data Fields

- Identifiers: `bioguide`, `thomas`, `govtrack`, `opensecrets`, `fec` IDs
- Name: first, last, middle, suffix, official full name
- Bio: birthday, gender
- Terms: type (`sen`/`rep`), state, district, party, start/end dates, URL, contact info

### congress-legislators Usage

Fetch raw files directly from GitHub:

```
https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-current.json
```

Filter client-side for Georgia (`state: "GA"`). Good as a **zero-auth fallback** or for pre-caching federal official data.

---

## 4. Georgia General Assembly (legis.ga.gov)

The official website for Georgia's state legislature.

- **URL:** <https://www.legis.ga.gov/>
- **"Find My Legislator" page:** <https://www.legis.ga.gov/find-my-legislator>

### GA General Assembly API Availability

- **No public REST/JSON API** for member lookup
- Has internal API paths (e.g., `/api/legislation/document/...`) but these are for documents, not member data
- A legacy **SOAP/WSDL** web service existed at `webservices.legis.ga.gov/Legislation/Service.svc` — **appears to be down** (connection refused as of Feb 2026)
- A third-party wrapper ([gaodp/gga-api](https://github.com/gaodp/gga-api)) attempted to expose this as REST/JSON but is **dormant since ~2013**

**Not recommended** as a programmatic data source. Open States is the practical alternative for Georgia state legislator data.

---

## 5. Google Civic Information API (DEFUNCT)

Previously the most popular API for elected officials lookup.

- **Representatives endpoint shut down: April 2025**
- Elections and Divisions APIs continue to function but **do not return officeholder names**
- Google launched a new Divisions API method for looking up OCD-IDs (Open Civic Data Identifiers) by address, which can be cross-referenced with other data sources
- [Shutdown notice](https://groups.google.com/g/google-civicinfo-api/c/9fwFn-dhktA)

---

## Part 2: Non-Official but Widely Trusted Sources

The following are non-government sources that are high-quality, widely trusted in the civic tech community, and commonly used in production applications. Many of these became even more important after Google's Civic Information API Representatives endpoint shut down in April 2025.

---

## 6. Ballotpedia

The most comprehensive encyclopedia of American politics. Non-partisan, widely cited by media and researchers.

- **URL:** <https://ballotpedia.org/>
- **Developer portal:** <https://developer.ballotpedia.org/>
- **Coverage:** All levels — federal, state, and local officials, candidates, ballot measures, and elections
- **Format:** JSON via REST API, CSV bulk data

### Ballotpedia Data

- Candidate and officeholder names, party affiliation, incumbency status
- Biographical information and contact information
- Campaign websites
- District boundary maps
- Election dates and results (since 2018)
- **2026 Georgia coverage confirmed** — GA is in Ballotpedia's complete down-ballot elections coverage states

### Ballotpedia Access Model

- **Paid/commercial** — data access requires licensing through their [Buy Political Data](https://ballotpedia.org/Ballotpedia:Buy_Political_Data) program
- Bulk data clients access via portal at `clients.ballotpedia.org` (refreshed every 24 hours)
- Geographic API and Bulk Data options available
- Pricing not publicly listed — contact required

### Ballotpedia Documentation

- [Developer documentation](https://developer.ballotpedia.org/)
- [API documentation](https://developer.ballotpedia.org/1.0.html)
- [Bulk data guide](https://developer.ballotpedia.org/downloading-bulk-data-via-api)

---

## 7. BallotReady (CivicEngine)

Comprehensive officeholder and candidate data platform, recommended by Google as a replacement for the Civic Information API.

- **URL:** <https://organizations.ballotready.org/>
- **Developer portal:** <https://developers.civicengine.com/>
- **Coverage:** All levels — federal, state, and local (300k+ officeholder records)
- **Format:** GraphQL API, CSV, Avro

### BallotReady Data

- Officeholder names, party, term dates
- Contact information (email, phone, mailing address)
- Official government websites and social media links
- Government level and position category identifiers
- Supports Open Civic Data Identifiers (OCD-IDs) as of June 2025
- Win/loss election results since 2018

### BallotReady Access Model

- **Paid/commercial** — API access through BallotReady for Organizations
- GraphQL API with single consolidated endpoint
- Pricing not publicly listed — contact required

Google explicitly recommended BallotReady as an alternative when sunsetting the Civic Information API. The OCD-ID support means you can use Google's remaining Divisions API to get OCD-IDs for an address, then look up officeholders in BallotReady.

### BallotReady Documentation

- [Officeholders API](https://organizations.ballotready.org/officeholders-api)
- [Developer docs](https://developers.civicengine.com/)

---

## 8. Cicero (by Melissa Data)

The longest-running commercial elected officials API, acquired by Melissa Data. Widely used in advocacy and civic tech.

- **URL:** <https://www.cicerodata.com/>
- **API reference:** <https://app.cicerodata.com/docs/>
- **Coverage:** 10,000+ US officials — federal, state, and local
- **Format:** JSON REST API

### Cicero Data

- Elected official names, party, office
- Social media profiles, websites, photos, biographies
- Address-to-district matching (by lat/lng, street address, or postal code)
- District boundaries
- **Updated daily** — tracks redistricting changes in real-time

### Cicero Access Model

- **Credit-based pricing** — 1 credit = 1 address matched to districts + officials
- **Free trial:** 1,000 credits for 90 days
- **Discounts** for nonprofit, government, and educational institutions
- Custom pricing for 1M+ calls/year

Also recommended by Google as a Civic Information API replacement. The live demo at <https://live.cicerodata.com/> lets you test lookups interactively.

### Cicero Documentation

- [API overview](https://www.cicerodata.com/api/)
- [Pricing](https://www.cicerodata.com/pricing/)

---

## 9. Geocodio

Geocoding service with political data appends. Gained significant traction as a civic data source after Google's API shutdown.

- **URL:** <https://www.geocod.io/>
- **API docs:** <https://www.geocod.io/docs/>
- **Coverage:** US Congressional districts, state legislative districts, and legislator contact info
- **Format:** JSON REST API

### Geocodio Data

- Congressional district number, Congress number, Congress years
- **Legislator names, party, and contact information** (auto-included with district append)
- State legislative district matching with legislator bio/contact data (added in API v1.9, June 2025)
- **State legislator data sourced from Open States**

### Geocodio Access Model

- **Free tier:** 2,500 lookups/day
- **Pay-as-you-go:** $1.00 per 1,000 lookups (as of Feb 2026)
- Unlimited plans available (all appends included)
- District + legislator append counts as 2 lookups per address

The best option if you need to go from **address to district + officeholder** in a single call. Since it wraps Open States data for state legislators, it's effectively a convenience layer over that same dataset.

### Geocodio Documentation

- [Congressional data guide](https://www.geocod.io/guides/congressional-data/)
- [State legislative districts guide](https://www.geocod.io/guides/state-legislative-districts/)
- [API v1.9 announcement (state legislator data)](https://www.geocod.io/updates/2025-06-18-state-legislator-bio-and-contact-info/)

---

## 10. GovTrack.us

One of the oldest open-government tracking sites (since 2004). Federal Congress only.

- **URL:** <https://www.govtrack.us/>
- **Coverage:** US Congress only (Senators + Representatives)
- **Format:** XML from underlying government sources; open-source data tools

### GovTrack Data

- Congressional member biographies
- Committee assignments
- Photos (from GPO)
- Voting records and attendance
- Bill tracking and sponsorship
- Name pronunciation guides
- Misconduct database

### GovTrack Access Model

- **Free** — open data, open source
- No dedicated REST API; data accessed through underlying government XML endpoints and the [unitedstates/congress](https://github.com/unitedstates/congress) open-source project
- Uses the same `unitedstates/congress-legislators` dataset listed in Part 1

### GovTrack Documentation

- [About our data](https://www.govtrack.us/about-our-data)

---

## 11. Vote Smart

Non-partisan, non-profit providing biographical and voting data on candidates and elected officials at all levels.

- **URL:** <https://www.votesmart.org/>
- **API docs:** <https://www.votesmart.org/share/api>
- **Coverage:** All levels — from President down to local government
- **Format:** REST API (JSON)

### Vote Smart Data

- Biographical information and contact details
- Voting records
- Issue positions (Political Courage Test)
- Interest group ratings
- Public statements
- Campaign finance information
- Zip-to-district matching

### Vote Smart Access Model

- **Registration required** — pricing available after sign-up
- Historically had a free tier for non-commercial use (verify current terms)

### Vote Smart Documentation

- [API registration](https://www.votesmart.org/share/api)
- [API documentation](https://www.votesmart.org/votesmart-api)

---

## 12. LegiScan

Commercial legislative tracking service covering all 50 states and US Congress.

- **URL:** <https://legiscan.com/>
- **Coverage:** All 50 states + US Congress — legislation focused
- **Format:** JSON REST API, bulk data downloads

### LegiScan Data

- Bill details, status, full text
- Sponsors and cosponsors (legislator names/IDs)
- Committee information
- Roll call vote records
- Weekly downloadable session snapshots

### LegiScan Access Model

- **Free tier** available for basic access
- **Paid tiers** for higher volume and additional features
- API key required

Best for **legislation tracking** rather than officeholder lookup. Useful as a supplementary source for "what has this legislator sponsored/voted on" rather than "who represents this district."

### LegiScan Documentation

- [LegiScan API](https://legiscan.com/legiscan)
- [Georgia legislature dashboard](https://legiscan.com/GA)

---

## 13. OpenSecrets (Center for Responsive Politics)

The authoritative source for campaign finance and lobbying data for US federal officials.

- **URL:** <https://www.opensecrets.org/>
- **API docs:** <https://www.opensecrets.org/open-data/api-documentation>
- **Coverage:** US Congress and presidential candidates
- **Format:** JSON and XML

### OpenSecrets Data

- Campaign finance contributions by industry and organization
- Lobbying data
- Personal financial disclosures
- Independent expenditures
- Data sourced from FEC, Senate Office of Public Records, and state agencies

### OpenSecrets Access Model

- **Free for educational purposes**
- 200 API calls/day default limit
- Bulk data downloads available (CSV)
- API key required

Not an officeholder lookup service per se, but an excellent **supplementary data source** for enriching officeholder profiles with funding and lobbying information.

### OpenSecrets Documentation

- [API overview](https://www.opensecrets.org/open-data/api)
- [API documentation](https://www.opensecrets.org/open-data/api-documentation)
- [Bulk data](https://www.opensecrets.org/open-data/bulk-data)

---

## Summary Comparison

### Officeholder Lookup Sources

| Source | Coverage | Free? | API Key | Best For |
| --- | --- | --- | --- | --- |
| Congress.gov API | US Congress | Yes | Free | Authoritative federal data |
| Open States API v3 | State + federal | Yes | Free | GA state legislators, geo lookup |
| congress-legislators | US Congress | Yes | None | Static fallback, no auth needed |
| Ballotpedia | All levels | No (paid) | Required | Comprehensive political encyclopedia |
| BallotReady | All levels (300k+) | No (paid) | Required | Google Civic API replacement |
| Cicero | All levels (10k+) | Trial only | Credit-based | Address-to-official matching |
| Geocodio | Federal + state | Free tier | Required | Address-to-district + legislator |
| GovTrack.us | US Congress | Yes | None | Open data, voting records |
| Vote Smart | All levels | Registration | Required | Biographical + voting data |

### Supplementary Data Sources

| Source | Focus | Free? | Best For |
| --- | --- | --- | --- |
| LegiScan | Legislation tracking | Free tier | Bill tracking, sponsor data |
| OpenSecrets | Campaign finance | Free (edu) | Funding and lobbying data |

### Recommendations

1. **For maximum authority:** Use **Congress.gov API** for federal officials and **Open States API v3** for state legislators.
2. **For simplicity:** Use **Open States API v3** exclusively — it covers all levels (federal + state) through a single API, and the `/people.geo` endpoint maps directly to the lat/lng coordinates available in the voter-web map.
3. **For a zero-dependency fallback:** The **unitedstates/congress-legislators** GitHub dataset provides static JSON for federal officials with no API key needed.
4. **For enriching profiles:** Supplement with **OpenSecrets** (campaign finance) and **LegiScan** (legislation/voting) data.
5. **For address-based lookup:** **Geocodio** provides the simplest address-to-officeholder pipeline with a generous free tier (2,500/day), wrapping Open States data for state legislators.


========= other engineers research ========


# Official government sources for current elected officeholders (U.S. federal + Georgia state)

_Last verified: 2026-02-13_

This is a developer-oriented inventory of **official government** data sources you can use to programmatically retrieve **current officeholders** (names + identifiers) for:

- **U.S. Congress** (U.S. House + U.S. Senate; filterable for Georgia)
- **Georgia statewide elected officials** (Governor, Lt. Governor, AG, etc.)
- **Georgia General Assembly** (State Senate + State House)

> Reality check: “API” isn’t always a REST+JSON service. Several **official** sources publish **XML feeds** (which are still machine-readable and stable enough for production use).

---

## Quick picks

### Best single source for U.S. Senators + U.S. Reps (incl. GA)
- **Congress.gov API (Library of Congress)** — versioned REST API, JSON/XML, requires `api.data.gov` key.

### Lightweight “no key required” U.S. House roster
- **Office of the Clerk (U.S. House)** — `memberdata.xml` (current members only, includes district/state).

### Lightweight “no key required” U.S. Senate roster
- **Senate.gov** — multiple XML lists (contact list, committee assignments, etc.).

### Georgia statewide elected officials (executive + PSC)
- **Georgia.gov** — “Elected Officials” page (HTML, but official and easy to parse).

### Georgia legislators
- **Georgia General Assembly web services** — SOAP/WSDL endpoint with XML outputs used by official GA legislative sites (availability can be inconsistent; plan for retries/caching).

---

## Federal (U.S. Congress)

### 1) Congress.gov API (Library of Congress) — REST (JSON/XML), key required

**Official docs / access**
- API overview: **Library of Congress “Congress.gov API”** page (v3).  
- Base gateway: `https://api.data.gov/congress/v3?api_key=YOUR_KEY`  
- Key signup: `https://api.data.gov/signup/`  
- Official repo/resources: Library of Congress GitHub repo for `api.congress.gov` (user guides, changelog, sample client code).

**Why it’s useful**
- Covers members (and lots more) with predictable versioning (v3) and documented pagination/rate limits.
- You can query “current members” and filter by state/district via member endpoints (see “MemberEndpoint” guide in the official repo).

**Typical usage patterns (members)**
- List members in a Congress (and optionally filter by state + district)  
- Fetch a member by Bioguide ID

**Example (pattern)**
```bash
# Example: list members for a Congress / state / district
# (replace 119, GA, and district number as needed)
curl "https://api.congress.gov/v3/member/congress/119/GA/10?currentMember=true&format=json&api_key=YOUR_KEY"
```

**Operational notes**
- You’ll want to **cache** results and refresh on a schedule (daily is usually plenty for “who currently holds the office”).

**Primary references**
- Library of Congress: Congress.gov API overview + base URL + key requirement  
- Congress.gov “Using Data Offsite” (points to API + GitHub + bulk alternatives)  
- api.data.gov developer manual (key usage + default rate limits)

---

### 2) Office of the Clerk (U.S. House) — memberdata.xml (no key)

**What it is**
- Official XML feed of **current House members**.

**Endpoint**
- `https://clerk.house.gov/xml/lists/memberdata.xml`

**Why it’s useful**
- No API key required.
- Includes state + district, plus structured member info.
- Clerk provides an official **User Guide / Data Dictionary** PDF for the XML schema.

**Notes**
- It’s a House-only feed. Use Senate.gov XML for senators, or Congress.gov API for a unified approach.

---

### 3) Senate.gov — XML availability lists (no key)

**What it is**
- Senate.gov publishes multiple “Current Senators … XML” resources (contact lists, committee assignments, etc.).

**Useful endpoints**
- Current Senators contact list (XML): `https://www.senate.gov/general/contact_information/senators_cfm.xml`
- Senator lookup (XML): `https://www.senate.gov/about/senator-lookup.xml`

**Where it’s documented**
- Senate.gov “XML Sources Available” page(s) list the available XML feeds and formats.

---

## Georgia (state-level)

### 4) Georgia.gov — “Elected Officials” (statewide executive + PSC) (HTML, official)

**What it is**
- Official State of Georgia directory of statewide elected officials, including:
  - Governor, Lt. Governor, Attorney General, Secretary of State, State School Superintendent, etc.
  - Public Service Commission members
  - Links out to Georgia Senate + Georgia House

**Page**
- `https://georgia.gov/elected-officials`

**Dev approach**
- Treat this as an official directory you can **scrape conservatively** (respect caching; minimal frequency; parse the structured name/office blocks).

---

### 5) Georgia General Assembly web services — Members service (SOAP/WSDL + XML outputs)

**What it is**
- Official GA legislative sites reference a “Members” service hosted under `webservices.legis.ga.gov`.
- It is exposed as a SOAP/WSDL service, and the same infrastructure supports XML responses used in “member” pages.

**Known service descriptor**
- WSDL (commonly referenced): `https://webservices.legis.ga.gov/GGAServices/Members/Service.svc?wsdl`

**Known XML query-style pattern (observed in official GA legislative pages)**
- `.../GGAServices/Members/Service.svc/query/forID/{memberId}/xml`

**Important caveat**
- Availability can be uneven (timeouts happen). Plan for:
  - aggressive retries with backoff
  - caching
  - a fallback to parsing the public member directory pages if necessary

**Alternative official pages (scrape fallback)**
- House member directory pages on `house.ga.gov`
- Senate member directory pages on `senate.ga.gov`
- Georgia General Assembly portal pages on `legis.ga.gov`

---

## Integration guidance (practical)

### Normalize IDs early
Expect multiple ID systems:
- **Congress.gov API**: Bioguide IDs (plus internal member IDs)
- **House Clerk XML**: `office_id` (e.g., state+district code) + Bioguide in many cases
- **Senate XML**: Bioguide IDs included in some feeds (e.g., senator lookup)
- **GA legislature services**: internal numeric member IDs

Recommendation: store a canonical internal key per “person”, and map external IDs into that key.

### Cache + refresh strategy
For “current officeholders,” refreshing **daily** is typically more than sufficient. Also:
- Detect changes by diffing previous snapshots.
- Handle vacancies and special elections (vacant seats can appear in House feeds).

### Suggested minimal data model
- `jurisdiction` (us/federal, ga/state)
- `office_type` (us_senator, us_rep, ga_senator, ga_rep, ga_statewide_exec, etc.)
- `state` (GA)
- `district` (nullable)
- `person_name`
- `party` (nullable depending on source)
- `source` (enum)
- `source_id` (Bioguide / memberId / etc.)
- `effective_as_of` (timestamp of your ingest)

---

## Source index (official)

### U.S. federal
- Library of Congress — Congress.gov API overview (base URL + v3 + key requirement)  
  `https://www.loc.gov/apis/additional-apis/congress-dot-gov-api/`
- Congress.gov — Using data offsite (API + GitHub repo references)  
  `https://www.congress.gov/help/using-data-offsite`
- api.data.gov — API key signup + developer manual (key usage + rate limits)  
  `https://api.data.gov/signup/`  
  `https://api.data.gov/docs/developer-manual/`
- U.S. House Clerk — Member Data XML + user guide PDF  
  `https://clerk.house.gov/xml/lists/memberdata.xml`  
  `https://clerk.house.gov/member_info/MemberData_UserGuide.pdf`
- U.S. Senate — XML availability + current senator lists  
  `https://www.senate.gov/general/common/generic/XML_Availability.htm`  
  `https://www.senate.gov/general/contact_information/senators_cfm.xml`  
  `https://www.senate.gov/about/senator-lookup.xml`

### Georgia
- Georgia.gov — Elected Officials directory  
  `https://georgia.gov/elected-officials`
- Georgia General Assembly — portal  
  `https://www.legis.ga.gov/`
- Georgia General Assembly — Members service (WSDL)  
  `https://webservices.legis.ga.gov/GGAServices/Members/Service.svc?wsdl`

---

# Trusted non-government sources for current elected officeholders (academic, nonprofit, commercial)

> Scope: U.S. federal and state-level elected officials (e.g., U.S. Senators/Reps, Governor, state senators/representatives), with an emphasis on developer-accessible APIs/bulk data.

## Nonprofit / civic-tech sources

### Vote Smart — “Civic Knowledge API” (Officials endpoints)
- **What it is:** Nonpartisan nonprofit civic data provider with an API for **current elected officials**.
- **How to get officeholders:**
  - `Officials.getByOfficeState(officeId, stateId)` – officials by office + state (e.g., state legislators, statewide offices).
  - `Officials.getStatewide(stateId)` – statewide officials for a state.
  - `Officials.getByZip(zip5[, zip4])` – “who represents this ZIP” style lookups.
- **Access model:** API key required; terms/quotas apply.
- **Why it’s high-trust:** Long-running research org; clear method-level documentation and structured output.

Refs:
- https://www.votesmart.org/votesmart-api
- https://api.votesmart.org/docs/Officials.html

### Ballotpedia Data Client (Lucy Burns Institute) — Geographic officeholder lookup + bulk data
- **What it is:** Professionally maintained political encyclopedia + paid data offerings.
- **How to get officeholders:**
  - `/officeholders?lat=...&long=...` returns a list of **current officeholders** representing a point (address), with district/office metadata.
- **Access model:** Data-client portal / sales-contact model; rate limits & ToS apply.
- **Why it’s high-trust:** Editorially staffed (not crowdsourced) and explicitly designed for structured, reusable data.

Refs:
- https://developer.ballotpedia.org/
- https://developer.ballotpedia.org/geographic-apis/officeholders

### Open States (Plural) — API + bulk data for state legislatures (and some executives)
- **What it is:** A widely used open civic dataset + API for state legislative data.
- **How to get officeholders:**
  - `/people` – list/search people (legislators; docs also mention “governors, etc.”).
  - `/people.geo` – legislators for a given location (geo lookup).
  - Bulk data is also published for offline ingestion.
- **Access model:** API key; open-data core; terms apply.
- **Why it’s high-trust:** Long-running civic data project; widely integrated; provides stable IDs (Open Civic Data identifiers) useful for joins/deduping.

Refs:
- https://open.pluralpolicy.com/
- https://docs.openstates.org/api-v3/
- https://pluralpolicy.com/open/

## Academic / research sources

### UCLA Voteview — Members dataset (CSV export)
- **What it is:** Academic project providing structured congressional datasets (biographical + ideological metadata).
- **How to get officeholders:** Download member export (CSV) and filter to the current Congress / in-office membership (depending on fields provided).
- **Access model:** Public downloads.
- **Why it’s high-trust:** University-affiliated project; transparent downloadable datasets.

Refs:
- https://voteview.com/articles/data_help_members
- https://voteview.com/static/data/out/members/HSall_members.csv

## Commercial sources

### Google Civic Information API — representatives by address/division
- **What it is:** Commercially operated API with strong developer ergonomics for “who represents this address”.
- **How to get officeholders:**
  - `representativeInfoByAddress` – representative and political geography lookup for an address.
  - `representativeInfoByDivision` – lookup by OCD division ID.
- **Access model:** API key + usage limits/terms.
- **Why it’s high-trust:** Widely used in production apps; standardized IDs and address-to-representative workflows.

Refs:
- https://developers.google.com/civic-information/docs/v2

### LegiScan API (LegiScan LLC) — legislators as part of a broader legislative dataset
- **What it is:** Legislative tracking/data platform for all 50 states + Congress with API and bulk datasets.
- **How to get officeholders:** Legislator records are exposed in the API ecosystem (e.g., sponsors, roll calls); also provides weekly datasets for bulk ingestion.
- **Access model:** Free public tier (query-capped) + paid pull/push tiers; account required.
- **Why it’s high-trust:** Long-standing commercial legislative data provider with explicit API service levels.

Refs:
- https://legiscan.com/legiscan
- https://legiscan.com/US/datasets

### Quorum — Officials & Staffers data via API (contracted access)
- **What it is:** Advocacy/CRM + legislative intelligence platform with a REST API.
- **How to get officeholders:** “Officials and Staffers” endpoints return people/roles; example docs show retrieving an official record by ID.
- **Access model:** Contract + API keys provisioned to your account.
- **Why it’s high-trust:** Commercial platform used by advocacy/public affairs teams; structured roles/regions metadata.

Refs:
- https://quorum.redoc.ly/
- https://quorum.redoc.ly/tag/Officials-and-Staffers/

### FiscalNote — People API (government officials, US + global)
- **What it is:** Policy/legislative intelligence platform.
- **How to get officeholders:** “People 1.0/2.0” APIs described as providing access to data on government officials.
- **Access model:** API key via developer portal (typically commercial agreement).
- **Why it’s high-trust:** Enterprise data vendor; global coverage can be helpful if you expand beyond US/GA.

Refs:
- https://apidocs.fiscalnote.com/apis

### BillTrack50 — web services API (subscriber access)
- **What it is:** State + federal bill/regulation tracking platform with an API.
- **How to get officeholders:** API includes “legislator data” as part of its service offering (especially for subscribers).
- **Access model:** Paying subscribers; usage guidelines restrict resale.
- **Why it’s high-trust:** Commercial platform with long-running legislative tracking focus.

Refs:
- https://www.billtrack50.com/info/help/the-billtrack50-api
- https://www.billtrack50.com/documentation/webservices

## “Legacy” APIs to avoid for *current* officeholder data
These are historically important but not reliable sources for *current* officeholders anymore:
- **ProPublica Congress API** – documentation states it is no longer available.
- **OpenSecrets public API** – third-party wrappers report shutdown (April 2025).
- **Sunlight Congress API** – historically significant; appears dormant/legacy.

Refs:
- https://projects.propublica.org/api-docs/congress-api/members/
- https://github.com/KiaFarhang/opensecrets
- https://sunlightlabs.github.io/congress/
