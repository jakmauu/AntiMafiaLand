import { useCallback, useState } from "react";
import { ethers } from "ethers";

const CONTRACT_ABI = ["function requestTransfer(uint256 _landId, address _to) public"];

export function useWallet() {
  const [walletAddress, setWalletAddress] = useState("");
  const [walletError, setWalletError] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);

  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) throw new Error("MetaMask tidak terdeteksi.");
      setWalletLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setWalletAddress(accounts[0] || "");
      setWalletError("");
      return accounts[0] || "";
    } catch (error) {
      setWalletError(error.message);
      throw error;
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const requestTransfer = useCallback(async ({ contractAddress, landId, to }) => {
    if (!window.ethereum) throw new Error("MetaMask tidak terdeteksi.");
    if (!contractAddress) throw new Error("Contract address belum dimuat.");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
    const tx = await contract.requestTransfer(BigInt(landId), to);
    await tx.wait();
    return tx;
  }, []);

  return { walletAddress, walletError, walletLoading, connectWallet, requestTransfer };
}
