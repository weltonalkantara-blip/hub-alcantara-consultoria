"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/firebase";

// Hook para saber quem está logado (ou null), se ainda está carregando, e o
// perfil correspondente na coleção `usuarios` (nome/tipo). Usado nas páginas
// protegidas para decidir se mostra o conteúdo, redireciona para /login, ou
// libera recursos exclusivos de admin (ex.: Cadastro de usuários).
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [perfilRaw, setPerfilRaw] = useState(null);
  const [perfilLoadingRaw, setPerfilLoadingRaw] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribePerfil = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      setPerfilRaw(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setPerfilLoadingRaw(false);
    });
    return () => unsubscribePerfil();
  }, [user]);

  // Deriva os valores finais em vez de "resetar" estado dentro do efeito
  // quando não há usuário — evita disparar setState direto no corpo do
  // efeito (fora do callback de inscrição), que o React desaconselha.
  const perfil = user ? perfilRaw : null;
  const perfilLoading = user ? perfilLoadingRaw : false;
  const isAdmin = Boolean(user) && perfil?.tipo === "admin";

  return { user, perfil, perfilLoading, isAdmin, loading };
}
