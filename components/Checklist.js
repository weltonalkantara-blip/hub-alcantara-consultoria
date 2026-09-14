"use client";

import { useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  collection,
  addDoc,
  updateDoc as updateTaskDoc,
  deleteDoc,
  doc as taskDocRef,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/firebase";

// Checklist / quadro Kanban por projeto.
// Guardado no Firestore (não em localStorage) para ficar compartilhado entre
// todos que acessam o projeto — cada seção vira uma coluna, cada tarefa um card.
//
// Estrutura:
//   projetos/{projetoId}                -> campo `checklist_secoes: string[]` (ordem das colunas)
//   projetos/{projetoId}/checklist_tarefas/{tarefaId}
//     { titulo, secao, responsavel, prioridade, prazo, nota, ordem, criado_em }

const PRIORIDADE_COR = {
  Alta: "bg-rose-100 text-rose-700",
  Média: "bg-amber-100 text-amber-700",
  Baixa: "bg-emerald-100 text-emerald-700",
};

const TEMPLATE_PADRAO = [
  {
    secao: "Governança e Planejamento",
    tarefas: [
      ["Aprovar escopo e priorização", "Diretoria", "Alta", "Aprovar escopo e sponsor executivo"],
      ["Nomear sponsor e líder do projeto", "CEO", "Alta", "Definir sponsor executivo e líder dedicado"],
      ["Agendar workshop kickoff", "PMO", "Média", "Workshop com diretoria, financeiro, operações, TI"],
    ],
  },
  {
    secao: "Compras e Fornecedores",
    tarefas: [
      ["Implantar departamento de compras", "Operações", "Alta", "Organograma, SLAs, templates de PO"],
      ["Parametrizar fornecedores no Alpha 7", "Compras", "Média", "Lead time, lote mínimo, condições comerciais"],
      ["Negociação de condições com top fornecedores", "Compras", "Média", "Foco em prazo e desconto por volume"],
    ],
  },
  {
    secao: "Operações de Loja",
    tarefas: [
      ["POPs de conferência e recebimento", "Operações", "Alta", "Checklist físico x nota fiscal; fotos de divergência"],
      ["Baixa de vencidos e registro", "Gerência Loja", "Alta", "Varredura semanal; autorização e laudo"],
      ["Procedimento de encomendas por CPF", "Frente de Loja", "Média", "Reserva de estoque e notificações"],
    ],
  },
  {
    secao: "Cadastro e Fiscal",
    tarefas: [
      ["Auditoria de cadastro (princípio ativo/dosagem)", "TI/Regulação", "Alta", "Padronizar campos obrigatórios"],
      ["Revisão NCM/CST e regimes monofásicos", "Fiscal", "Alta", "Validar parametrizações e notas rejeitadas"],
      ["Deduplicação de SKUs por GTIN", "TI", "Média", "Consolidar histórico e encerrar obsoletos"],
    ],
  },
  {
    secao: "Comercial e Financeiro",
    tarefas: [
      ["Precificação e caderno de ofertas", "Comercial", "Média", "Markup por categoria; regras de elegibilidade"],
      ["Integração PDV–Estoque–Financeiro (CMV)", "Financeiro/TI", "Alta", "Conciliação de cartões e fechamento mensal"],
      ["Análise de comissionamento e lucratividade", "RH/Comercial", "Média", "Simulações por margem vs volume"],
    ],
  },
];

export default function Checklist({ projetoId }) {
  const [secoes, setSecoes] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [modal, setModal] = useState(null); // { secao, tarefaId } | null
  const [form, setForm] = useState(vazio());
  const [aplicandoTemplate, setAplicandoTemplate] = useState(false);

  function vazio() {
    return { titulo: "", responsavel: "", prioridade: "Média", prazo: "", nota: "" };
  }

  // Seções vêm do próprio documento do projeto.
  useEffect(() => {
    if (!projetoId) return;
    const unsub = onSnapshot(doc(db, "projetos", projetoId), (snap) => {
      setSecoes(snap.data()?.checklist_secoes || []);
    });
    return () => unsub();
  }, [projetoId]);

  // Tarefas em tempo real, ordenadas pelo campo `ordem`.
  useEffect(() => {
    if (!projetoId) return;
    const q = query(
      collection(db, "projetos", projetoId, "checklist_tarefas"),
      orderBy("ordem", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setTarefas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setCarregando(false);
    });
    return () => unsub();
  }, [projetoId]);

  async function adicionarSecao() {
    const nome = window.prompt("Nome da nova seção (ex: Fiscal, Operações, Compras)");
    if (!nome || !nome.trim()) return;
    await updateDoc(doc(db, "projetos", projetoId), {
      checklist_secoes: arrayUnion(nome.trim()),
    });
  }

  async function aplicarTemplatePadrao() {
    setAplicandoTemplate(true);
    try {
      const nomesSecoes = TEMPLATE_PADRAO.map((s) => s.secao);
      await updateDoc(doc(db, "projetos", projetoId), {
        checklist_secoes: arrayUnion(...nomesSecoes),
      });
      const batch = writeBatch(db);
      TEMPLATE_PADRAO.forEach((s) => {
        s.tarefas.forEach(([titulo, responsavel, prioridade, nota], i) => {
          const ref = taskDocRef(collection(db, "projetos", projetoId, "checklist_tarefas"));
          batch.set(ref, {
            titulo,
            responsavel,
            prioridade,
            nota,
            prazo: "",
            secao: s.secao,
            ordem: i * 1000,
            criado_em: serverTimestamp(),
          });
        });
      });
      await batch.commit();
    } finally {
      setAplicandoTemplate(false);
    }
  }

  function abrirNovaTarefa(secao) {
    setForm(vazio());
    setModal({ secao, tarefaId: null });
  }

  function abrirEdicao(tarefa) {
    setForm({
      titulo: tarefa.titulo || "",
      responsavel: tarefa.responsavel || "",
      prioridade: tarefa.prioridade || "Média",
      prazo: tarefa.prazo || "",
      nota: tarefa.nota || "",
    });
    setModal({ secao: tarefa.secao, tarefaId: tarefa.id });
  }

  async function salvarTarefa(e) {
    e.preventDefault();
    if (!form.titulo.trim()) return;
    if (modal.tarefaId) {
      await updateTaskDoc(
        doc(db, "projetos", projetoId, "checklist_tarefas", modal.tarefaId),
        { ...form }
      );
    } else {
      const daSecao = tarefas.filter((t) => t.secao === modal.secao);
      const maiorOrdem = daSecao.reduce((max, t) => Math.max(max, t.ordem || 0), 0);
      await addDoc(collection(db, "projetos", projetoId, "checklist_tarefas"), {
        ...form,
        secao: modal.secao,
        ordem: maiorOrdem + 1000,
        criado_em: serverTimestamp(),
      });
    }
    setModal(null);
  }

  async function removerTarefa(tarefaId) {
    if (!window.confirm("Remover esta tarefa?")) return;
    await deleteDoc(doc(db, "projetos", projetoId, "checklist_tarefas", tarefaId));
  }

  // Drag and drop: solta o card sobre uma coluna (e opcionalmente sobre outro
  // card, para reordenar) e recalcula a `ordem` por indexação fracionária.
  async function handleDrop(e, secaoDestino, tarefaAlvoId) {
    e.preventDefault();
    const tarefaId = e.dataTransfer.getData("text/plain");
    if (!tarefaId) return;
    const daSecao = tarefas
      .filter((t) => t.secao === secaoDestino && t.id !== tarefaId)
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

    let novaOrdem;
    if (daSecao.length === 0) {
      novaOrdem = 1000;
    } else if (!tarefaAlvoId) {
      novaOrdem = (daSecao[daSecao.length - 1].ordem || 0) + 1000;
    } else {
      const idx = daSecao.findIndex((t) => t.id === tarefaAlvoId);
      const anterior = daSecao[idx - 1];
      const alvo = daSecao[idx];
      novaOrdem = anterior
        ? ((anterior.ordem || 0) + (alvo?.ordem || 0)) / 2
        : (alvo?.ordem || 1000) / 2;
    }

    await updateTaskDoc(doc(db, "projetos", projetoId, "checklist_tarefas", tarefaId), {
      secao: secaoDestino,
      ordem: novaOrdem,
    });
  }

  function corresponde(t) {
    if (!filtro) return true;
    const q = filtro.toLowerCase();
    return (
      t.titulo?.toLowerCase().includes(q) ||
      t.responsavel?.toLowerCase().includes(q) ||
      t.prioridade?.toLowerCase().includes(q) ||
      t.nota?.toLowerCase().includes(q) ||
      t.secao?.toLowerCase().includes(q)
    );
  }

  if (carregando) {
    return <p className="text-sm text-slate-500">Carregando checklist...</p>;
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={adicionarSecao}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            + Nova seção
          </button>
          {secoes.length === 0 && (
            <button
              onClick={aplicarTemplatePadrao}
              disabled={aplicandoTemplate}
              className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {aplicandoTemplate ? "Aplicando..." : "Usar template de consultoria farma"}
            </button>
          )}
        </div>
        <input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Filtrar tarefas..."
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
      </div>

      {secoes.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nenhuma seção ainda. Crie uma seção ou use o template inicial acima.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {secoes.map((secao) => {
            const tarefasDaSecao = tarefas
              .filter((t) => t.secao === secao)
              .filter(corresponde)
              .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
            return (
              <div
                key={secao}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, secao, null)}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">{secao}</h3>
                  <button
                    onClick={() => abrirNovaTarefa(secao)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    + tarefa
                  </button>
                </div>

                {tarefasDaSecao.length === 0 ? (
                  <p className="rounded-md border border-dashed border-slate-200 p-3 text-xs text-slate-400">
                    Nenhuma tarefa nesta seção
                  </p>
                ) : (
                  <div className="space-y-2">
                    {tarefasDaSecao.map((t) => (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={(e) =>
                          e.dataTransfer.setData("text/plain", t.id)
                        }
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.stopPropagation();
                          handleDrop(e, secao, t.id);
                        }}
                        className="cursor-grab rounded-lg border border-slate-100 bg-slate-50 p-2.5 active:cursor-grabbing"
                      >
                        <p className="text-sm font-medium text-slate-800">
                          {t.titulo}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1 text-xs">
                          {t.responsavel && (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-slate-600">
                              {t.responsavel}
                            </span>
                          )}
                          <span
                            className={`rounded-full px-2 py-0.5 ${
                              PRIORIDADE_COR[t.prioridade] || "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {t.prioridade}
                          </span>
                          {t.prazo && (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-slate-600">
                              {t.prazo}
                            </span>
                          )}
                        </div>
                        {t.nota && (
                          <p className="mt-1 text-xs text-slate-500">{t.nota}</p>
                        )}
                        <div className="mt-1.5 flex gap-3 text-xs">
                          <button
                            onClick={() => abrirEdicao(t)}
                            className="text-slate-500 hover:text-slate-800"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => removerTarefa(t.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <form
            onSubmit={salvarTarefa}
            className="w-full max-w-md space-y-3 rounded-xl bg-white p-5"
          >
            <h3 className="text-sm font-semibold text-slate-800">
              {modal.tarefaId ? "Editar tarefa" : `Nova tarefa · ${modal.secao}`}
            </h3>
            <input
              autoFocus
              required
              placeholder="Título da tarefa"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <input
                placeholder="Responsável"
                value={form.responsavel}
                onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <select
                value={form.prioridade}
                onChange={(e) => setForm({ ...form, prioridade: e.target.value })}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option>Alta</option>
                <option>Média</option>
                <option>Baixa</option>
              </select>
            </div>
            <input
              type="date"
              value={form.prazo}
              onChange={(e) => setForm({ ...form, prazo: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Notas / passos"
              rows={3}
              value={form.nota}
              onChange={(e) => setForm({ ...form, nota: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Salvar tarefa
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
