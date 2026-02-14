#!/usr/bin/env node

/**
 * Build-time script to download GeoJSON boundary data from the API
 * and save as static assets for fast load times and offline resilience.
 *
 * Usage: node scripts/fetch-geojson.mjs
 *
 * Reads VITE_API_BASE_URL from environment or .env.production / .env files.
 * Downloaded files are written to public/geojson/<boundary_type>.json.
 */

import { readFileSync, mkdirSync, writeFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, "..")
const outputDir = resolve(projectRoot, "public", "geojson")

function loadEnvFile(filename) {
  try {
    const content = readFileSync(resolve(projectRoot, filename), "utf-8")
    const vars = {}
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eqIdx = trimmed.indexOf("=")
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      let value = trimmed.slice(eqIdx + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      vars[key] = value
    }
    return vars
  } catch {
    return {}
  }
}

function getApiBaseUrl() {
  if (process.env.VITE_API_BASE_URL) return process.env.VITE_API_BASE_URL
  const prod = loadEnvFile(".env.production")
  if (prod.VITE_API_BASE_URL) return prod.VITE_API_BASE_URL
  const dev = loadEnvFile(".env")
  if (dev.VITE_API_BASE_URL) return dev.VITE_API_BASE_URL
  return "http://localhost:8000/api/v1"
}

async function main() {
  const apiBaseUrl = getApiBaseUrl()
  console.log(`[fetch-geojson] API: ${apiBaseUrl}`)

  // Fetch available boundary types
  const typesRes = await fetch(`${apiBaseUrl}/boundaries/types`)
  if (!typesRes.ok) {
    console.error(
      `[fetch-geojson] Failed to fetch boundary types: ${typesRes.status}`,
    )
    process.exit(1)
  }
  const { types } = await typesRes.json()
  console.log(`[fetch-geojson] Boundary types: ${types.join(", ")}`)

  mkdirSync(outputDir, { recursive: true })

  // Cloudflare Pages has a 25 MB file size limit
  const MAX_FILE_SIZE_MB = 20 // Use 20 MB to leave some safety margin

  const results = []
  for (const boundaryType of types) {
    process.stdout.write(`[fetch-geojson] ${boundaryType} ... `)
    try {
      const url = `${apiBaseUrl}/boundaries/geojson?boundary_type=${encodeURIComponent(boundaryType)}`
      const res = await fetch(url)
      if (!res.ok) {
        console.log(`SKIP (HTTP ${res.status})`)
        results.push({ type: boundaryType, status: "error" })
        continue
      }
      const data = await res.json()
      const featureCount = data.features?.length ?? 0
      const json = JSON.stringify(data)
      const sizeBytes = Buffer.byteLength(json)
      const sizeMB = sizeBytes / (1024 * 1024)

      // Skip files that exceed Cloudflare Pages' size limit
      if (sizeMB > MAX_FILE_SIZE_MB) {
        console.log(`SKIP (${sizeMB.toFixed(1)} MB exceeds ${MAX_FILE_SIZE_MB} MB limit - will fetch on-demand)`)
        results.push({ type: boundaryType, status: "skipped_too_large" })
        continue
      }

      writeFileSync(resolve(outputDir, `${boundaryType}.json`), json)
      const sizeKB = (sizeBytes / 1024).toFixed(1)
      console.log(`${featureCount} features (${sizeKB} KB)`)
      results.push({ type: boundaryType, status: "ok", features: featureCount })
    } catch (err) {
      console.log(`SKIP (${err.message})`)
      results.push({ type: boundaryType, status: "error" })
    }
  }

  // Write manifest so the client knows which types are available
  const manifest = {
    fetchedAt: new Date().toISOString(),
    types: results.filter((r) => r.status === "ok").map((r) => r.type),
  }
  writeFileSync(
    resolve(outputDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  )

  const ok = results.filter((r) => r.status === "ok").length
  const failed = results.filter((r) => r.status === "error").length
  console.log(`[fetch-geojson] Done: ${ok} cached, ${failed} skipped`)
}

main().catch((err) => {
  console.error(`[fetch-geojson] Error: ${err.message}`)
  process.exit(1)
})
