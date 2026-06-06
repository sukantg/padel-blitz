# Deploy to Monad Testnet with Remix

Step-by-step guide to deploy **Padel Blitz** contracts using [Remix](https://remix.ethereum.org) and MetaMask.

You will deploy two contracts:

| Contract | Purpose |
|----------|---------|
| `PadelBlitzWager` | On-chain MON wagers |
| `PadelBlitzPlayerNFT` | ERC-721 player card minting |

Use the Remix-ready copies in [`contracts/remix/`](../contracts/remix/) — they need no local build tooling.

---

## 1. Get test MON

1. Open [faucet.monad.xyz](https://faucet.monad.xyz).
2. Paste your MetaMask wallet address.
3. Request MON — you need a small amount for two deployments plus minting.

---

## 2. Add Monad Testnet to MetaMask

If the app has not added it for you, add the network manually:

| Field | Value |
|-------|-------|
| Network name | `Monad Testnet` |
| RPC URL | `https://testnet-rpc.monad.xyz` |
| Chain ID | `10143` |
| Currency symbol | `MON` |
| Block explorer | `https://testnet.monadexplorer.com` |

In MetaMask: **Networks → Add network → Add a network manually**.

---

## 3. Open Remix

1. Go to [remix.ethereum.org](https://remix.ethereum.org).
2. In the **File Explorer** (left panel), create a workspace folder, e.g. `padel-blitz`.
3. You will paste the contract files in the next steps.

---

## 4. Deploy `PadelBlitzWager` (no dependencies)

### Add the file

1. In Remix, create `PadelBlitzWager.sol` under `contracts/`.
2. Copy the full contents of [`contracts/remix/PadelBlitzWager.sol`](../contracts/remix/PadelBlitzWager.sol) into it.

### Compile

1. Open the **Solidity Compiler** tab (left sidebar).
2. Compiler version: **`0.8.20`** (or any `0.8.20+`).
3. Click **Compile PadelBlitzWager.sol**.
4. Fix any errors before continuing (there should be none).

### Deploy

1. Open **Deploy & Run Transactions**.
2. **Environment:** `Injected Provider - MetaMask` (confirm MetaMask connects).
3. Confirm MetaMask is on **Monad Testnet**.
4. **Contract:** select `PadelBlitzWager`.
5. Leave constructor arguments empty.
6. Click **Deploy**.
7. Approve the transaction in MetaMask.

### Save the address

1. Under **Deployed Contracts**, expand your `PadelBlitzWager` instance.
2. Copy the **contract address** at the top (starts with `0x`).
3. Save it — this is your **wager contract address**.

Optional checks in Remix:

- `admin()` → should return your wallet (you are the settle-match admin).
- `matchCount()` → should return `0`.

---

## 5. Deploy `PadelBlitzPlayerNFT` (OpenZeppelin via GitHub)

### Add the file

1. Create `PadelBlitzPlayerNFT.sol` under `contracts/`.
2. Copy the full contents of [`contracts/remix/PadelBlitzPlayerNFT.sol`](../contracts/remix/PadelBlitzPlayerNFT.sol).

The Remix copy uses GitHub import URLs for OpenZeppelin v5.0.2. Remix downloads them on first compile (needs internet).

### Compile

1. Solidity Compiler → version **`0.8.20`**.
2. Click **Compile PadelBlitzPlayerNFT.sol**.
3. First compile may take a few seconds while OpenZeppelin files are fetched.

**If compile fails on imports:**

- Ensure you are online.
- Try compiler **`0.8.20`** exactly.
- Alternative: in Remix, open the **Home** tab → enable the **OpenZeppelin** plugin → use `@openzeppelin/contracts/...` imports from [`contracts/PadelBlitzPlayerNFT.sol`](../contracts/PadelBlitzPlayerNFT.sol) instead.

### Deploy

1. **Deploy & Run Transactions** → `Injected Provider - MetaMask`.
2. **Contract:** `PadelBlitzPlayerNFT`.
3. No constructor args.
4. Click **Deploy** and confirm in MetaMask.

### Save the address

Copy the deployed **NFT contract address** — you need it for the My Progress tab.

Optional checks:

- `name()` → `Padel Blitz Player`
- `symbol()` → `PADEL`
- `totalSupply()` → `0`

---

## 6. Verify on the explorer

For each deployed address, open:

```
https://testnet.monadexplorer.com/address/<YOUR_CONTRACT_ADDRESS>
```

Confirm the deployment transaction succeeded and the contract exists.

---

## 7. Connect addresses to the app

### Option A — In the UI (quickest)

| Contract | Where to paste |
|----------|----------------|
| Wager | **Wager** tab → contract address field → Save |
| NFT | **My Progress** tab → NFT contract address field → Save |

### Option B — Environment variables

```env
VITE_CONTRACT_ADDRESS=0xYourWagerContract
VITE_NFT_CONTRACT_ADDRESS=0xYourNftContract
```

Restart or rebuild the frontend after setting env vars.

---

## 8. Test the deployment

### Wager contract

1. Connect MetaMask in the app (Monad Testnet).
2. Wager tab → create a small match (e.g. `0.01` MON).
3. In Remix, on your deployed `PadelBlitzWager`:
   - `matchCount()` should be `1`.
   - `getMatch(0)` returns the match struct.

As **admin** (your deployer wallet), you can call `declareWinner(0, winnerAddress)` from Remix after a second wallet joins.

### NFT contract

1. My Progress → generate a card → **Mint NFT**.
2. Approve the transaction in MetaMask.

**Note:** The app currently embeds the full AI image inside on-chain JSON metadata. That can be very large and may cause mint transactions to fail or cost a lot of gas. If minting reverts, try again after we move images off-chain, or test with minimal metadata via Remix:

```text
mintPlayerCard("ipfs://QmExample/metadata.json")
```

Called from Remix on the deployed NFT contract, with your wallet selected.

---

## Quick reference

| Setting | Value |
|---------|-------|
| Chain ID | `10143` |
| RPC | `https://testnet-rpc.monad.xyz` |
| Faucet | [faucet.monad.xyz](https://faucet.monad.xyz) |
| Explorer | [testnet.monadexplorer.com](https://testnet.monadexplorer.com) |
| Compiler | Solidity `0.8.20` |
| Deploy tool | Remix → Injected Provider - MetaMask |

| Role | Who |
|------|-----|
| Wager admin (`declareWinner`) | Wallet that deployed `PadelBlitzWager` |
| NFT minter | Any connected wallet (via app `mintPlayerCard`) |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| MetaMask shows wrong network | Switch to Monad Testnet (chain `10143`) |
| `insufficient funds` | Get more MON from the faucet |
| NFT compile import errors | Use files in `contracts/remix/`; stay online |
| Remix “creation failed” | Lower gas is rare on Monad; retry, check MON balance |
| App says contract not configured | Paste addresses in UI or set `VITE_*` env vars |
| Mint tx reverts | Metadata likely too large — see note in §8 |

---

## Contract files

| Remix file | Source |
|------------|--------|
| [`contracts/remix/PadelBlitzWager.sol`](../contracts/remix/PadelBlitzWager.sol) | Standalone wager contract |
| [`contracts/remix/PadelBlitzPlayerNFT.sol`](../contracts/remix/PadelBlitzPlayerNFT.sol) | ERC-721 with GitHub OZ imports |

Canonical sources (for Foundry / CI) live in [`contracts/`](../contracts/).
