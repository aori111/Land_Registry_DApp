// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/LandRegistryMultiSig.sol"; // Sesuaikan dengan path file Anda

contract LandRegistryMultiSigTest is Test {
    LandRegistryMultiSig registry;

    // Mendefinisikan akun untuk pengujian
    address auth1 = address(0x1);
    address auth2 = address(0x2);
    address auth3 = address(0x3);
    address nonAuth = address(0x4);

    address[] authorities;

    function setUp() public {
        // Menyiapkan array otoritas
        authorities.push(auth1);
        authorities.push(auth2);
        authorities.push(auth3);

        // Deploy kontrak dengan 3 otoritas dan butuh 2 konfirmasi
        registry = new LandRegistryMultiSig(authorities, 2);
    }

    // ==========================================
    // TEST INISIALISASI (CONSTRUCTOR)
    // ==========================================

    function test_InitialState() public {
        assertEq(registry.requiredConfirmations(), 2);
        assertTrue(registry.isAuthority(auth1));
        assertTrue(registry.isAuthority(auth2));
        assertTrue(registry.isAuthority(auth3));
        assertFalse(registry.isAuthority(nonAuth));
        
        address[] memory storedAuthorities = registry.getAuthorities();
        assertEq(storedAuthorities.length, 3);
        assertEq(storedAuthorities[0], auth1);
    }

    function testRevert_ConstructorInvalidConfig() public {
        address[] memory emptyAuth;
        // Ekspektasi gagal jika array kosong
        vm.expectRevert("Harus ada minimal 1 pihak berwenang");
        new LandRegistryMultiSig(emptyAuth, 1);

        address[] memory singleAuth = new address[](1);
        singleAuth[0] = auth1;
        // Ekspektasi gagal jika konfirmasi melebihi jumlah otoritas
        vm.expectRevert("Jumlah konfirmasi tidak valid");
        new LandRegistryMultiSig(singleAuth, 2);
    }

    // ==========================================
    // TEST ALUR REGISTRASI & MULTI-SIG
    // ==========================================

    function test_SubmitRegistration() public {
        vm.prank(auth1);
        registry.submitRegistration("NIB123", "Budi", "Jakarta", 500, "CID_123");

        // Memastikan request tersimpan dengan benar
        (
            LandRegistryMultiSig.ActionType action,
            string memory nib,
            string memory newOwnerName,
            string memory location,
            uint256 areaSqm,
            string memory documentHash,
            bool executed,
            uint confirmationsCount
        ) = registry.requests(0);

        assertEq(uint(action), uint(LandRegistryMultiSig.ActionType.Register));
        assertEq(nib, "NIB123");
        assertEq(newOwnerName, "Budi");
        assertEq(location, "Jakarta");
        assertEq(areaSqm, 500);
        assertEq(documentHash, "CID_123");
        assertFalse(executed);
        assertEq(confirmationsCount, 0); // Di kontrak ini, submit TIDAK otomatis confirm

        // Memastikan CID terkunci
        assertTrue(registry.isCidUsed("CID_123"));
    }

    function testRevert_SubmitRegistration_NotAuthority() public {
        vm.prank(nonAuth);
        vm.expectRevert("Bukan pihak berwenang (Not an authority)");
        registry.submitRegistration("NIB123", "Budi", "Jakarta", 500, "CID_123");
    }

    function test_ConfirmAndExecuteRegistration() public {
        // 1. Submit Request
        vm.prank(auth1);
        registry.submitRegistration("NIB123", "Budi", "Jakarta", 500, "CID_123");

        // 2. Otoritas 1 Konfirmasi (1/2)
        vm.prank(auth1);
        registry.confirmRequest(0);
        
        assertEq(registry.getRequestConfirmationsCount(0), 1);
        assertTrue(registry.isConfirmed(0, auth1));
        
        // Cek bahwa belum dieksekusi
        (,,,,,, bool executedBefore,) = registry.requests(0);
        assertFalse(executedBefore);

        // 3. Otoritas 2 Konfirmasi (2/2) -> Memicu Eksekusi Otomatis
        vm.prank(auth2);
        registry.confirmRequest(0);

        // Cek bahwa status request menjadi executed
        (,,,,,, bool executedAfter, uint count) = registry.requests(0);
        assertTrue(executedAfter);
        assertEq(count, 2);

        // 4. Validasi Sertifikat Berhasil Terdaftar
        (
            string memory nib,
            string memory ownerName,
            string memory location,
            uint256 areaSqm,
            string memory documentHash,
            bool isRegistered
        ) = registry.certificates("NIB123");

        assertTrue(isRegistered);
        assertEq(nib, "NIB123");
        assertEq(ownerName, "Budi");
        assertEq(location, "Jakarta");
        assertEq(areaSqm, 500);
        assertEq(documentHash, "CID_123");
    }

    function testRevert_ConfirmAlreadyConfirmed() public {
        vm.prank(auth1);
        registry.submitRegistration("NIB123", "Budi", "Jakarta", 500, "CID_123");

        vm.startPrank(auth1);
        registry.confirmRequest(0);
        
        vm.expectRevert("Anda sudah menyetujui permintaan ini");
        registry.confirmRequest(0);
        vm.stopPrank();
    }

    // ==========================================
    // TEST PENCEGAHAN DUPLIKASI
    // ==========================================

    function testRevert_DuplicateCID() public {
        vm.prank(auth1);
        registry.submitRegistration("NIB123", "Budi", "Jakarta", 500, "CID_123");

        // Coba mendaftarkan NIB berbeda tapi CID sama (CID sudah terkunci saat submit)
        vm.prank(auth2);
        vm.expectRevert("Dokumen (CID) sudah terdaftar");
        registry.submitRegistration("NIB999", "Agus", "Bandung", 200, "CID_123");
    }

    // ==========================================
    // TEST ALUR TRANSFER (BALIK NAMA)
    // ==========================================

    function test_TransferFlow() public {
        // Setup: Daftarkan sertifikat terlebih dahulu
        vm.prank(auth1);
        registry.submitRegistration("NIB_TF", "Andi", "Bali", 1000, "CID_TF");
        vm.prank(auth1);
        registry.confirmRequest(0);
        vm.prank(auth2);
        registry.confirmRequest(0);

        // Pastikan terdaftar atas nama Andi
        (, string memory initialOwner, , , , bool registered) = registry.certificates("NIB_TF");
        assertTrue(registered);
        assertEq(initialOwner, "Andi");

        // 1. Submit Transfer
        vm.prank(auth1);
        registry.submitTransfer("NIB_TF", "Siti");

        // 2. Konfirmasi Transfer (Request index 1)
        vm.prank(auth2);
        registry.confirmRequest(1); // 1/2
        
        vm.prank(auth3);
        registry.confirmRequest(1); // 2/2 -> Auto Execute

        // 3. Validasi Kepemilikan Berubah
        (, string memory newOwner, , , , ) = registry.certificates("NIB_TF");
        assertEq(newOwner, "Siti");
    }

    function testRevert_TransferUnregistered() public {
        vm.prank(auth1);
        vm.expectRevert("Sertifikat tidak ditemukan");
        registry.submitTransfer("NIB_GHOIB", "Joko");
    }
}