import { useEffect, useMemo, useState } from "react";
import { AuthButton } from "@coinbase/cdp-react/components/AuthButton";
import { useCurrentUser, useIsSignedIn, useSignEvmHash } from "@coinbase/cdp-hooks";
import {
  createPublicClient,
  defineChain,
  encodeDeployData,
  encodeFunctionData,
  formatEther,
  getAddress,
  http,
  keccak256,
  parseSignature,
  recoverAddress,
  serializeTransaction,
  type Address,
  type Hex,
} from "viem";
import type { MintConfig } from "./config";
import { archiveCreationBytecode } from "./generatedContract";

type ArchiveImage = {
  number: string;
  sequence: number;
  imageUrl: string;
  ipfsUrl: string;
  pageUrl: string;
  commonsUrl: string;
  descriptionEn: string;
  subject: string;
  sha256: string;
  keywords: string[];
};

type Catalogue = {
  images: ArchiveImage[];
};

const claimAbi = [
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
  },
] as const;

const constructorAbi = [{
  type: "constructor",
  stateMutability: "nonpayable",
  inputs: [
    { name: "initialOwner", type: "address" },
    { name: "tokenBaseURI", type: "string" },
    { name: "collectionMetadataURI", type: "string" },
  ],
}] as const;

const ownerMintBatchAbi = [{
  type: "function",
  name: "ownerMintBatch",
  stateMutability: "nonpayable",
  inputs: [
    { name: "recipient", type: "address" },
    { name: "tokenIds", type: "uint256[]" },
    { name: "amounts", type: "uint256[]" },
  ],
  outputs: [],
}] as const;

const CARE_EMAIL = "care@tailsandtrails.pt";
const CALYPSO_RPC = "https://mainnet.skalenodes.com/v1/calypso";
const CALYPSO_EXPLORER = "https://honorable-steel-rasalhague.explorer.mainnet.skalenodes.com";
const SFUEL_STATION = "https://sfuelstation.com";
const SKALE_ACCESS_CONTROL_DOCS = "https://docs.skale.space/developers/run-a-skale-chain/access-control";
const SKALE_CONFIG_CONTROLLER = "0xD2002000000000000000000000000000000000d2";
const skaleConfigControllerAbi = [{
  type: "function",
  name: "isAddressWhitelisted",
  stateMutability: "view",
  inputs: [{ name: "addr", type: "address" }],
  outputs: [{ name: "", type: "bool" }],
}] as const;
const calypso = defineChain({
  id: 1564830818,
  name: "SKALE Calypso Hub",
  nativeCurrency: { name: "SKALE Fuel", symbol: "sFUEL", decimals: 18 },
  rpcUrls: { default: { http: [CALYPSO_RPC] } },
  blockExplorers: { default: { name: "SKALE Explorer", url: CALYPSO_EXPLORER } },
});
const publicClient = createPublicClient({ chain: calypso, transport: http(CALYPSO_RPC) });

