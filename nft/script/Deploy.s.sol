// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {TailsAndTrailsArchive} from "../src/TailsAndTrailsArchive.sol";

contract DeployTailsAndTrailsArchive is Script {
    function run() external returns (TailsAndTrailsArchive archive) {
        address owner = vm.envAddress("NFT_OWNER_ADDRESS");
        string memory tokenBaseURI = vm.envString("NFT_TOKEN_BASE_URI");
        string memory collectionURI = vm.envString("NFT_COLLECTION_URI");

        vm.startBroadcast();
        archive = new TailsAndTrailsArchive(owner, tokenBaseURI, collectionURI);
        vm.stopBroadcast();
    }
}
