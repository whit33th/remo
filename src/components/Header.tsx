"use client";

import { SignOutButton } from "./SignOutButton";

interface User {
  email?: string | null;
}

interface HeaderProps {
  user: User;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-900 bg-black px-4 py-3 text-neutral-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl">Tretch</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-neutral-500">{user?.email}</div>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
