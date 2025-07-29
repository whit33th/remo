"use client";

import { useAuthActions } from "@convex-dev/auth/react";

export function SignOutButton() {
  const { signOut } = useAuthActions();

  return (
    <button
      onClick={() => void signOut()}
      className="text-sm font-medium text-neutral-500 transition hover:text-neutral-300"
    >
      Sign Out
    </button>
  );
}
