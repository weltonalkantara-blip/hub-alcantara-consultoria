"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/lib/useAuth";
import { criarUsuario } from "@/lib/adminAuth";
import Navbar from "@/components/Navbar";

const TIPOS = ["admin", "consultor", "cliente"];

export default function UsuariosPage() {
  const { user, isAdmin, loading, perfilLoading } = useAuth();
  const router = useRouter();

  const [usuarios, setUsuarios] = useState([]);
  const [carregandoLista, setCarregandoLista] = useState(true);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState("cliente");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    const q = query(collection(db, "usuarios"), orderBy("criado_em", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setUsuarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCarregandoLista(false);
      },
      () => setCarregandoLista(false)
    );
    return () => unsubscribe();
  }, [user, isAdmin]);

  async function handleCriarUsuario(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setEnviando(true);
    try {
      await criarUsuario({ nome, email, senha, tipo });
      setSucesso(`Usuário ${email} criado com sucesso.`);
      setNome("");
      setEmail("");
      setSenha("");
      setTipo("cliente");
    } catch (err) {
      setErro(traduzErro(err.code));
    } finally {
      setEnviando(false);
    }
  }

  async function handleMudarTipo(usuarioId, novoTipo) {
    await updateDoc(doc(db, "usuarios", usuarioId), { tipo: novoTipo });
  }

  if (loading || !user) return null;

  if (perfilLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <p className="text-sm text-slate-500">Carregando...</p>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h1 className="text-lg font-semibold text-navy-900">
              Acesso restrito
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Esta página é exclusiva para administradores do Hub.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-xl font-semibold text-navy-900">
          Cadastro de usuários
        </h1>

        <form
          onSubmit={handleCriarUsuario}
          className="mb-8 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
        >
          <input
            required
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            required
            minLength={6}
            placeholder="Senha temporária (mín. 6 caracteres)"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {erro && <p className="text-sm text-red-600 sm:col-span-2">{erro}</p>}
          {sucesso && (
            <p className="text-sm text-emerald-600 sm:col-span-2">{sucesso}</p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="rounded-md bg-navy-900 px-3 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60 sm:col-span-2"
          >
            {enviando ? "Criando..." : "Criar usuário"}
          </button>
          <p className="text-xs text-slate-400 sm:col-span-2">
            Compartilhe o e-mail e a senha temporária com a pessoa por um canal
            seguro. Ela pode continuar usando essa senha ou trocar depois.
          </p>
        </form>

        <h2 className="mb-3 text-sm font-semibold text-slate-800">
          Usuários cadastrados
        </h2>
        {carregandoLista ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : usuarios.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum usuário encontrado.</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {usuarios.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-800">{u.nome}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </div>
                <select
                  value={u.tipo}
                  onChange={(e) => handleMudarTipo(u.id, e.target.value)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                >
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function traduzErro(code) {
  const mapa = {
    "auth/invalid-email": "E-mail inválido.",
    "auth/email-already-in-use": "Este e-mail já está cadastrado.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
  };
  return mapa[code] || "Ocorreu um erro. Tente novamente.";
}
