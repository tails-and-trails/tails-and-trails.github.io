// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {TailsAndTrailsArchive} from "../src/TailsAndTrailsArchive.sol";

contract TailsAndTrailsArchiveTest is Test {
    TailsAndTrailsArchive internal archive;
    address internal owner = makeAddr("owner");
    address internal collector = makeAddr("collector");
    address internal secondCollector = makeAddr("secondCollector");

    function setUp() public {
        archive = new TailsAndTrailsArchive(owner, "ipfs://metadata/{id}.json", "ipfs://metadata/collection.json");
    }

    function testClaimMintsOneFreeArchiveToken() public {
        vm.prank(collector);
        archive.claim(42);

        assertEq(archive.balanceOf(collector, 42), 1);
        assertEq(archive.totalSupply(42), 1);
        assertTrue(archive.hasClaimed(collector));
    }

    function testAddressCannotClaimTwice() public {
        vm.startPrank(collector);
        archive.claim(1);
        vm.expectRevert(TailsAndTrailsArchive.AlreadyClaimed.selector);
        archive.claim(2);
        vm.stopPrank();
    }

    function testRejectsTokenOutsideArchiveRange() public {
        vm.prank(collector);
        vm.expectRevert(TailsAndTrailsArchive.InvalidTokenId.selector);
        archive.claim(174);
    }

    function testSupplyCannotExceedOneHundred() public {
        vm.prank(owner);
        archive.ownerMint(owner, 7, 99);

        vm.prank(collector);
        archive.claim(7);

        vm.prank(secondCollector);
        vm.expectRevert(TailsAndTrailsArchive.SupplyExceeded.selector);
        archive.claim(7);
    }

    function testOnlyOwnerCanReserveMint() public {
        vm.prank(collector);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, collector));
        archive.ownerMint(collector, 1, 1);
    }

    function testOwnerCanPauseClaims() public {
        vm.prank(owner);
        archive.pause();

        vm.prank(collector);
        vm.expectRevert();
        archive.claim(1);
    }

    function testOwnerBatchMintRequiresSortedDistinctIds() public {
        uint256[] memory ids = new uint256[](2);
        ids[0] = 2;
        ids[1] = 1;
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1;
        amounts[1] = 1;

        vm.prank(owner);
        vm.expectRevert(TailsAndTrailsArchive.InvalidTokenId.selector);
        archive.ownerMintBatch(owner, ids, amounts);
    }

    function testOwnerCanMintFullArchiveReserveInFourBatches() public {
        uint256 start = 1;
        while (start <= 173) {
            uint256 end = start + 49;
            if (end > 173) end = 173;
            uint256 length = end - start + 1;
            uint256[] memory ids = new uint256[](length);
            uint256[] memory amounts = new uint256[](length);

            for (uint256 i; i < length; ++i) {
                ids[i] = start + i;
                amounts[i] = 1;
            }

            vm.prank(owner);
            archive.ownerMintBatch(owner, ids, amounts);
            start = end + 1;
        }

        for (uint256 tokenId = 1; tokenId <= 173; ++tokenId) {
            assertEq(archive.balanceOf(owner, tokenId), 1);
            assertEq(archive.totalSupply(tokenId), 1);
        }
    }

    function testOwnerCanUpdateMetadataBeforeFreeze() public {
        vm.prank(owner);
        archive.setMetadataURIs("ipfs://final/{id}.json", "ipfs://final/collection.json");

        assertEq(archive.uri(1), "ipfs://final/{id}.json");
        assertEq(archive.contractURI(), "ipfs://final/collection.json");
    }

    function testMetadataCannotChangeAfterFreeze() public {
        vm.prank(owner);
        archive.freezeMetadataURIs();

        vm.prank(owner);
        vm.expectRevert(TailsAndTrailsArchive.MetadataURIFrozen.selector);
        archive.setMetadataURIs("ipfs://other/{id}.json", "ipfs://other/collection.json");
    }
}
