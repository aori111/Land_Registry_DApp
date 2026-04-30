// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/LandRegistryMultiSig.sol";

contract DeployLandRegistryMultiSig is Script {
    function run() external {
        // Mengambil private key dari file .env
        uint256 deployerPrivateKey = vm.envUint("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80PRIVATE_KEY");

        // Memulai sesi broadcast transaksi
        vm.startBroadcast(deployerPrivateKey);

        // Deploy kontrak
        LandRegistryMultiSig registry = new LandRegistryMultiSig();

        // Mengakhiri sesi broadcast
        vm.stopBroadcast();

        // Log alamat kontrak untuk verifikasi
        console.log("LandRegistryMultiSig deployed at:", address(registry));
    }
}