"use client";

import { Authenticated } from "convex/react";
import { SignOutButton } from "../ui/SignOutButton";

interface User {
  email?: string | null;
}

interface HeaderProps {
  user: User;
}
const Logo = (
  <svg
    width="52"
    height="52"
    viewBox="-2 3 52 52"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* R */}
    <rect x="8" y="12" width="2" height="24" fill="white" />
    <rect x="10" y="12" width="6" height="2" fill="white" />
    <rect x="16" y="14" width="2" height="4" fill="white" />
    <rect x="10" y="18" width="6" height="2" fill="white" />
    <rect x="14" y="20" width="2" height="4" fill="white" />
    <rect x="16" y="24" width="2" height="12" fill="white" />

    {/* E */}
    <rect x="20" y="12" width="2" height="24" fill="white" />
    <rect x="22" y="12" width="6" height="2" fill="white" />
    <rect x="22" y="22" width="4" height="2" fill="white" />
    <rect x="22" y="34" width="6" height="2" fill="white" />

    {/* M */}
    <rect x="30" y="12" width="2" height="24" fill="white" />
    <rect x="32" y="14" width="2" height="2" fill="white" />
    <rect x="34" y="16" width="2" height="2" fill="white" />
    <rect x="36" y="14" width="2" height="2" fill="white" />
    <rect x="38" y="12" width="2" height="24" fill="white" />

    {/* O */}
    <rect x="8" y="40" width="8" height="2" fill="white" />
    <rect x="6" y="42" width="2" height="4" fill="white" />
    <rect x="16" y="42" width="2" height="4" fill="white" />
    <rect x="8" y="46" width="8" height="2" fill="white" />
  </svg>
);

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-900 bg-black px-4 py-3 text-neutral-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex animate-pulse items-center space-x-2">
            {Logo}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-neutral-500">{user?.email}</div>
          <Authenticated>
            <SignOutButton />
          </Authenticated>
        </div>
      </div>
    </header>
  );
}
