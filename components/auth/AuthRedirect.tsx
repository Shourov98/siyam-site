"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "./AuthProvider";

export default function AuthRedirect({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { initialized, isAuthenticated } = useAuth();

  useEffect(() => {
    if (initialized && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [initialized, isAuthenticated, router]);

  if (!initialized) {
    return <div className="grid min-h-[14rem] place-items-center text-sm text-[#8b95a7]">Loading...</div>;
  }

  if (isAuthenticated) {
    return <div className="grid min-h-[14rem] place-items-center text-sm text-[#8b95a7]">Redirecting to dashboard...</div>;
  }

  return <>{children}</>;
}
