"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/lib/useAuth";
import Navbar from "@/components/Navbar";

const STATUS = ["pendente", "em andamento", "concluído"];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [projetos, setProjetos] = useState([]);
  const [carregandoProjetos, setCarregandoProjetos] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [restrito, setRestrito] = useState(false);

  // Protege a rota: se não estiver logado, manda para /login.
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Escuta a coleção `projetos` em tempo real.
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "projetos"), orderBy("data_inicio", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setProjetos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCarregandoProjetos(false);
      },
      () => setCarregandoProjetos(false)
    );
    return () => unsubscribe();
  }, [user]);

  async function handleNovoProjeto(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const emailsBrutos = form.get("usuarios_permitidos") || "";
    const usuariosPermitidos = emailsBrutos
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    await addDoc(collection(db, "projetos"), {
      nome: form.get("nome"),
      categoria: form.get("categoria"),
      status: form.get("status"),
      descricao: form.get("descricao"),
      data_inicio: form.get("data_inicio"),
      data_fim: form.get("data_fim") || null,
      acesso: restrito ? "restrito" : "todos",
      usuarios_permitidos: restrito ? usuariosPermitidos : [],
      link_ferramenta: form.get("link_ferramenta")?.trim() || null,
      criado_em: serverTimestamp(),
      criado_por: user.email,
    });
    e.target.reset();
    setRestrito(false);
    setMostrarForm(false);
  }

  const projetosFiltrados =
    filtroStatus === "todos"
      ? projetos
      : projetos.filter((p) => p.status === filtroStatus);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-navy-900">Projetos</h1>
          <div className="flex items-center gap-2">
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="todos">Todos os status</option>
              {STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={() => setMostrarForm(!mostrarForm)}
              className="rounded-md bg-navy-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-navy-800"
            >
              {mostrarForm ? "Cancelar" : "Novo projeto"}
            </button>
          </div>
        </div>

        {mostrarForm && (
          <form
            onSubmit={handleNovoProjeto}
            className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
          >
            <input
              name="nome"
              required
              placeholder="Nome do projeto"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              name="categoria"
              required
              placeholder="Categoria"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              name="status"
              defaultValue="pendente"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <input
                type="date"
                name="data_inicio"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="date"
                name="data_fim"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <textarea
              name="descricao"
              placeholder="Descrição"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
              rows={3}
            />

            <input
              name="link_ferramenta"
              placeholder="Link da ferramenta (opcional) — ex.: /dre-alpha-pwa"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
            />

            <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
              <input
                type="checkbox"
                checked={restrito}
                onChange={(e) => setRestrito(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Restringir acesso a e-mails específicos
            </label>

            {restrito && (
              <textarea
                name="usuarios_permitidos"
                placeholder="E-mails permitidos, separados por vírgula"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
                rows={2}
              />
            )}

            <button
              type="submit"
              className="rounded-md bg-navy-900 px-3 py-2 text-sm font-medium text-white hover:bg-navy-800 sm:col-span-2"
            >
              Salvar projeto
            </button>
          </form>
        )}

        {carregandoProjetos ? (
          <p className="text-sm text-slate-500">Carregando projetos...</p>
        ) : projetosFiltrados.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum projeto encontrado.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {projetosFiltrados.map((p) => (
              <Link
                key={p.id}
                href={`/projeto/${p.id}`}
                className="rounded-xl border border-slate-200 bg-white p-4 hover:border-navy-700"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="font-medium text-slate-800">{p.nome}</h2>
                  <div className="flex items-center gap-1.5">
                    {p.acesso === "restrito" && (
                      <span
                        title="Acesso restrito"
                        className="rounded-full bg-navy-900/10 px-2 py-0.5 text-xs font-medium text-navy-800"
                      >
                        🔒 Restrito
                      </span>
                    )}
                    <StatusBadge status={p.status} />
                  </div>
                </div>
                <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">
                  {p.categoria}
                </p>
                <p className="line-clamp-2 text-sm text-slate-600">
                  {p.descricao}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }) {
  const cores = {
    pendente: "bg-amber-100 text-amber-700",
    "em andamento": "bg-blue-100 text-blue-700",
    "concluído": "bg-emerald-100 text-emerald-700",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        cores[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}
