// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/LandRegistryMultiSigOZ.sol";

contract DeployLandRegistryMultiSig is Script {
    function run() external {
        // ==========================================
        // 1. SETUP PARAMETER CONSTRUCTOR
        // ==========================================
        
        // Buat array untuk menampung alamat pihak berwenang (otoritas)
        // PENTING: Ganti alamat-alamat ini dengan alamat dompet (wallet) asli saat deploy ke Testnet/Mainnet.
        // Di bawah ini saya menggunakan 3 alamat default pertama dari lokal Anvil.
        address[] memory initialAuthorities = new address[](3);
        initialAuthorities[0] = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8; // Otoritas 1 (Biasanya Deployer)
        initialAuthorities[1] = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC; // Otoritas 2
        initialAuthorities[2] = 0x90F79bf6EB2c4f870365E785982E1f101E93b906; // Otoritas 3

        // Tentukan jumlah minimal konfirmasi yang dibutuhkan (misal: 2 dari 3 otoritas)
        uint256 requiredConfirmations = 3;

        // ==========================================
        // 2. PROSES DEPLOYMENT
        // ==========================================

        // Memulai sesi broadcast. 
        // Karena sebelumnya Anda memiliki masalah dengan .env, kita menggunakan startBroadcast() kosong
        // agar Foundry otomatis mengambil private-key dari argumen terminal.
        vm.startBroadcast();

        // Deploy kontrak dan masukkan parameter constructor yang sudah disiapkan
        LandRegistryMultiSig registry = new LandRegistryMultiSig(
            initialAuthorities,
            requiredConfirmations
        );

        // Mengakhiri sesi broadcast
        vm.stopBroadcast();

        // ==========================================
        // 3. LOGGING HASIL
        // ==========================================
        console.log("=== DEPLOYMENT SUCCESS ===");
        console.log("LandRegistryMultiSig Address :", address(registry));
        console.log("Total Authorities Setup      :", initialAuthorities.length);
        console.log("Required Confirmations       :", requiredConfirmations);
    }
}