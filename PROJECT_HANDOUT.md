# Project Handout: Zimou Express Synchronization Service

## Description

This project implements a **private synchronization service** for the Zimou Express dashboard. It uses **Playwright**, **TypeScript**, **Prisma ORM**, and **dotenv** to scrape delivery offices and pricing data from an authenticated Zimou dashboard and store the information in a PostgreSQL database (Neon). The service is designed to run as an admin/background job, triggered manually or via scheduled cron.

## Current State

- **Folder Structure** established under `src/lib/scraper/` including modules for browser handling, login, pagination, scraping, parsing, database interaction, and synchronization.
- **Login Flow** implemented with stealth techniques (navigator webdriver override, launch args) and supports both headless and headful modes. Headful mode prompts the user to solve Cloudflare Turnstile CAPTCHAs.
- **Scraper** now logs detailed page information, saves raw HTML and screenshots for debugging, and parses office rows with validation.
- **Database Layer** includes Prisma models and health checks; connection to Neon verified.
- **Sync Orchestrator** (`sync.ts`) runs the full workflow, validates that rows are parsed, and reports insertion counts.
- **Debugging** artifacts are generated for each page (`debug/page-*.html`, `debug/page-*.png`).
- **Remaining Issue**: No rows are currently persisted to Neon because the scraper fails to extract any office rows (likely due to incorrect selectors or dynamic content).

## What's Next

1. **Fix Scraper Extraction**
   - Verify the DOM selectors against the live Zimou offices page.
   - Ensure that pagination correctly loads new rows.
   - Update `parser.ts` to handle any changed table structures.
2. **Enhance Login Robustness**
   - Persist session cookies to avoid repeated CAPTCHAs.
   - Consider proxy rotation or user‑agent rotation if IP‑based blocking persists.
3. **Automated Tests**
   - Add unit tests for parsing logic.
   - Mock Playwright responses to test pagination without hitting the live site.
4. **Cron Integration**
   - Provide a script entry `npm run zimou:sync` and optional cron setup using `node-cron` or OS‑level scheduling.
5. **Documentation**
   - Expand this handout with setup instructions, environment variable configuration, and deployment guidelines.

---
*Generated on $(date)*
