// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/LandRegistryMultiSig.sol"; 

contract LandRegistryMultiSigTest is Test {
    LandRegistryMultiSig public registry;

    address public auth1 = address(0x111);
    address public auth2 = address(0x222);
    address public auth3 = address(0x333);
    address public nonAuth = address(0x999);

    function setUp() public {
        address[] memory authorities = new address[](3);
        authorities[0] = auth1;
        authorities[1] = auth2;
        authorities[2] = auth3;

        // UPDATE: Diubah menjadi 3 konfirmasi (3-of-3)
        registry = new LandRegistryMultiSig(authorities, 3);
    }

    // ==========================================
    // TEST 1: PENGATURAN AWAL (DEPLOYMENT)
    // ==========================================
    function test_DeploymentSetup() public view {
        assertEq(registry.requiredConfirmations(), 3);
        assertEq(registry.isAuthority(auth1), true);
        assertEq(registry.isAuthority(auth2), true);
        assertEq(registry.isAuthority(auth3), true);
        assertEq(registry.isAuthority(nonAuth), false);
    }

    // ==========================================
    // TEST 2: REGISTRASI (SUBMIT & AUTO-CONFIRM)
    // ==========================================
    function test_SubmitRegistration() public {
        vm.prank(auth1);
        registry.submitRegistration("NIB-001", "Budi", "Pontianak", 150, "CID-123");

        assertEq(registry.getRequestConfirmationsCount(0), 1);
        assertEq(registry.isConfirmed(0, auth1), true);

        assertEq(registry.isPendingRegistration("NIB-001"), true);
        assertEq(registry.isCidUsed("CID-123"), true);
    }

    // ==========================================
    // TEST 3: VALIDASI PENOLAKAN DUPLIKASI
    // ==========================================
    function test_RevertIf_DuplicateNIBOrCID() public {
        vm.prank(auth1);
        registry.submitRegistration("NIB-001", "Budi", "Pontianak", 150, "CID-123");

        vm.prank(auth2);
        vm.expectRevert("NIB sedang dalam proses antrean");
        registry.submitRegistration("NIB-001", "Andi", "Jakarta", 200, "CID-456");

        vm.prank(auth2);
        vm.expectRevert("Dokumen (CID) sudah terdaftar");
        registry.submitRegistration("NIB-002", "Andi", "Jakarta", 200, "CID-123");
    }

    // ==========================================
    // TEST 4: EKSEKUSI MULTI-SIG (BUTUH 3 SIGN)
    // ==========================================
    function test_ExecuteRegistration() public {
        // Sign 1 (1/3)
        vm.prank(auth1);
        registry.submitRegistration("NIB-001", "Budi", "Pontianak", 150, "CID-123");

        // Sign 2 (2/3) - Belum dieksekusi
        vm.prank(auth2);
        registry.confirmRequest(0);
        
        // Cek bahwa status masih false (belum terdaftar karena baru 2/3)
        (,,,,, bool isRegisteredBefore) = registry.certificates("NIB-001");
        assertEq(isRegisteredBefore, false);

        // Sign 3 (3/3) - Akan otomatis tereksekusi
        vm.prank(auth3);
        registry.confirmRequest(0);

        // Cek bahwa sekarang sudah sukses masuk ke mapping certificates
        (
            string memory nib,
            string memory ownerName,
            ,
            ,
            ,
            bool isRegisteredAfter
        ) = registry.certificates("NIB-001");

        assertEq(isRegisteredAfter, true);
        assertEq(ownerName, "Budi");
        assertEq(nib, "NIB-001");
    }

    // ==========================================
    // TEST 5: KEAMANAN AKSES (HAK AKSES)
    // ==========================================
    function test_RevertIf_NonAuthorityTriesToSubmit() public {
        vm.prank(nonAuth);
        vm.expectRevert("Bukan pihak berwenang (Not an authority)");
        registry.submitRegistration("NIB-001", "Hacker", "Unknown", 100, "CID-Hack");
    }

    // ==========================================
    // TEST 6: BALIK NAMA (TRANSFER) - FULL FLOW
    // ==========================================
    function test_SubmitAndExecuteTransfer() public {
        // --- FASE 1: REGISTRASI AWAL ---
        vm.prank(auth1); registry.submitRegistration("NIB-001", "Budi", "Pontianak", 150, "CID-123");
        vm.prank(auth2); registry.confirmRequest(0);
        vm.prank(auth3); registry.confirmRequest(0); // Status NIB-001 sekarang terdaftar, isPending = false

        // --- FASE 2: TRANSFER ---
        // Auth2 mengajukan balik nama ke "Siti" (Sign 1/3)
        vm.prank(auth2);
        registry.submitTransfer("NIB-001", "Siti"); 

        // Auth1 menyetujui transfer (Sign 2/3)
        vm.prank(auth1);
        registry.confirmRequest(1);

        // Cek nama pemilik sebelum sign terakhir (masih "Budi")
        (, string memory ownerBefore, , , , ) = registry.certificates("NIB-001");
        assertEq(ownerBefore, "Budi");

        // Auth3 memberikan konfirmasi terakhir (Sign 3/3) -> Auto Execute
        vm.prank(auth3);
        registry.confirmRequest(1);

        // VALIDASI: Nama pemilik harus berubah menjadi "Siti"
        (, string memory ownerAfter, , , , ) = registry.certificates("NIB-001");
        assertEq(ownerAfter, "Siti");
    }
}