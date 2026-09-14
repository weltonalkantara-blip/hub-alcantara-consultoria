"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState("login"); // "login" | "cadastro"
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      if (modo === "login") {
        await signInWithEmailAndPassword(auth, email, senha);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, senha);
        // Cria o documento correspondente na coleção `usuarios`.
        // Todo novo cadastro entra como "cliente" por padrão; promova para
        // "admin" ou "consultor" manualmente no Firestore quando necessário.
        await setDoc(doc(db, "usuarios", cred.user.uid), {
          nome: nome || email,
          email,
          tipo: "cliente",
          criado_em: serverTimestamp(),
        });
      }
      router.push("/dashboard");
    } catch (err) {
      setErro(traduzErro(err.code));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold text-slate-800">
          Hub Alcântara Consultoria Farma 360
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          {modo === "login" ? "Entre com sua conta" : "Crie sua conta"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {modo === "cadastro" && (
            <input
              type="text"
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          )}
          <input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {carregando
              ? "Aguarde..."
              : modo === "login"
              ? "Entrar"
              : "Criar conta"}
          </button>
        </form>

        <button
          onClick={() => setModo(modo === "login" ? "cadastro" : "login")}
          className="mt-4 w-full text-center text-sm text-slate-500 hover:text-slate-700"
        >
          {modo === "login"
            ? "Não tem conta? Cadastre-se"
            : "Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}

function traduzErro(code) {
  const mapa = {
    "auth/invalid-email": "E-mail inválido.",
    "auth/user-not-found": "Usuário não encontrado.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/email-already-in-use": "Este e-mail já está cadastrado.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
  };
  return mapa[code] || "Ocorreu um erro. Tente novamente.";
}
