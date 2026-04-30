// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/LandRegistryMultiSig.sol";

contract LandRegistryMultiSigTest is Test {
    LandRegistryMultiSig registry;

    // Mendefinisikan beberapa address untuk testing
    address admin = address(1);
    address auth1 = address(2);
    address auth2 = address(3);
    address auth3 = address(4);
    address nonAuth = address(5);

    function setUp() public {
        // Admin deploy kontrak
        vm.startPrank(admin);
        registry = new LandRegistryMultiSig();
        
        // Admin menambahkan otoritas lain
        registry.addAuthority(auth1);
        registry.addAuthority(auth2);
        registry.addAuthority(auth3);
        vm.stopPrank();
    }

    function testInitialState() public {
        assertEq(registry.adminPusat(), admin);
        assertTrue(registry.isAuthority(admin));
        assertTrue(registry.isAuthority(auth1));
        assertFalse(registry.isAuthority(nonAuth));
        assertEq(registry.requiredConfirmations(), 3);
    }

    function testAddAuthorityRevertsIfNonAdmin() public {
        vm.prank(auth1);
        vm.expectRevert("Hanya Admin Pusat yang diizinkan");
        registry.addAuthority(nonAuth);
    }

    function testSubmitRegistration() public {
        vm.startPrank(auth1);
        registry.submitRegistration("NIB123", "Budi", "Jakarta", 500, "CID_123");
        
        assertEq(registry.getRequestsCount(), 1);
        assertTrue(registry.isPendingRegistration("NIB123"));
        assertTrue(registry.isCidUsed("CID_123"));
        
        // Cek bahwa submitter otomatis memberikan tanda tangan
        assertTrue(registry.isConfirmed(0, auth1));
        vm.stopPrank();
    }

    function testSubmitRevertsIfNonAuthority() public {
        vm.prank(nonAuth);
        vm.expectRevert("Bukan otoritas BPN yang sah");
        registry.submitRegistration("NIB123", "Budi", "Jakarta", 500, "CID_123");
    }

    function testPreventDuplicateRegistration() public {
        vm.prank(auth1);
        registry.submitRegistration("NIB123", "Budi", "Jakarta", 500, "CID_123");

        // Coba submit NIB yang sama (meski CID beda)
        vm.prank(auth2);
        vm.expectRevert("NIB sedang dalam proses antrean");
        registry.submitRegistration("NIB123", "Andi", "Bandung", 300, "CID_456");

        // Coba submit CID yang sama (meski NIB beda)
        vm.prank(auth3);
        vm.expectRevert("Dokumen (CID) sudah terdaftar");
        registry.submitRegistration("NIB456", "Cici", "Surabaya", 200, "CID_123");
    }

    function testMultiSigExecution() public {
        // 1. Inisiator submit (Konfirmasi 1)
        vm.prank(auth1);
        registry.submitRegistration("NIB_FINAL", "Siti", "Bali", 1000, "CID_FINAL");

        // Cek belum dieksekusi
        (,,,,,, bool executed1, uint256 count1) = registry.requests(0);
        assertFalse(executed1);
        assertEq(count1, 1);

        // 2. Auth2 konfirmasi (Konfirmasi 2)
        vm.prank(auth2);
        registry.confirmRequest(0);
        
        (,,,,,, bool executed2, uint256 count2) = registry.requests(0);
        assertFalse(executed2);
        assertEq(count2, 2);

        // 3. Auth3 konfirmasi (Konfirmasi 3) -> Trigger Eksekusi
        vm.prank(auth3);
        registry.confirmRequest(0);

        (,,,,,, bool executed3, uint256 count3) = registry.requests(0);
        assertTrue(executed3);
        assertEq(count3, 3);

        // Validasi state sertifikat setelah eksekusi
        (string memory nib, string memory owner, string memory loc, uint256 area, string memory hash, bool isReg) = registry.certificates("NIB_FINAL");
        assertTrue(isReg);
        assertEq(nib, "NIB_FINAL");
        assertEq(owner, "Siti");
        assertEq(loc, "Bali");
        assertEq(area, 1000);
        assertEq(hash, "CID_FINAL");

        // Validasi NIB sudah tidak pending
        assertFalse(registry.isPendingRegistration("NIB_FINAL"));
    }

    function testConfirmRevertsIfAlreadyConfirmed() public {
        vm.prank(auth1);
        registry.submitRegistration("NIB123", "Budi", "Jakarta", 500, "CID_123");

        vm.prank(auth1);
        vm.expectRevert("Anda sudah memberikan tanda tangan");
        registry.confirmRequest(0);
    }
}