import { useContract } from "../hooks/useContract";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CHAIN_CONFIG } from "../config";

export function ConnectWallet() {
  const { isConnected, address, connectWallet, switchToMonad, isOnMonad, disconnect } =
    useContract();

  if (isConnected) {
    if (!isOnMonad) {
      return (
        <Button onClick={switchToMonad} variant="destructive" size="sm">
          Switch to Monad
        </Button>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-muted"
          >
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <div className="flex flex-col items-end leading-tight">
              <span className="text-sm font-medium">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {CHAIN_CONFIG.chainName}
              </span>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="font-mono text-xs">
            {address.slice(0, 6)}...{address.slice(-4)}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={disconnect} className="text-destructive focus:text-destructive">
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={connectWallet} variant="default" size="sm">
      Connect Wallet
    </Button>
  );
}
