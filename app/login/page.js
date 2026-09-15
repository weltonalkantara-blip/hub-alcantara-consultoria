"use client";

import { useState } from "react";
import Image from "next/image";
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
        // "admin" ou "consultor" pelo menu Usuários (ou no Firestore) quando
        // necessário.
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 px-4">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-navy-900/60 p-6 shadow-xl backdrop-blur">
        <div className="mb-5 flex justify-center">
          <Image
            src="/logo-alcantara.png"
            alt="Alcântara Consultoria Farma 360"
            width={220}
            height={67}
            priority
            className="h-14 w-auto"
          />
        </div>
        <p className="mb-6 text-center text-sm text-white/60">
          {modo === "login" ? "Entre com sua conta" : "Crie sua conta"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {modo === "cadastro" && (
            <input
              type="text"
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-gold-500"
            />
          )}
          <input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-gold-500"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-gold-500"
          />

          {erro && <p className="text-sm text-red-400">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-md bg-gold-500 px-3 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
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
          className="mt-4 w-full text-center text-sm text-white/50 hover:text-white/80"
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
