import { useState } from "react";
import { useContract } from "../hooks/useContract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ethers } from "ethers";
import { WagerCourt, type Team } from "./WagerCourt";

export function WagerTab() {
  const { address, contract, isConnected } = useContract();

  const [backedTeam, setBackedTeam] = useState<Team | null>(null);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [placedWager, setPlacedWager] = useState<{ team: Team; amount: string; onChain: boolean } | null>(null);
  const [joinId, setJoinId] = useState("");
  const [joinMatchData, setJoinMatchData] = useState<any>(null);
  const [customAddress, setCustomAddress] = useState(localStorage.getItem('padel_contract_address') || "");

  const handleSetAddress = () => {
    localStorage.setItem('padel_contract_address', customAddress);
    window.location.reload();
  };

  // Place a wager on the backed team. With a connected wallet + configured
  // contract it runs on-chain; otherwise it records a local demo wager so the
  // flow is fully usable in the preview where MetaMask can't run.
  const placeWager = async () => {
    if (!backedTeam) {
      alert("Back a team on the court before placing a wager.");
      return;
    }

    const canTransact = !!contract && isConnected;
    if (!canTransact) {
      setPlacedWager({ team: backedTeam, amount: amount || "0", onChain: false });
      return;
    }

    try {
      const val = ethers.parseEther(amount || "0");
      const fullDesc = `Backing Team ${backedTeam} — ${desc}`;
      const tx = await contract!.createMatch(fullDesc, { value: val });
      await tx.wait();
      setPlacedWager({ team: backedTeam, amount: amount || "0", onChain: true });
    } catch (e) {
      console.error(e);
      alert("Failed to create on-chain match");
    }
  };

  const lookupMatch = async () => {
    if (!contract || !joinId) return;
    try {
      const data = await contract.getMatch(joinId);
      setJoinMatchData(data);
    } catch (e) {
      console.error(e);
      setJoinMatchData(null);
    }
  };

  const joinWager = async () => {
    if (!contract || !joinMatchData) return;
    try {
      const tx = await contract.joinMatch(joinId, { value: joinMatchData.wagerAmount });
      await tx.wait();
      alert("Joined match!");
    } catch (e) {
      console.error(e);
      alert("Failed to join");
    }
  };

  const onChainReady = !!contract && isConnected;

  return (
    <div className="space-y-8">
      <WagerCourt backedTeam={backedTeam} onBackTeam={setBackedTeam} />

      {placedWager && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
              Wager Placed{placedWager.onChain ? " (On-chain)" : " (Demo)"}
            </p>
            <p className="text-sm font-semibold">
              Backing Team {placedWager.team} for {placedWager.amount || "0"} MON
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPlacedWager(null)}>
            Clear
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Place Wager</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Description (e.g. 'Loser buys drinks')" value={desc} onChange={e => setDesc(e.target.value)} />
            <Input placeholder="Amount in MON" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
            <Button className="w-full" onClick={placeWager} disabled={!backedTeam}>
              {backedTeam ? `Place Wager on Team ${backedTeam}` : "Back a team on the court first"}
            </Button>
            {!onChainReady && (
              <p className="text-xs text-muted-foreground text-center">
                Demo mode — connect a wallet on Monad to settle this wager on-chain.
              </p>
            )}
          </CardContent>
        </Card>

        {onChainReady ? (
          <Card>
            <CardHeader>
              <CardTitle>Join Wager</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Match ID" type="number" value={joinId} onChange={e => setJoinId(e.target.value)} />
                <Button onClick={lookupMatch} variant="outline">Lookup</Button>
              </div>

              {joinMatchData && (
                <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                  <p><strong>Desc:</strong> {joinMatchData.description}</p>
                  <p><strong>Amount:</strong> {ethers.formatEther(joinMatchData.wagerAmount)} MON</p>
                  <p><strong>Creator:</strong> {joinMatchData.player1.slice(0, 6)}...</p>
                  <Button className="w-full mt-2" onClick={joinWager} disabled={joinMatchData.state !== 0n}>
                    Join with {ethers.formatEther(joinMatchData.wagerAmount)} MON
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>On-chain Settlement (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect a wallet to wager real MON on Monad Testnet. Paste your deployed
                PadelBlitzWager address to enable on-chain matches.
              </p>
              <Input
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder="0x... contract address"
              />
              <Button onClick={handleSetAddress} variant="outline" className="w-full">
                Save Contract Address
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
