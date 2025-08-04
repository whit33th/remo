"use client";

import { useAuthActions } from "@convex-dev/auth/react";

export function SignOutButton() {
  const { signOut } = useAuthActions();

  return (
    <button
      onClick={() => void signOut()}
      className="rounded-lg bg-neutral-200 px-3 py-1.5 text-sm font-medium text-black transition hover:text-neutral-700"
    >
      Sign Out
    </button>
  );
}
