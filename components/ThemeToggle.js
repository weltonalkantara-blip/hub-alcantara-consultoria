"use client";

import { useEffect, useState } from "react";

const CHAVE_ARMAZENAMENTO = "hub-theme";

// Alterna entre os dois temas do Hub (só no navegador, via localStorage —
// não é salvo no perfil do usuário no Firestore). O <script> inline em
// app/layout.js já aplica o tema salvo antes da hidratação, então aqui só
// precisamos ler o valor atual para exibir o botão certo.
export default function ThemeToggle() {
  const [tema, setTema] = useState(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const atual = document.documentElement.getAttribute("data-theme") || "executiva";
      setTema(atual);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  function alternar() {
    const proximo = tema === "claro" ? "executiva" : "claro";
    document.documentElement.setAttribute("data-theme", proximo);
    try {
      window.localStorage.setItem(CHAVE_ARMAZENAMENTO, proximo);
    } catch {
      // Navegador sem acesso a localStorage (modo privado, etc.) — a troca
      // ainda funciona nesta sessão, só não é lembrada na próxima visita.
    }
    setTema(proximo);
  }

  if (!tema) {
    // Evita piscar um estado errado antes do useEffect rodar.
    return <span className="h-8 w-[88px] sm:w-[104px]" aria-hidden="true" />;
  }

  const éClaro = tema === "claro";

  return (
    <button
      type="button"
      onClick={alternar}
      title={éClaro ? "Mudar para tema Confiança Executiva" : "Mudar para tema Corporativo Claro"}
      className="flex items-center gap-1.5 rounded-md border border-gold-500/40 px-2.5 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:text-sm"
    >
      <span aria-hidden="true">{éClaro ? "☀️" : "🌙"}</span>
      <span className="hidden sm:inline">{éClaro ? "Claro" : "Executiva"}</span>
    </button>
  );
}
