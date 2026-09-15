"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, query, where, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/lib/useAuth";
import Navbar from "@/components/Navbar";

const ROTA = "/dre-alpha-pwa";

export default function DreAlphaPwaPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  const [projeto, setProjeto] = useState(null);
  const [carregandoProjeto, setCarregandoProjeto] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Reaproveita o campo `link_ferramenta` do projeto (cadastrado no dashboard)
  // para saber se o acesso a esta ferramenta é restrito e, se for, para quem.
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "projetos"),
      where("link_ferramenta", "==", ROTA),
      limit(1)
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setProjeto(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
        setCarregandoProjeto(false);
      },
      () => setCarregandoProjeto(false)
    );
    return () => unsubscribe();
  }, [user]);

  if (loading || !user || carregandoProjeto) return null;

  const restrito = projeto?.acesso === "restrito";
  const permitido =
    !restrito ||
    isAdmin ||
    (projeto?.usuarios_permitidos || []).includes((user.email || "").toLowerCase());

  if (!permitido) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)]">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-5">
            <h1 className="text-lg font-semibold text-navy-900">
              Acesso restrito
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Você não tem acesso a esta ferramenta. Fale com um administrador
              do Hub se acredita que isso é um engano.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block text-sm text-navy-800 hover:underline"
            >
              ← Voltar para projetos
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-surface)] px-4 py-2">
        <Link
          href="/dashboard"
          className="text-sm text-slate-500 hover:text-navy-800"
        >
          ← Voltar para o Hub
        </Link>
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          DRE Alpha
        </span>
      </div>
      <iframe
        src="/dre-alpha-pwa/index.html"
        title="DRE Alpha"
        className="w-full flex-1 border-0"
      />
    </div>
  );
}
