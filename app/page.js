"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

// Página inicial: só decide para onde mandar o usuário.
// Logado -> /dashboard. Não logado -> /login.
export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-[var(--bg-page)]">
      <p className="text-sm text-slate-400">Carregando...</p>
    </div>
  );
}
