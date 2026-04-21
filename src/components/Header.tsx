"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Header() {
  return (
    <header className="flex justify-between items-center mb-8">
      <h2 className="text-2xl font-bold text-slate-900">Admin Dashboard</h2>
      <ConnectButton />
    </header>
  );
}