const shortAddress = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`;

export default function App() {
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [config, setConfig] = useState<MintConfig | null>(null);
  const [selected, setSelected] = useState(1);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [operation, setOperation] = useState<"claim" | "deploy" | "ownerMint" | null>(null);
  const [deployedContract, setDeployedContract] = useState<string | null>(null);
  const [adminContract, setAdminContract] = useState("");
  const [sFuelBalance, setSFuelBalance] = useState<bigint | null>(null);
  const [deploymentApproved, setDeploymentApproved] = useState<boolean | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { isSignedIn } = useIsSignedIn();
  const { currentUser } = useCurrentUser();
  const { signEvmHash } = useSignEvmHash();

  useEffect(() => {
    Promise.all([
      fetch("/catalog.json").then((response) => response.json()),
      fetch(`${import.meta.env.BASE_URL}mint-config.json`, { cache: "no-store" }).then((response) => response.json()),
    ])
      .then(([nextCatalogue, nextConfig]) => {
        setCatalogue(nextCatalogue);
        setConfig(nextConfig);
      })
      .catch(() => setMessage("The archive configuration could not be loaded. Please try again."));
  }, []);

  const images = useMemo(() => {
    const all = catalogue?.images ?? [];
    const needle = query.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((image) =>
      [image.number, image.subject, image.descriptionEn, ...image.keywords]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [catalogue, query]);

  const active = catalogue?.images.find((image) => image.sequence === selected) ?? catalogue?.images[0];
  const evmAccount = currentUser?.evmAccounts?.[0];
  const signedInEmail = currentUser?.authenticationMethods.email?.email?.toLowerCase() ?? null;
  const isCareOwner = signedInEmail === CARE_EMAIL;
  const mintReady = Boolean(config?.mintingEnabled && config.contractAddress);
  const setupMode = new URLSearchParams(window.location.search).get("setup") === "archive";

  useEffect(() => {
    if (!evmAccount) {
      setSFuelBalance(null);
      return;
    }
    publicClient.getBalance({ address: getAddress(evmAccount) })
      .then(setSFuelBalance)
      .catch(() => setSFuelBalance(null));
  }, [evmAccount, transactionHash]);

  useEffect(() => {
    if (!evmAccount || !isCareOwner || !setupMode) {
      setDeploymentApproved(null);
      return;
    }
    let mounted = true;
    const checkDeploymentApproval = () => publicClient.readContract({
      address: getAddress(SKALE_CONFIG_CONTROLLER),
      abi: skaleConfigControllerAbi,
      functionName: "isAddressWhitelisted",
      args: [getAddress(evmAccount)],
    }).then((approved) => {
      if (mounted) setDeploymentApproved(approved);
    }).catch(() => {
      if (mounted) setDeploymentApproved(false);
    });
    void checkDeploymentApproval();
    const timer = window.setInterval(checkDeploymentApproval, 30_000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [evmAccount, isCareOwner, setupMode]);

  async function sendCalypsoTransaction({ to, data, gas }: { to?: Address; data: Hex; gas: bigint }) {
    if (!evmAccount) throw new Error("Sign in with the wallet controlled by your Tails & Trails account.");
    const account = getAddress(evmAccount);
    const balance = await publicClient.getBalance({ address: account });
    if (balance === 0n) {
      throw new Error("This wallet needs free sFUEL before it can submit a zero-cost transaction. Use the sFUEL Station link, then refresh the balance.");
    }
    await publicClient.call({ account, to, data, value: 0n, gas });
    const [nonce, gasPrice] = await Promise.all([
      publicClient.getTransactionCount({ address: account, blockTag: "pending" }),
      publicClient.getGasPrice(),
    ]);
    const transaction = {
      chainId: calypso.id,
      type: "eip1559" as const,
      nonce,
      gas,
      maxFeePerGas: gasPrice,
      maxPriorityFeePerGas: 0n,
      ...(to ? { to } : {}),
      data,
      value: 0n,
    };
    const unsignedTransaction = serializeTransaction(transaction);
    const transactionDigest = keccak256(unsignedTransaction);
    const { signature } = await signEvmHash({ evmAccount: account, hash: transactionDigest });
    const recoveredAddress = await recoverAddress({ hash: transactionDigest, signature });
    if (getAddress(recoveredAddress) !== account) {
      throw new Error("The signed transaction did not match the care-controlled wallet.");
    }
    const signedTransaction = serializeTransaction(transaction, parseSignature(signature));
    const hash = await publicClient.sendRawTransaction({ serializedTransaction: signedTransaction });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error("The SKALE transaction reverted.");
    setTransactionHash(hash);
    return receipt;
  }

  async function claimSelected() {
    if (!active || !config?.contractAddress || !evmAccount || !mintReady) return;
    setMessage(null);
    setTransactionHash(null);
    setIsPending(true);

    try {
      setOperation("claim");
      await sendCalypsoTransaction({
        to: getAddress(config.contractAddress),
        gas: 500_000n,
        data: encodeFunctionData({
          abi: claimAbi,
          functionName: "claim",
          args: [BigInt(active.sequence)],
        }),
      });
      setMessage(`Archive token ${active.number} was confirmed on SKALE Calypso.`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "The claim could not be completed.";
      setMessage(detail.includes("AlreadyClaimed") ? "This wallet has already claimed its archive token." : detail);
    } finally {
      setIsPending(false);
    }
  }

  async function deployArchiveContract() {
    if (!evmAccount || !isCareOwner) return;
    setMessage(null);
    setTransactionHash(null);
    setDeployedContract(null);
    setOperation("deploy");
    setIsPending(true);

    try {
      const initCode = encodeDeployData({
        abi: constructorAbi,
        bytecode: archiveCreationBytecode,
        args: [
          getAddress(evmAccount),
          "https://tails-and-trails.github.io/nft/metadata/{id}.json",
          "https://tails-and-trails.github.io/nft/metadata/collection.json",
        ],
      });
      const receipt = await sendCalypsoTransaction({ data: initCode, gas: 5_000_000n });
      if (!receipt.contractAddress) throw new Error("The deployment receipt did not contain a contract address.");
      const contractAddress = getAddress(receipt.contractAddress);
      setDeployedContract(contractAddress);
      setAdminContract(contractAddress);
      setMessage(`Archive contract deployed at ${contractAddress}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The archive contract could not be deployed.");
    } finally {
      setIsPending(false);
    }
  }

  async function mintOwnerBatch(start: number, end: number) {
    if (!evmAccount || !isCareOwner || !adminContract) return;
    setMessage(null);
    setTransactionHash(null);
    setOperation("ownerMint");
    setIsPending(true);

    try {
      const tokenIds = Array.from({ length: end - start + 1 }, (_, index) => BigInt(start + index));
      const amounts = tokenIds.map(() => 1n);
      await sendCalypsoTransaction({
        to: getAddress(adminContract),
        gas: 5_000_000n,
        data: encodeFunctionData({
          abi: ownerMintBatchAbi,
          functionName: "ownerMintBatch",
          args: [getAddress(evmAccount), tokenIds, amounts],
        }),
      });
      setMessage(`Owner reserve batch ${start}–${end} was confirmed on SKALE Calypso.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Owner reserve batch ${start}–${end} failed.`);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="Tails and Trails archive home">
          <span className="mark" aria-hidden="true">T&amp;T</span>
          <span>Tails &amp; Trails <small>Open Image Archive</small></span>
        </a>
        <nav aria-label="Archive links">
          <a href="/">Catalogue</a>
          <a href="/pet-sitter/blockchain-registry/">Registry</a>
          <a href="/licence/">Licence</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">SKALE Calypso · ERC-1155 · zero gas cost</p>
          <h1>Keep one archive photograph in your wallet.</h1>
          <p className="lede">
            Choose from 173 companion-animal photographs made in Ericeira. The token and SKALE Calypso network transaction both cost nothing.
          </p>
          <div className="facts" aria-label="Collection facts">
            <span><strong>173</strong> records</span>
            <span><strong>100</strong> editions each</span>
            <span><strong>1</strong> public claim per wallet</span>
            <span><strong>CC BY 4.0</strong> images</span>
          </div>
        </section>

        <section className="mint-layout" aria-label="Choose and claim an archive token">
          <div className="preview-panel">
            {active ? (
              <>
                <div className="image-frame">
                  <img src={active.imageUrl} alt={active.descriptionEn} />
                  <span className="record-number">Archive {active.number}</span>
                </div>
                <div className="record-copy">
                  <p className="eyebrow">Selected record</p>
                  <h2>{active.descriptionEn}</h2>
                  <div className="record-links">
                    <a href={active.pageUrl}>Full record</a>
                    <a href={active.commonsUrl}>Wikimedia Commons</a>
                    <a href={active.ipfsUrl}>IPFS image</a>
                  </div>
                  <p className="hash"><span>SHA-256</span> {active.sha256}</p>
                </div>
              </>
            ) : <div className="loading">Loading the archive…</div>}
          </div>

          <aside className="claim-panel">
            <p className="step">01 / Choose</p>
            <label htmlFor="archive-search">Search the archive</label>
            <input
              id="archive-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="dog, cat, portrait, beach…"
            />
            <div className="picker" aria-label="Archive records">
              {images.map((image) => (
                <button
                  key={image.sequence}
                  className={image.sequence === selected ? "selected" : ""}
                  onClick={() => setSelected(image.sequence)}
                  aria-label={`Select archive record ${image.number}`}
                >
                  <img src={image.imageUrl} alt="" loading="lazy" />
                  <span>{image.number}</span>
                </button>
              ))}
            </div>

            <div className="wallet-step">
              <p className="step">02 / Wallet</p>
              <AuthButton />
              {isSignedIn && evmAccount && (
                <>
                  <p className="wallet-address">Wallet: <a href={`${CALYPSO_EXPLORER}/address/${evmAccount}`}>{shortAddress(evmAccount)}</a></p>
                  <p className="wallet-address">sFUEL: {sFuelBalance === null ? "checking…" : Number(formatEther(sFuelBalance)).toFixed(4)}</p>
                  {sFuelBalance === 0n && <p className="wallet-address"><a href={SFUEL_STATION} target="_blank" rel="noreferrer">Get free sFUEL</a>, then reload this page.</p>}
                </>
              )}
            </div>

            <div className="claim-step">
              <p className="step">03 / Claim</p>
              <button
                className="claim-button"
                type="button"
                disabled={!isSignedIn || !evmAccount || !mintReady || isPending || sFuelBalance === 0n}
                onClick={claimSelected}
              >
                {isPending ? "Confirming on SKALE…" : mintReady ? `Claim archive ${active?.number ?? ""} — free` : "Mint opening after deployment"}
              </button>
              <p className="gas-note">No payment or card requested. SKALE uses free, non-tradeable sFUEL for network gas.</p>
              {message && <p className="status-message" role="status">{message}</p>}
              {transactionHash && <a className="transaction" href={`${CALYPSO_EXPLORER}/tx/${transactionHash}`}>View transaction on SKALE Explorer</a>}
            </div>
          </aside>
        </section>

        <section className="provenance">
          <div>
            <p className="eyebrow">Verifiable provenance</p>
            <h2>An archive token, not an exclusive licence.</h2>
          </div>
          <div className="provenance-copy">
            <p>Each token points to an immutable metadata record and the photograph’s SHA-256 digest. The archive release is also recorded by DOI and Merkle root.</p>
            <p>Every photograph remains available under Creative Commons Attribution 4.0. Owning a token does not transfer copyright, restrict public reuse, or promise financial value.</p>
            <div className="provenance-links">
              <a href="/">Full image collection</a>
              <a href="https://github.com/tails-and-trails/tails-and-trails.github.io/blob/main/nft/src/TailsAndTrailsArchive.sol">ERC-1155 contract source</a>
              <a href="https://doi.org/10.5281/zenodo.21856091">Zenodo DOI</a>
              <a href="/pet-sitter/blockchain-registry/">Integrity registry</a>
              <a href="https://github.com/tails-and-trails/tailsandtrails">Source archive</a>
            </div>
          </div>
        </section>

        {setupMode && (
          <section className="setup-panel" aria-label="One-time archive deployment">
            <p className="eyebrow">Temporary organization setup</p>
            <h2>Deploy the tested archive contract</h2>
            <p>This one-time control deploys the tested ERC-1155 bytecode directly to SKALE Calypso. It is restricted to the care@tailsandtrails.pt login. The care-controlled EOA becomes the owner; no private key is exported.</p>
            <AuthButton />
            {signedInEmail && <p className="wallet-address">Signed in as: {signedInEmail}</p>}
            {evmAccount && <p className="wallet-address">Contract owner: {evmAccount}</p>}
            {!isCareOwner && isSignedIn && <p className="status-message">Sign out and use care@tailsandtrails.pt. Personal accounts cannot deploy this collection.</p>}
            {isCareOwner && sFuelBalance === 0n && <p className="status-message">Get free sFUEL for the owner wallet at <a href={SFUEL_STATION} target="_blank" rel="noreferrer">sFUEL Station</a>, then reload.</p>}
            {isCareOwner && deploymentApproved === null && <p className="status-message">Checking SKALE deployer approval…</p>}
            {deploymentApproved === false && <p className="status-message">Deployment is paused. Calypso mainnet requires SKALE to grant this care wallet the DEPLOYER_ROLE first. No collection contract has been created. This page checks again automatically. <a href={SKALE_ACCESS_CONTROL_DOCS} target="_blank" rel="noreferrer">Official access-control details</a>.</p>}
            <button className="claim-button" disabled={!deploymentApproved || !evmAccount || !isCareOwner || sFuelBalance === 0n || isPending || Boolean(deployedContract)} onClick={deployArchiveContract}>
              {isPending && operation === "deploy" ? "Deploying on SKALE…" : deployedContract ? "Contract deployed" : deploymentApproved ? "Deploy archive contract — free" : "Waiting for SKALE deployer approval"}
            </button>
            {message && <p className="status-message" role="status">{message}</p>}
            {deployedContract && <a className="transaction" href={`${CALYPSO_EXPLORER}/address/${deployedContract}`}>Open deployed contract on SKALE Explorer</a>}
            <label>Deployed contract <input value={adminContract} onChange={(event) => setAdminContract(event.target.value)} /></label>
            <div>
              {[[1, 50], [51, 100], [101, 150], [151, 173]].map(([start, end]) => (
                <button key={start} disabled={!deploymentApproved || !evmAccount || !isCareOwner || sFuelBalance === 0n || !adminContract || isPending} onClick={() => mintOwnerBatch(start, end)}>
                  Mint owner reserve {start}–{end}
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer>
        <p>Tails &amp; Trails Open Image Archive · Ericeira, Portugal</p>
        <p><a href="mailto:care@tailsandtrails.pt">care@tailsandtrails.pt</a> · <a href="/llms.txt">llms.txt</a></p>
      </footer>
    </>
  );
}
