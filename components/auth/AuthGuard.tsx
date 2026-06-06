"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "./AuthProvider";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { initialized, isAuthenticated } = useAuth();

  useEffect(() => {
    if (initialized && !isAuthenticated) {
      router.replace("/login");
    }
  }, [initialized, isAuthenticated, router]);

  if (!initialized) {
    return <div className="grid min-h-screen place-items-center text-sm text-[#445072]">Loading your workspace...</div>;
  }

  if (!isAuthenticated) {
    return <div className="grid min-h-screen place-items-center text-sm text-[#445072]">Redirecting to sign in...</div>;
  }

  return <>{children}</>;
}
