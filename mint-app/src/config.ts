import type { Config } from "@coinbase/cdp-react";

export const cdpConfig: Config = {
  projectId: "ed543649-466d-4cdc-a735-5d01311bf133",
  ethereum: { createOnLogin: "eoa" },
  appName: "Tails & Trails Open Image Archive",
  appLogoUrl: "https://tails-and-trails.github.io/ericeira-pet-care-images/tails-and-trails-pet-care-ericeira-001/tails-and-trails-pet-care-ericeira-001.jpg",
  authMethods: ["email", "sms"],
};

export type MintConfig = {
  projectId: string;
  network: "skale-calypso";
  chainId: 1564830818;
  contractAddress: `0x${string}` | null;
  metadataCid: string | null;
  mintingEnabled: boolean;
  maxSupplyPerToken: number;
  collectionSize: number;
};
