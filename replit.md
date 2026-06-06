# Padel Blitz

A full-stack Web3 padel micro-wagering dApp: players log match stats to evolve an AI-generated superhero NFT player card, get AI coaching, place on-chain MON wagers on Monad Testnet, and climb a leaderboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (AI endpoints)
- `pnpm --filter @workspace/padel-blitz run dev` — run the web app (served at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks + Zod schemas from the OpenAPI spec
- Required secret: `OPENAI_API_KEY` — used server-side for NFT image generation and AI coach
- Optional frontend env: `VITE_CONTRACT_ADDRESS` — deployed PadelBlitzWager address (users can also paste an address in the Wager tab)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Radix UI, Tailwind, wouter, framer-motion
- Web3: ethers v6 + MetaMask (no wagmi), Monad Testnet (chainId 10143)
- API: Express 5, OpenAI SDK (gpt-image-1 with dall-e-3 fallback; gpt-4o-mini for coach JSON)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `artifacts/padel-blitz/` — the web app (4 tabs: My Progress, AI Coach, Wager, Leaderboard)
  - `src/config.ts` — chain config, contract ABI, tier definitions, `getTier`, contract-address resolution
  - `src/hooks/useContract.ts` — ethers v6 wallet/contract wiring + Monad chain switching
  - `src/hooks/usePlayerStats.ts` — `scoreSession` (avg of 5 tactical skill ratings), cumulative rolling average, per-session match metadata (outcome/scoreline/matchType/partnerName), localStorage keyed by wallet
- `artifacts/api-server/src/routes/ai.ts` — `POST /api/generate-nft` and `POST /api/coach`
- `lib/api-spec/openapi.yaml` — source-of-truth API contract (do NOT change `info.title`)
- `contracts/PadelBlitzWager.sol` + `.abi.json` — the wager + NFT-storage contract (user deploys separately)

## Architecture decisions

- No database: skill scores live in localStorage, wagers live on-chain, AI calls are stateless.
- Tier from cumulative score uses contiguous lower-inclusive thresholds (no gaps between e.g. 2.9 and 3.0).
- NFT image returned as a base64 data URL so the client renders it directly without object storage.
- AI coach output is normalized with `Array.isArray` guards + clamped rating before Zod parse, so a malformed model response never 500s.
- Wallet connect tries `wallet_switchEthereumChain` first, falling back to `wallet_addEthereumChain` on error 4902.

## Product

Four tabs: (1) My Progress — log a match via 5 tactical skill ratings (Net Dominance, Overhead/Attack, Glass Play & Defending, Patience & Consistency, Lob Quality) on 1–10 sliders plus core match data (win/loss, scoreline, friendly/competitive, partner) → AI generates a tier-themed superhero card you can mint on Monad; (2) AI Coach turns a free-text session recap into a structured analysis; (3) create/join/settle on-chain MON wagers; (4) leaderboard of on-chain wins + local skill rankings.

## User preferences

- Use the provided brand kit (Uberflip: magenta `#CE0058` / `#AA0048`, Archivo headings + Inter body) as the visual foundation.
- No decorative emojis in the UI (the coach archetype emoji is API-provided content and is allowed).

## Gotchas

- The OpenAI key is the user's own (not a Replit integration). Restart the API server after the secret changes.
- The headless preview has no MetaMask, so wallet/contract reads log harmless `-32603` errors — not a real bug.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
