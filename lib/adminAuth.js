"use client";

// Criação de usuários pelo admin, sem derrubar a sessão de quem está logado.
//
// O SDK do Firebase Auth troca automaticamente o usuário "atual" para o
// recém-criado sempre que chamamos createUserWithEmailAndPassword. Para criar
// um usuário para outra pessoa (ex.: no Cadastro de usuários) sem deslogar o
// admin, inicializamos um segundo app do Firebase (mesma configuração),
// criamos a conta nele, e depois descartamos esse app secundário — a sessão
// principal do admin nunca é afetada.
import { initializeApp, deleteApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";

const firebaseConfig = {
  apiKey: "AIzaSyCDsxRwY2N0yXIVYu0AHGnd1-N83k5rma8",
  authDomain: "consultoria-farm.firebaseapp.com",
  projectId: "consultoria-farm",
  storageBucket: "consultoria-farm.firebasestorage.app",
  messagingSenderId: "341860005640",
  appId: "1:341860005640:web:7f826d5b5ec75330e7debd",
  measurementId: "G-86GSL7JVBQ",
};

export async function criarUsuario({ nome, email, senha, tipo }) {
  const appSecundario = initializeApp(firebaseConfig, `admin-${Date.now()}`);
  const authSecundario = getAuth(appSecundario);
  try {
    const cred = await createUserWithEmailAndPassword(authSecundario, email, senha);
    await setDoc(doc(db, "usuarios", cred.user.uid), {
      nome: nome || email,
      email,
      tipo: tipo || "cliente",
      criado_em: serverTimestamp(),
    });
    await signOut(authSecundario);
    return cred.user.uid;
  } finally {
    await deleteApp(appSecundario);
  }
}
