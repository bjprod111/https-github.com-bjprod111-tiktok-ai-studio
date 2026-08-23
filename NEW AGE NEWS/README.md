# NEW AGE NEWS

AI-powered local news intelligence and feed agency.

## Safety boundary

This project lives entirely inside the `NEW AGE NEWS/` directory on the `new-age-news` branch. The existing application files outside this directory are intentionally left untouched.

## Product goal

NEW AGE NEWS collects legally accessible news metadata from RSS feeds, optional free/public APIs, and optional MCP tools; validates and normalizes the data; removes duplicates; groups related coverage into story clusters; optionally enriches stories with AI; ranks them; and serves them through a professional news-intelligence interface.

## Core workflow

SOURCE -> FETCH -> VALIDATE -> NORMALIZE -> DEDUPLICATE -> CLUSTER -> AI ENRICH -> RANK -> STORE/CACHE -> API -> UI

## Free-first approach

The local MVP is designed to work without paid infrastructure. RSS is the primary ingestion mechanism. API and MCP connectors are optional adapters. AI is designed as a provider interface so a local model can be used when available and an external provider can be added later without rewriting the pipeline.

## Initial architecture

- `backend/` - Express application and API boundary
- `ingestion/` - source fetching and pipeline orchestration
- `connectors/` - RSS/API/MCP adapters
- `ai/` - provider interface and enrichment logic
- `database/` - SQLite schema and persistence
- `frontend/` - local news-intelligence interface
- `tests/` - unit/integration tests
- `docs/` - architecture and workflow documentation

## Local development target

The application will be run locally with Node.js. The first milestone is a reliable RSS-only feed with validation, normalization, deduplication, source health, SQLite storage, API endpoints, and a polished frontend. Optional AI and MCP adapters are added without making the base feed dependent on them.

## Important data rule

A successful fetch is not the same as a valid article. Every external item must pass validation before it enters the normalized news pipeline.

## Branch

All NEW AGE NEWS work is performed on the `new-age-news` branch. Do not merge into `main` unless explicitly requested.
