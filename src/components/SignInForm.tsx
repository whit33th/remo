"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      await signIn("password", {
        email,
        password,
        flow: isSignUp ? "signUp" : "signIn",
      });

      toast.success(
        isSignUp ? "Account created successfully!" : "Signed in successfully!",
      );
    } catch (error) {
      console.error(isSignUp ? "Sign up failed:" : "Sign in failed:", error);
      toast.error(isSignUp ? "Error creating account" : "Sign in error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-container border border-neutral-950 bg-black p-6 shadow-sm">
      <div className="mb-6">
        <div className="flex gap-2 rounded-lg bg-neutral-950 p-1">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              !isSignUp
                ? "bg-neutral-300 text-black shadow-sm"
                : "bg-neutral-950 text-neutral-900"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              isSignUp
                ? "bg-neutral-300 text-black shadow-sm"
                : "bg-neutral-950 text-neutral-400"
            }`}
          >
            Sign Up
          </button>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-neutral-200"
          >
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            className="w-full rounded-xl border border-neutral-900 bg-black p-3 text-neutral-50 placeholder-neutral-500"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-neutral-200"
          >
            Password
          </label>
          <input
            type="password"
            name="password"
            id="password"
            required
            className="w-full rounded-xl border border-neutral-900 bg-black p-3 text-neutral-50 placeholder-neutral-500"
            placeholder="Enter your password"
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-neutral-300 p-3 text-black transition hover:bg-neutral-400"
        >
          {isLoading
            ? isSignUp
              ? "Creating account..."
              : "Signing in..."
            : isSignUp
              ? "Create Account"
              : "Sign In"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-neutral-400">
        {isSignUp ? (
          <p>
            Already have an account?
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className="font-medium text-neutral-50 hover:text-white"
            >
              Sign In
            </button>
          </p>
        ) : (
          <p>
            Don&apos;t have an account?
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className="font-medium text-neutral-50 hover:text-white"
            >
              Sign Up
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
