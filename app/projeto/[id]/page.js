"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { db, storage } from "@/firebase";
import { useAuth } from "@/lib/useAuth";
import Navbar from "@/components/Navbar";
import Checklist from "@/components/Checklist";

export default function ProjetoPage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [projeto, setProjeto] = useState(null);
  const [anexos, setAnexos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Carrega os dados do projeto.
  useEffect(() => {
    if (!user || !id) return;
    getDoc(doc(db, "projetos", id)).then((snap) => {
      if (snap.exists()) setProjeto({ id: snap.id, ...snap.data() });
    });
  }, [user, id]);

  // Escuta os anexos em tempo real (subcoleção projetos/{id}/anexos).
  useEffect(() => {
    if (!user || !id) return;
    const q = query(
      collection(db, "projetos", id, "anexos"),
      orderBy("enviado_em", "desc")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setAnexos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [user, id]);

  async function handleUpload(e) {
    e.preventDefault();
    setErro("");
    const arquivo = e.target.elements.arquivo.files[0];
    if (!arquivo) return;

    setEnviando(true);
    try {
      // Caminho compatível com storage.rules: /projetos/{projetoId}/{arquivo}
      const caminho = `projetos/${id}/${Date.now()}_${arquivo.name}`;
      const storageRef = ref(storage, caminho);
      await uploadBytes(storageRef, arquivo);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, "projetos", id, "anexos"), {
        nome: arquivo.name,
        url,
        caminho,
        enviado_por: user.email,
        enviado_em: serverTimestamp(),
      });
      e.target.reset();
    } catch (err) {
      setErro("Não foi possível enviar o arquivo. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">
          ← Voltar para projetos
        </Link>

        {!projeto ? (
          <p className="mt-4 text-sm text-slate-500">Carregando...</p>
        ) : (
          <>
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-semibold text-navy-900">
                    {projeto.nome}
                  </h1>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {projeto.categoria} • {projeto.status}
                  </p>
                </div>
                {projeto.link_ferramenta && (
                  <Link
                    href={projeto.link_ferramenta}
                    target={projeto.link_ferramenta.startsWith("/") ? undefined : "_blank"}
                    className="rounded-md bg-gold-500 px-3 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400"
                  >
                    Abrir ferramenta →
                  </Link>
                )}
              </div>
              <p className="mt-3 text-sm text-slate-600">{projeto.descricao}</p>
              <p className="mt-3 text-xs text-slate-400">
                Início: {projeto.data_inicio || "—"} · Fim:{" "}
                {projeto.data_fim || "—"}
              </p>
            </div>

            <section className="mt-6">
              <h2 className="mb-3 text-sm font-semibold text-slate-800">
                Checklist
              </h2>
              <Checklist projetoId={id} />
            </section>

            <section className="mt-8">
              <h2 className="mb-3 text-sm font-semibold text-slate-800">
                Anexos
              </h2>

              <form onSubmit={handleUpload} className="mb-4 flex items-center gap-2">
                <input
                  type="file"
                  name="arquivo"
                  required
                  className="flex-1 text-sm"
                />
                <button
                  type="submit"
                  disabled={enviando}
                  className="rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                >
                  {enviando ? "Enviando..." : "Enviar"}
                </button>
              </form>
              {erro && <p className="mb-3 text-sm text-red-600">{erro}</p>}

              {anexos.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhum anexo enviado ainda.
                </p>
              ) : (
                <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
                  {anexos.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between px-4 py-3 text-sm"
                    >
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-700 hover:underline"
                      >
                        {a.nome}
                      </a>
                      <span className="text-xs text-slate-400">
                        {a.enviado_por}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
