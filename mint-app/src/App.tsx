import { useEffect, useMemo, useState } from "react";
import { AuthButton } from "@coinbase/cdp-react/components/AuthButton";
import { useCurrentUser, useIsSignedIn, useSendUserOperation } from "@coinbase/cdp-hooks";
import { createPublicClient, encodeDeployData, encodeFunctionData, getAddress, http } from "viem";
import { base } from "viem/chains";
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

const createXAbi = [{
  type: "function",
  name: "deployCreate",
  stateMutability: "payable",
  inputs: [{ name: "initCode", type: "bytes" }],
  outputs: [{ name: "newContract", type: "address" }],
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

const CREATE_X = getAddress("0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed");
const CONTRACT_CREATION_TOPIC = "0x4db17dd5e4732fb6da34a148104a592783ca119a1e7bb8829eba6cbadef0b511";
const publicClient = createPublicClient({ chain: base, transport: http() });

const shortAddress = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`;

export default function App() {
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [config, setConfig] = useState<MintConfig | null>(null);
  const [selected, setSelected] = useState(1);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [operation, setOperation] = useState<"claim" | "deploy" | "ownerMint" | null>(null);
  const [operationToken, setOperationToken] = useState<string | null>(null);
  const [deployedContract, setDeployedContract] = useState<string | null>(null);
  const [adminContract, setAdminContract] = useState("");
  const [paymasterUrl, setPaymasterUrl] = useState("");
  const { isSignedIn } = useIsSignedIn();
  const { currentUser } = useCurrentUser();
  const { sendUserOperation, status, data: userOperation } = useSendUserOperation();

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

  useEffect(() => {
    if (status === "success" && userOperation?.transactionHash) {
      setTransactionHash(userOperation.transactionHash);
      if (operation === "claim") {
        setMessage(`Archive token ${operationToken} was confirmed on Base.`);
      } else if (operation === "ownerMint") {
        setMessage(`Owner reserve batch ${operationToken} was confirmed on Base.`);
      } else if (operation === "deploy") {
        publicClient.getTransactionReceipt({ hash: userOperation.transactionHash as `0x${string}` }).then((receipt) => {
          const creation = receipt.logs.find((log) =>
            log.address.toLowerCase() === CREATE_X.toLowerCase() && log.topics[0] === CONTRACT_CREATION_TOPIC,
          );
          const addressTopic = creation?.topics[1];
          if (!addressTopic) throw new Error("The CreateX deployment event was not found.");
          const address = getAddress(`0x${addressTopic.slice(-40)}`);
          setDeployedContract(address);
          setAdminContract(address);
          setMessage(`Archive contract deployed at ${address}.`);
        }).catch((error) => setMessage(error instanceof Error ? error.message : "Could not read the deployment receipt."));
      }
    }
  }, [operation, operationToken, status, userOperation]);

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
  const smartAccount = currentUser?.evmSmartAccounts?.[0];
  const mintReady = Boolean(config?.mintingEnabled && config.contractAddress);
  const isPending = status === "pending";
  const setupMode = new URLSearchParams(window.location.search).get("setup") === "archive";

  async function claimSelected() {
    if (!active || !config?.contractAddress || !smartAccount || !mintReady) return;
    setMessage(null);
    setTransactionHash(null);

    try {
      setOperation("claim");
      setOperationToken(active.number);
      const result = await sendUserOperation({
        evmSmartAccount: smartAccount,
        network: "base",
        calls: [
          {
            to: getAddress(config.contractAddress),
            value: 0n,
            data: encodeFunctionData({
              abi: claimAbi,
              functionName: "claim",
              args: [BigInt(active.sequence)],
            }),
          },
        ],
        useCdpPaymaster: true,
      });
      setMessage(`Archive token ${active.number} was submitted. User operation ${shortAddress(result.userOperationHash)} is being confirmed.`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "The claim could not be completed.";
      setMessage(detail.includes("AlreadyClaimed") ? "This wallet has already claimed its archive token." : detail);
    }
  }

  async function deployArchiveContract() {
    if (!smartAccount || !paymasterUrl.trim()) return;
    setMessage(null);
    setTransactionHash(null);
    setDeployedContract(null);
    setOperation("deploy");
    setOperationToken(null);

    try {
      const initCode = encodeDeployData({
        abi: constructorAbi,
        bytecode: archiveCreationBytecode,
        args: [
          getAddress(smartAccount),
          "https://tails-and-trails.github.io/nft/metadata/{id}.json",
          "https://tails-and-trails.github.io/nft/metadata/collection.json",
        ],
      });
      const result = await sendUserOperation({
        evmSmartAccount: smartAccount,
        network: "base",
        calls: [{
          to: CREATE_X,
          value: 0n,
          data: encodeFunctionData({ abi: createXAbi, functionName: "deployCreate", args: [initCode] }),
        }],
        paymasterUrl: paymasterUrl.trim(),
      });
      setMessage(`Contract deployment submitted. User operation ${shortAddress(result.userOperationHash)} is being confirmed.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The archive contract could not be deployed.");
    }
  }

  async function mintOwnerBatch(start: number, end: number) {
    if (!smartAccount || !paymasterUrl.trim() || !adminContract) return;
    setMessage(null);
    setTransactionHash(null);
    setOperation("ownerMint");
    setOperationToken(`${start}–${end}`);

    try {
      const tokenIds = Array.from({ length: end - start + 1 }, (_, index) => BigInt(start + index));
      const amounts = tokenIds.map(() => 1n);
      const result = await sendUserOperation({
        evmSmartAccount: smartAccount,
        network: "base",
        calls: [{
          to: getAddress(adminContract),
          value: 0n,
          data: encodeFunctionData({
            abi: ownerMintBatchAbi,
            functionName: "ownerMintBatch",
            args: [getAddress(smartAccount), tokenIds, amounts],
          }),
        }],
        paymasterUrl: paymasterUrl.trim(),
      });
      setMessage(`Owner reserve batch ${start}–${end} submitted as ${shortAddress(result.userOperationHash)}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Owner reserve batch ${start}–${end} failed.`);
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
          <p className="eyebrow">Base · ERC-1155 · gas sponsored</p>
          <h1>Keep one archive photograph in your wallet.</h1>
          <p className="lede">
            Choose from 173 companion-animal photographs made in Ericeira. The token costs nothing and the archive sponsors the Base network fee.
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
              {isSignedIn && smartAccount && (
                <p className="wallet-address">Smart wallet: <a href={`https://basescan.org/address/${smartAccount}`}>{shortAddress(smartAccount)}</a></p>
              )}
            </div>

            <div className="claim-step">
              <p className="step">03 / Claim</p>
              <button
                className="claim-button"
                type="button"
                disabled={!isSignedIn || !smartAccount || !mintReady || isPending}
                onClick={claimSelected}
              >
                {isPending ? "Confirming on Base…" : mintReady ? `Claim archive ${active?.number ?? ""} — free` : "Mint opening after deployment"}
              </button>
              <p className="gas-note">No payment requested. Network gas is sponsored by Tails &amp; Trails through CDP Paymaster.</p>
              {message && <p className="status-message" role="status">{message}</p>}
              {transactionHash && <a className="transaction" href={`https://basescan.org/tx/${transactionHash}`}>View transaction on BaseScan</a>}
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
            <p>This one-time control deploys the exact tested ERC-1155 bytecode through the verified CreateX factory. The signed-in smart wallet becomes the owner; no private key is exported.</p>
            <AuthButton />
            {smartAccount && <p className="wallet-address">Contract owner: {smartAccount}</p>}
            <label>Private Paymaster endpoint <input type="password" autoComplete="off" value={paymasterUrl} onChange={(event) => setPaymasterUrl(event.target.value)} /></label>
            <button className="claim-button" disabled={!smartAccount || !paymasterUrl.trim() || isPending || Boolean(deployedContract)} onClick={deployArchiveContract}>
              {isPending && operation === "deploy" ? "Deploying on Base…" : deployedContract ? "Contract deployed" : "Deploy archive contract with sponsored gas"}
            </button>
            {message && <p className="status-message" role="status">{message}</p>}
            {deployedContract && <a className="transaction" href={`https://basescan.org/address/${deployedContract}`}>Open deployed contract on BaseScan</a>}
            <label>Deployed contract <input value={adminContract} onChange={(event) => setAdminContract(event.target.value)} /></label>
            <div>
              {[[1, 50], [51, 100], [101, 150], [151, 173]].map(([start, end]) => (
                <button key={start} disabled={!smartAccount || !paymasterUrl.trim() || !adminContract || isPending} onClick={() => mintOwnerBatch(start, end)}>
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
