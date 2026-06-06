export const CHAIN_CONFIG = {
  chainId: 10143,
  chainIdHex: "0x279F",
  chainName: "Monad Testnet",
  rpcUrls: ["https://testnet-rpc.monad.xyz"],
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  blockExplorerUrls: ["https://testnet.monadexplorer.com"]
};

export const CONTRACT_ABI = [
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "matchId", "type": "uint256" }
    ],
    "name": "MatchCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "matchId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "player1", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "wagerAmount", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "description", "type": "string" }
    ],
    "name": "MatchCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "matchId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "player2", "type": "address" }
    ],
    "name": "MatchJoined",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "matchId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "winner", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "payout", "type": "uint256" }
    ],
    "name": "MatchSettled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "tokenURI", "type": "string" }
    ],
    "name": "NFTStored",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "admin",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "matchId", "type": "uint256" }],
    "name": "cancelMatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "description", "type": "string" }],
    "name": "createMatch",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "matchId", "type": "uint256" },
      { "internalType": "address", "name": "winner", "type": "address" }
    ],
    "name": "declareWinner",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "matchId", "type": "uint256" }],
    "name": "getMatch",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "player1", "type": "address" },
          { "internalType": "address", "name": "player2", "type": "address" },
          { "internalType": "uint256", "name": "wagerAmount", "type": "uint256" },
          { "internalType": "uint8", "name": "state", "type": "uint8" },
          { "internalType": "address", "name": "winner", "type": "address" },
          { "internalType": "string", "name": "description", "type": "string" },
          { "internalType": "uint256", "name": "createdAt", "type": "uint256" }
        ],
        "internalType": "struct PadelBlitzWager.Match",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "player", "type": "address" }],
    "name": "getNFT",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "matchId", "type": "uint256" }],
    "name": "joinMatch",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "matchId", "type": "uint256" }],
    "name": "matches",
    "outputs": [
      { "internalType": "address", "name": "player1", "type": "address" },
      { "internalType": "address", "name": "player2", "type": "address" },
      { "internalType": "uint256", "name": "wagerAmount", "type": "uint256" },
      { "internalType": "uint8", "name": "state", "type": "uint8" },
      { "internalType": "address", "name": "winner", "type": "address" },
      { "internalType": "string", "name": "description", "type": "string" },
      { "internalType": "uint256", "name": "createdAt", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "matchCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "tokenURI", "type": "string" }],
    "name": "storeNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export const TIERS = [
  { name: "Rookie", min: 0.0, max: 2.9, color: "#888780", style: "scrappy underdog, casual padel kit" },
  { name: "Club Player", min: 3.0, max: 4.9, color: "#1D9E75", style: "confident club hero, blue kit" },
  { name: "Contender", min: 5.0, max: 6.9, color: "#7B61FF", style: "fierce competitor, purple armour" },
  { name: "Elite", min: 7.0, max: 8.4, color: "#EF9F27", style: "golden champion, glowing aura" },
  { name: "Legend", min: 8.5, max: 10.0, color: "#E24B4A", style: "mythic god-tier, crimson cape" },
];

export const getTier = (score: number) => {
  const clamped = Math.max(0, Math.min(10, score));
  // Contiguous ranges: lower-inclusive, upper-exclusive (last tier is fully inclusive).
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (clamped >= TIERS[i].min) return TIERS[i];
  }
  return TIERS[0];
};

export const getContractAddress = () => {
  return import.meta.env.VITE_CONTRACT_ADDRESS || localStorage.getItem('padel_contract_address') || "";
};
