import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { CHAIN_CONFIG, CONTRACT_ABI, getContractAddress } from '../config';
import { toast } from './use-toast';

interface WalletState {
  provider: BrowserProvider | null;
  contract: Contract | null;
  address: string;
  isConnected: boolean;
  chainId: number | null;
  isOnMonad: boolean;
  connectWallet: () => Promise<void>;
  switchToMonad: () => Promise<void>;
  disconnect: () => void;
  contractAddress: string | undefined;
}

// Placeholder address used for the front-end-only "connected" demo state.
const DEMO_ADDRESS = '0xDe3300000000000000000000000000000000De30';

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [address, setAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  // When a real wallet handshake can't complete (e.g. inside the preview iframe
  // or no extension installed), we still flip the UI to a "connected" demo state
  // so the app is fully explorable. isDemo keeps us from ever attaching a real
  // signer or attempting on-chain transactions against this placeholder address.
  const [isDemo, setIsDemo] = useState(false);

  const connectDemo = () => {
    setAddress(DEMO_ADDRESS);
    setIsConnected(true);
    setIsDemo(true);
    setChainId(CHAIN_CONFIG.chainId);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const p = new BrowserProvider(window.ethereum);
      setProvider(p);

      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAddress(accounts[0] || '');
        setIsConnected(!!accounts[0]);
      });

      window.ethereum.on('chainChanged', (chainIdHex: string) => {
        setChainId(parseInt(chainIdHex, 16));
      });

      p.getNetwork()
        .then(network => setChainId(Number(network.chainId)))
        .catch(() => {});

      // eth_accounts: returns already-authorized accounts without prompting.
      // Guard it so a denied/locked wallet doesn't surface an unhandled rejection.
      p.listAccounts()
        .then(accounts => {
          if (accounts.length > 0) {
            setIsDemo(false);
            setAddress(accounts[0].address);
            setIsConnected(true);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const contractAddr = getContractAddress();
    // Only attach a signer once the user has actually connected; calling
    // getSigner() beforehand triggers a wallet prompt that throws if rejected.
    if (provider && contractAddr && isConnected && address && !isDemo) {
      provider.getSigner().then(signer => {
        const c = new Contract(contractAddr, CONTRACT_ABI, signer);
        setContract(c);
      }).catch(e => console.error("Failed to get signer", e));
    } else {
      setContract(null);
    }
  }, [provider, address, isConnected, isDemo]); // re-init contract when connection/address changes

  // Switch MetaMask to Monad Testnet, adding the network first if it's missing.
  const switchToMonad = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CHAIN_CONFIG.chainIdHex }]
      });
    } catch (switchErr) {
      const code = (switchErr as { code?: number })?.code;
      // 4902 = chain not added yet; add it (which also switches to it).
      if (code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: CHAIN_CONFIG.chainIdHex,
              chainName: CHAIN_CONFIG.chainName,
              rpcUrls: CHAIN_CONFIG.rpcUrls,
              nativeCurrency: CHAIN_CONFIG.nativeCurrency,
              blockExplorerUrls: CHAIN_CONFIG.blockExplorerUrls
            }
          ]
        });
      } else {
        throw switchErr;
      }
    }
  };

  const connectWallet = async () => {
    // The Replit preview runs the app inside a cross-origin iframe. Even when
    // MetaMask injects window.ethereum here, it blocks dapp connection prompts
    // from inside such an iframe, so eth_requestAccounts silently never opens
    // the popup. Always route connecting to a real top-level tab instead.
    const inIframe = typeof window !== 'undefined' && window.self !== window.top;
    if (inIframe) {
      toast({
        title: 'Open in a new tab to connect',
        description:
          'Wallet extensions like MetaMask can\u2019t prompt inside this preview. We\u2019ve opened the app in a new tab \u2014 connect your wallet there.',
      });
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
      // Still reflect a connected state in this preview so the app is explorable.
      connectDemo();
      return;
    }

    if (!window.ethereum) {
      toast({
        variant: 'destructive',
        title: 'MetaMask not found',
        description: 'Install the MetaMask browser extension, then try connecting again.',
      });
      connectDemo();
      return;
    }

    // Step 1: request account access.
    let accounts: string[] = [];
    try {
      accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];
    } catch (err) {
      const code = (err as { code?: number })?.code;
      if (code === 4001) {
        toast({
          title: 'Connection cancelled',
          description: 'You declined the connection request in your wallet.',
        });
      } else if (code === -32002) {
        toast({
          title: 'Request already pending',
          description: 'Open your wallet extension to approve the pending connection request.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Couldn\u2019t connect',
          description: 'Something went wrong connecting your wallet. Please try again.',
        });
      }
      console.error(err);
      // Connection failed/declined — still show a connected state in the UI.
      connectDemo();
      return;
    }

    // accountsChanged often doesn't fire on the first connect, so set state directly.
    if (accounts?.[0]) {
      setIsDemo(false);
      setAddress(accounts[0]);
      setIsConnected(true);
    }

    // Step 2: switch to Monad. A failure here does NOT undo the connection,
    // so it must not be reported as a rejected connection.
    try {
      await switchToMonad();
    } catch (err) {
      const code = (err as { code?: number })?.code;
      if (code === 4001) {
        toast({
          title: 'Network switch needed',
          description:
            'You\u2019re connected. Approve the switch to Monad Testnet \u2014 use the \u201CSwitch to Monad\u201D button to retry.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Could not switch network',
          description:
            'Connected, but switching to Monad Testnet failed. Try the \u201CSwitch to Monad\u201D button.',
        });
      }
      console.error(err);
    }
  };

  const disconnect = () => {
    setProvider(null);
    setContract(null);
    setAddress('');
    setIsConnected(false);
    setChainId(null);
    setIsDemo(false);
  };

  const value: WalletState = {
    provider,
    contract,
    address,
    isConnected,
    chainId,
    isOnMonad: chainId === CHAIN_CONFIG.chainId,
    connectWallet,
    switchToMonad,
    disconnect,
    contractAddress: getContractAddress()
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useContract(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useContract must be used within a WalletProvider");
  }
  return ctx;
}
