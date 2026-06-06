# Padel Blitz

**On-court wagers. AI coaching. Your superhero evolves with you.**

Padel Blitz is a full-stack Web3 dApp built for the [Monad Blitz](https://blitz.devnads.com) hackathon. Players log padel match performance, evolve an AI-generated superhero player card, get personalised coaching, place on-chain MON wagers on Monad Testnet, and climb a leaderboard.

## Features

### My Progress
Log each session with five tactical skill ratings (1–10):

- Net Dominance
- Overhead / Attack
- Glass Play & Defending
- Patience & Consistency
- Lob Quality

Also capture match metadata: win/loss, scoreline, friendly vs competitive, partner name, and a free-text recap.

Your **cumulative skill score** is a rolling average across all sessions. That score maps to a **tier** (Rookie → Club Player → Contender → Elite → Legend), which drives the style of your AI-generated superhero card.

- **Save & evolve card** calls the backend to generate a tier-themed portrait (optional reference photo supported).
- **Mint NFT on Monad** stores card metadata on-chain via `storeNFT()`.
- **AI Coach** (embedded in this tab) turns your session recap into three plain-language focus areas for your next game.

### Wager
Connect MetaMask on Monad Testnet to:

- Create a match with a MON wager and description
- Join an open match (must match the exact wager amount)
- Settle matches (admin/deployer only)
- Cancel open matches (creator or admin)

### Leaderboard
- **On-chain wins** — tallied from `MatchSettled` events
- **Skill rankings** — top players by cumulative score from local session data

## Tech stack

| Layer | Technologies |
|-------|--------------|
| Monorepo | pnpm workspaces, TypeScript 5.9, Node.js 24 |
| Frontend | React 19, Vite 7, Tailwind CSS 4, Radix UI, wouter, framer-motion |
| Web3 | ethers.js v6, MetaMask (no wagmi), Monad Testnet (chainId `10143`) |
| API | Express 5, OpenAI SDK, Pino logging |
| Validation | Zod, OpenAPI → Orval codegen |
| Smart contract | Solidity `^0.8.20` — `PadelBlitzWager.sol` |

## Repository structure

```
padel-blitz/
├── artifacts/
│   ├── padel-blitz/          # Main web app (React + Vite)
│   ├── api-server/           # Express API (AI endpoints)
│   └── mockup-sandbox/       # UI mockup preview sandbox
├── contracts/
│   ├── PadelBlitzWager.sol   # Wager + on-chain NFT metadata storage
│   └── PadelBlitzWager.abi.json
├── lib/
│   ├── api-spec/             # OpenAPI source of truth
│   ├── api-zod/              # Generated Zod schemas
│   └── api-client-react/     # Generated React Query hooks
└── attached_assets/          # Design references and screenshots
```

## Getting started

### Prerequisites

- [pnpm](https://pnpm.io/) (npm and yarn are not supported in this workspace)
- Node.js 24+
- An [OpenAI API key](https://platform.openai.com/) for NFT image generation and AI coaching
- MetaMask with Monad Testnet configured (the app can prompt to add the chain)

### Install

```bash
pnpm install
```

### Run

Start both the API server and the web app:

```bash
# API server (AI endpoints at /api/*)
PORT=8080 OPENAI_API_KEY=your_key_here pnpm --filter @workspace/api-server run dev

# Web app
PORT=25655 BASE_PATH=/ pnpm --filter @workspace/padel-blitz run dev
```

On Replit, both services run together and `/api` is routed to the API server automatically. For local development, ensure requests from the frontend to `/api` reach the API server (same host reverse proxy or equivalent).

### Other commands

```bash
pnpm run typecheck                                          # Typecheck all packages
pnpm run build                                              # Build all packages
pnpm --filter @workspace/api-spec run codegen                # Regenerate API client + Zod schemas from OpenAPI
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes (API server) | Powers NFT image generation and AI coach |
| `PORT` | Yes | Port for each service (see run commands above) |
| `BASE_PATH` | Yes (frontend) | Vite base path — use `/` for the main app |
| `VITE_CONTRACT_ADDRESS` | No | Deployed `PadelBlitzWager` address (can also be set in the Wager tab UI) |
| `VITE_NFT_CONTRACT_ADDRESS` | No | Deployed `PadelBlitzPlayerNFT` address (can also be set in the My Progress tab) |

Restart the API server after changing `OPENAI_API_KEY`.

## Monad Testnet

| Setting | Value |
|---------|-------|
| Chain ID | `10143` (`0x279F`) |
| RPC URL | `https://testnet-rpc.monad.xyz` |
| Currency | MON |
| Explorer | [testnet.monadexplorer.com](https://testnet.monadexplorer.com) |
| Faucet | [faucet.monad.xyz](https://faucet.monad.xyz) |

Deploy contracts to Monad Testnet:

- **Wager:** `contracts/PadelBlitzWager.sol` — set via `VITE_CONTRACT_ADDRESS` or paste in the Wager tab.
- **NFT:** `contracts/PadelBlitzPlayerNFT.sol` — set via `VITE_NFT_CONTRACT_ADDRESS` or paste in the My Progress tab.

### Deploy with Remix (recommended)

See **[docs/DEPLOY_REMIX.md](docs/DEPLOY_REMIX.md)** for the full walkthrough. Quick version:

1. Get MON from [faucet.monad.xyz](https://faucet.monad.xyz)
2. Add Monad Testnet to MetaMask (chain ID `10143`, RPC `https://testnet-rpc.monad.xyz`)
3. Open [remix.ethereum.org](https://remix.ethereum.org)
4. Paste [`contracts/remix/PadelBlitzWager.sol`](contracts/remix/PadelBlitzWager.sol) → compile `0.8.20` → deploy via **Injected Provider - MetaMask**
5. Paste [`contracts/remix/PadelBlitzPlayerNFT.sol`](contracts/remix/PadelBlitzPlayerNFT.sol) → compile → deploy the same way
6. Save both addresses into the app (Wager tab + My Progress tab)

### Deploy with Foundry

```bash
forge install OpenZeppelin/openzeppelin-contracts@v5.0.2
forge build
forge create contracts/PadelBlitzPlayerNFT.sol:PadelBlitzPlayerNFT \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $DEPLOYER_PRIVATE_KEY
```

## Smart contracts

### `PadelBlitzPlayerNFT` (ERC-721)

Proper NFT minting for evolving player cards:

| Function | Description |
|----------|-------------|
| `mintPlayerCard(tokenURI)` | Mint a new ERC-721 token, or update metadata if the caller already has one |
| `tokenIdOf(player)` | Look up a player's token id (0 if none) |
| `tokenURI(tokenId)` | Read on-chain metadata URI |
| `playerTokenId(player)` | Same as `tokenIdOf` (public mapping) |

Collection name: **Padel Blitz Player** · symbol: **PADEL**

### `PadelBlitzWager`

Peer-to-peer MON wagers (separate from the NFT contract):

| Function | Description |
|----------|-------------|
| `createMatch(description)` | Create an open match (payable — sets wager amount) |
| `joinMatch(matchId)` | Join a match (must send exact `wagerAmount`) |
| `declareWinner(matchId, winner)` | Admin settles match; 1% fee to deployer |
| `cancelMatch(matchId)` | Cancel open match; refunds player 1 |
| `getMatch(matchId)` | Read match details |
| `storeNFT(tokenURI)` | Legacy metadata storage (use `PadelBlitzPlayerNFT` instead) |

Match states: Open → Active → Settled / Cancelled.

## API endpoints

Defined in `lib/api-spec/openapi.yaml` and implemented in `artifacts/api-server/src/routes/ai.ts`:

| Endpoint | Description |
|----------|-------------|
| `GET /api/healthz` | Health check |
| `POST /api/generate-nft` | Generate tier-aware superhero card image (returns base64 data URL) |
| `POST /api/coach` | Return three coaching focus areas from session data + recap |

NFT generation uses `gpt-image-1` with a DALL-E 3 fallback. Coaching uses `gpt-4o-mini` with structured JSON output.

## Tier system

Cumulative skill score (0–10) maps to tiers that control card theme and border colour:

| Tier | Score range | Accent |
|------|-------------|--------|
| Rookie | 0.0 – 2.9 | `#888780` |
| Club Player | 3.0 – 4.9 | `#1D9E75` |
| Contender | 5.0 – 6.9 | `#7B61FF` |
| Elite | 7.0 – 8.4 | `#EF9F27` |
| Legend | 8.5 – 10.0 | `#E24B4A` |

Per-session score is the average of the five skill ratings. Cumulative score is the rolling average of all sessions, stored in `localStorage` keyed by wallet address.

## Architecture notes

- **No database** — skill scores live in `localStorage`, wagers live on-chain, AI calls are stateless.
- **Shared API contract** — OpenAPI spec drives Zod validation and React Query hooks; run codegen after changing the spec.
- **Images as data URLs** — generated portraits are returned as base64 so the client renders them without object storage.

## Hackathon submission

This project is built for Monad Blitz. For submission steps, fork the [monad-blitz-lisbon](https://github.com/monad-developers/monad-blitz-lisbon) template repo and follow the process on the [Blitz Portal](https://blitz.devnads.com).

## License

MIT
