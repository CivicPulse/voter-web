<!-- Project banner placeholder -->

# CivicPulse Voter Data Explorer

[![Build & Deploy](https://github.com/CivicPulse/voter-web/actions/workflows/deploy.yml/badge.svg)](https://github.com/CivicPulse/voter-web/actions/workflows/deploy.yml)
[![E2E Tests](https://github.com/CivicPulse/voter-web/actions/workflows/e2e.yml/badge.svg)](https://github.com/CivicPulse/voter-web/actions/workflows/e2e.yml)
[![License: LGPL v2.1](https://img.shields.io/badge/License-LGPL_v2.1-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> An open-source web application for exploring voter registration data, election results, political boundaries, and demographic information.

**Live site:** [vote.civpulse.org](https://vote.civpulse.org/)

## Features

### Public Access
- **Interactive Maps** — state and county maps with toggleable district overlays (congressional, state senate, state house, county commission)
- **Election Discovery** — browse, filter, and search elections by type, status, date, and race category
- **Election Results** — live and historical results with county and precinct-level choropleth maps
- **Address Lookup** — enter any address to see all district assignments (geocoding-powered)
- **Elected Officials** — current representatives for congressional, state senate, and state house districts
- **Census Demographics** — population, age, race/ethnicity, housing, and economic data per county
- **Candidate Profiles** — biographical information and election history

### Authenticated Access
- **Voter Search** — search voter registration records with multi-field filters
- **Voter Detail** — registration info, geocoded locations map, district assignments, voting history charts
- **Participation Analysis** — voter turnout data and trends

### Administration
- **User Management** — create accounts, invite users, assign roles (admin/analyst/viewer)
- **Election Management** — CRUD elections, import from GA Secretary of State feed, link candidates
- **Data Imports** — upload voter CSVs and boundary GeoJSON/ZIP files with progress monitoring
- **Data Exports** — export voter data, boundaries, or full database with job tracking
- **Batch Geocoding** — trigger geocoding jobs, monitor provider stats, view cache metrics
- **District Mismatch Analysis** — identify voters with incorrect district assignments

## Screenshots

<!-- TODO: Add screenshots of the map, election detail, and voter search pages -->

Visit the [live site](https://vote.civpulse.org/) to explore.

## Quick Start

```bash
nvm use
npm install
cp .env.example .env
npm run dev
```

The dev server starts at `http://localhost:5173`. See the [Setup Guide](docs/setup-guide.md) for Docker, deployment, and advanced configuration.

## Tech Stack

React 19 · TypeScript 5.9 · Vite 7 · Tailwind CSS v4 · shadcn/ui · TanStack Router · TanStack Query · TanStack Table · React-Leaflet · Recharts · Zustand · React Hook Form · Zod · ky · Turf.js

## Documentation

| Guide | Audience | Description |
|-------|----------|-------------|
| [User Guide](docs/user-guide.md) | End users | Using maps, elections, address lookup, voter search |
| [Admin Guide](docs/admin-guide.md) | Administrators | Managing users, imports, exports, elections, geocoding |
| [Setup Guide](docs/setup-guide.md) | DevOps, self-hosters | Local dev, Docker, building, deploying, CI/CD |
| [Development Guide](docs/development-guide.md) | Contributors | Architecture, conventions, testing, contributing |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b 042-feature-name`)
3. Follow the [Development Guide](docs/development-guide.md) conventions
4. Commit with [Conventional Commits](https://www.conventionalcommits.org/) format
5. Open a PR against `main`

See [docs/development-guide.md](docs/development-guide.md) for full contributing instructions.

## Related Projects

- [voter-api](https://github.com/CivicPulse/voter-api) — FastAPI backend providing the REST API

## License

This project is licensed under the [GNU Lesser General Public License v2.1](LICENSE).
