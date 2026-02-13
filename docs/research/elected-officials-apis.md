# Elected Officials API Research

Research into official government sources and APIs for retrieving current office holders by political district, focused on Georgia.

**Date:** 2026-02-13
**Relevant districts in voter-web:** Congressional Districts, State Senate Districts, State House Districts

---

## 1. Congress.gov API (Library of Congress)

The official US government API for federal legislative data, maintained by the Library of Congress.

- **Base URL:** `https://api.congress.gov/v3/member/`
- **Coverage:** US Senators and Representatives (current and historical)
- **Auth:** Free API key — register at <https://api.data.gov>
- **Rate limit:** 5,000 requests/hour
- **Format:** JSON and XML

### Key Endpoints

| Endpoint | Description |
|---|---|
| `/member/congress/{congress}/{state}?currentMember=true` | All current members for a state |
| `/member/congress/{congress}/{state}/{district}?currentMember=true` | Member for a specific district |

**Georgia examples** (119th Congress):

```
GET /member/congress/119/GA?currentMember=true&api_key={key}
GET /member/congress/119/GA/5?currentMember=true&api_key={key}
```

### Response Data

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

### Documentation

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

### Key Endpoints

| Endpoint | Description |
|---|---|
| `/people?jurisdiction=georgia&org_classification=upper` | GA State Senators |
| `/people?jurisdiction=georgia&org_classification=lower` | GA State House Representatives |
| `/people?jurisdiction=georgia&district={N}&org_classification=upper` | Specific state senate district |
| `/people?jurisdiction=georgia&district={N}&org_classification=lower` | Specific state house district |
| `/people.geo?lat={lat}&lng={lng}` | **All representatives** (state + federal) for a coordinate |

### Query Parameters

| Parameter | Description |
|---|---|
| `jurisdiction` | Filter by jurisdiction name or ID (e.g., `georgia`) |
| `org_classification` | Filter by role: `upper` (senate), `lower` (house), `legislature`, `executive` |
| `district` | Filter by district name/number |
| `name` | Case-insensitive name search |
| `include` | Additional data: `other_names`, `other_identifiers`, `links`, `sources`, `offices` |
| `page`, `per_page` | Pagination (default: 10 per page) |

### Response Data (Person object)

- `id`, `name`, `given_name`, `family_name`
- `party` — political party
- `current_role` — title, org_classification, district, division_id
- `jurisdiction` — id, name, classification
- `image` — photo URL
- `email`
- `gender`, `birth_date`
- `openstates_url`
- `offices` — contact information (requires `include=offices`)

### Notable

The `/people.geo` endpoint is especially useful for the voter-web map — given a latitude/longitude coordinate, it returns **every representative at every level** (state house, state senate, US House, US Senate) in a single API call.

### Documentation

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

### Key Files

| File | Description |
|---|---|
| `legislators-current.yaml` / `.json` | All current members of Congress |
| `legislators-historical.yaml` / `.json` | Historical members |
| `committee-membership-current.yaml` | Current committee assignments |
| `committees-current.yaml` | Current committees |

### Data Fields

- Identifiers: `bioguide`, `thomas`, `govtrack`, `opensecrets`, `fec` IDs
- Name: first, last, middle, suffix, official full name
- Bio: birthday, gender
- Terms: type (`sen`/`rep`), state, district, party, start/end dates, URL, contact info

### Usage

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

### API Availability

- **No public REST/JSON API** for member lookup
- Has internal API paths (e.g., `/api/legislation/document/...`) but these are for documents, not member data
- A legacy **SOAP/WSDL** web service existed at `webservices.legis.ga.gov/Legislation/Service.svc` — **appears to be down** (connection refused as of Feb 2026)
- A third-party wrapper ([gaodp/gga-api](https://github.com/gaodp/gga-api)) attempted to expose this as REST/JSON but is **dormant since ~2013**

### Conclusion

**Not recommended** as a programmatic data source. Open States is the practical alternative for Georgia state legislator data.

---

## 5. Google Civic Information API (DEFUNCT)

Previously the most popular API for elected officials lookup.

- **Representatives endpoint shut down: April 2025**
- Elections and Divisions APIs continue to function but **do not return officeholder names**
- Google launched a new Divisions API method for looking up OCD-IDs (Open Civic Data Identifiers) by address, which can be cross-referenced with other data sources
- [Shutdown notice](https://groups.google.com/g/google-civicinfo-api/c/9fwFn-dhktA)

---

## 6. Other Notable Sources

| Source | Type | Notes |
|---|---|---|
| [LegiScan API](https://legiscan.com/legiscan) | Commercial (free tier) | Legislation tracking for all 50 states + Congress. Sponsors, votes, committees. Less focused on member-by-district lookup. |
| [Bioguide Directory](https://bioguide.congress.gov/) | Official Congress | Searchable biographical directory. Web-based, not a REST API. |
| [Geocodio](https://www.geocod.io/) | Commercial | Address-to-congressional-district API with optional legislator data append. |

---

## Summary Comparison

| District Type | Recommended Source | Official Gov? | API Key | Cost |
|---|---|---|---|---|
| US Senators (GA) | Congress.gov API | Yes | Free | Free |
| US Representatives (GA) | Congress.gov API | Yes | Free | Free |
| GA State Senate | Open States API v3 | No (non-profit) | Free | Free |
| GA State House | Open States API v3 | No (non-profit) | Free | Free |
| All levels at once (by location) | Open States `/people.geo` | No (non-profit) | Free | Free |

### Recommendations

1. **For maximum authority:** Use **Congress.gov API** for federal officials and **Open States API v3** for state legislators.
2. **For simplicity:** Use **Open States API v3** exclusively — it covers all levels (federal + state) through a single API, and the `/people.geo` endpoint maps directly to the lat/lng coordinates available in the voter-web map.
3. **For a zero-dependency fallback:** The **unitedstates/congress-legislators** GitHub dataset provides static JSON for federal officials with no API key needed.
