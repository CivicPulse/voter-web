# User Guide

A guide for end users of [CivicPulse Voter Data Explorer](https://vote.civpulse.org/).

## Getting Started

### Accessing the Application

Visit [vote.civpulse.org](https://vote.civpulse.org/) to start exploring. Most features are available without an account.

### Account Types

| Role | Access |
|------|--------|
| Public (no account) | Maps, elections, districts, address lookup, candidates, census data |
| Viewer | Public features + voter search (read-only) |
| Analyst | Viewer features + admin panel (imports, exports, analysis) |
| Admin | Full access including user management |

Contact your organization's administrator to request an account.

---

## Interactive Maps

### State Map

The home page displays an interactive map of your state with county boundaries. If the system has data for multiple states, you'll see a state selection page first.

**Controls:**
- **Zoom:** Scroll wheel or pinch gesture
- **Pan:** Click and drag
- **Click a county:** Navigate to the county detail page

### District Overlays

Use the layer controls to overlay political district boundaries on the map:
- Congressional districts
- State Senate districts
- State House districts
- Public Service Commission districts
- County Commission districts (on county pages)

District overlays use a colorblind-friendly color palette. **Double-click a district** to navigate to its detail page.

### State Details Drawer

Click the "State Details" button at the bottom of the map to open a slide-up drawer showing:
- Current elected U.S. Senators and Representatives
- Census demographic profile (population, age, race/ethnicity, housing, economics)

### County Detail Page

Navigate to a county by clicking it on the map or using the URL (e.g., `/counties/ga/bibb`).

County pages display:
- **County Map** with selectable district overlays
- **County Information** including FIPS codes, GEOID, land/water area (km² and mi²), internal coordinates, CBSA/CSA codes, and functional status
- **Active Elections** banner (when elections are in progress)
- **Voter Data & Analysis** (requires authentication)

### District Detail Page

Each district page shows the boundary on a map with relevant elected officials, election results, and demographic data.

**URL patterns:**
- State-level: `/districts/ga/state-senate/018`
- County-level: `/districts/ga/bibb/county-commission/005`

---

## Election Discovery

### Browsing Elections

Navigate to **Elections** from the main menu to see all elections in the system.

**Filtering options:**
- **Date range:** Choose from presets (Upcoming, Last 30 days, Last year, etc.) or enter custom dates
- **Election type:** General, Primary, Runoff, Special
- **Status:** Upcoming, Active, Certified, Unofficial
- **State and county:** Filter by geographic area
- **Race category:** Federal, State, County, Municipal, School Board, etc.
- **Search:** Free-text search by election name

### Election Detail

Click an election to see its detail page with:
- **Races** — all contests in the election
- **Results** — county and precinct-level vote totals with choropleth maps (for elections with results)
- **Participation** — voter turnout data and charts

Live elections show real-time results updates with audio notification when new data arrives.

---

## Address Lookup

Navigate to **Lookup** from the main menu to find district assignments for any address.

**How to use:**
1. Enter a street address in the search box, or click the location button to use your current GPS position
2. The system verifies the address and shows suggestions if there are multiple matches
3. Select the correct address to see:
   - Congressional district
   - State Senate and House districts
   - County Commission district
   - Other applicable boundaries

---

## Candidate Profiles

Click a candidate's name from any race listing to view their profile page, which includes biographical information and election history when available.

---

## Authenticated Features

The following features require signing in with an account.

### Voter Search

Navigate to **Voters** from the main menu (visible only when signed in).

**Search filters:**
- First name, last name
- County
- Registration status
- Date range
- Additional API-dependent filters

Results appear in a paginated, sortable table. Click a voter to see their detail page.

### Voter Detail

The voter detail page shows:
- **Registration Information** — name, address, registration date, status, party
- **Geocoded Locations** — map showing the voter's address with geocoding results from multiple providers
- **District Assignments** — all political districts the voter belongs to
- **Voting History** — participation in past elections with charts

### Bulk Geocoding

From the voter search results, analysts and admins can trigger bulk geocoding operations to update voter address coordinates.

### Driver License Scanner

An experimental feature allowing analysts to scan a driver's license barcode to quickly look up voter information.

---

## Keyboard Navigation & Accessibility

The application follows web accessibility standards:
- All interactive elements are keyboard-accessible
- Tab navigation follows a logical order
- Screen reader-friendly labels on buttons and form controls
- Map controls include keyboard alternatives
- Color palettes are designed for colorblind users

---

## FAQ & Troubleshooting

### I can't see the Voters or Admin menus

These require authentication. Click **Login** to sign in. If you're signed in but still don't see them, your account may not have the required role — contact your administrator.

### The map isn't loading

- Check your internet connection
- Try refreshing the page
- If the issue persists, the API server may be temporarily unavailable

### "Session expired" message

Your login session has timed out. Click the **Log in** button in the notification to re-authenticate. Your work is not lost.

### "Access denied" when accessing admin pages

Your account role may have been changed. Contact your administrator to verify your permissions.

### Election results aren't updating

For live elections, results update automatically every few seconds. If updates stop:
- Check the "Last updated" timestamp
- Refresh the page
- The election results feed from the Secretary of State may be experiencing delays

### Address lookup returns no results

- Verify the address format (street number, street name, city, state)
- Try a more specific address
- The geocoding service may be temporarily unavailable — try again in a moment
