import { ESTOQUE_MINIMO } from "../constants/estoque";
import type { ItemReposicao, NotaReposicao } from "../types";

const CHAVE_QUANTIDADES_MINIMAS = "almoxarifado.quantidadesMinimas";
const CHAVE_NOTAS_REPOSICAO = "almoxarifado.notasReposicao";

function lerRegistroNumerico(chave: string): Record<string, number> {
  const dados = localStorage.getItem(chave);
  if (!dados) return {};

  try {
    const registro = JSON.parse(dados) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(registro).filter(
        ([, valor]) => typeof valor === "number" && Number.isInteger(valor) && valor >= 0
      )
    ) as Record<string, number>;
  } catch {
    return {};
  }
}

export function listarQuantidadesMinimas(): Record<string, number> {
  return lerRegistroNumerico(CHAVE_QUANTIDADES_MINIMAS);
}

export function obterQuantidadeMinima(produto: string): number {
  const minimos = listarQuantidadesMinimas();
  return minimos[produto] ?? ESTOQUE_MINIMO;
}

export function salvarQuantidadeMinima(
  produto: string,
  quantidadeMinima: number
): Record<string, number> {
  const id = produto.trim();
  if (!id) throw new Error("Não foi possível identificar o produto.");
  if (!Number.isInteger(quantidadeMinima) || quantidadeMinima < 0) {
    throw new Error("A quantidade mínima deve ser um número inteiro igual ou maior que zero.");
  }

  const minimos = listarQuantidadesMinimas();
  const atualizados = { ...minimos, [id]: quantidadeMinima };
  localStorage.setItem(CHAVE_QUANTIDADES_MINIMAS, JSON.stringify(atualizados));
  return atualizados;
}

export function listarNotasReposicao(): NotaReposicao[] {
  const dados = localStorage.getItem(CHAVE_NOTAS_REPOSICAO);
  if (!dados) return [];

  try {
    const notas = JSON.parse(dados) as NotaReposicao[];
    if (!Array.isArray(notas)) return [];

    return notas
      .filter((nota) =>
        typeof nota?.referencia === "string" &&
        typeof nota?.data === "string" &&
        Array.isArray(nota?.itens)
      )
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  } catch {
    return [];
  }
}

export function criarNotaReposicao(
  itens: ItemReposicao[],
  origem: NotaReposicao["origem"]
): NotaReposicao {
  const nota: NotaReposicao = {
    referencia: `REP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    data: new Date().toISOString(),
    itens: itens.map((item) => ({ ...item })),
    origem,
  };

  const notas = listarNotasReposicao();
  localStorage.setItem(CHAVE_NOTAS_REPOSICAO, JSON.stringify([nota, ...notas]));
  return nota;
}

export function montarMensagemWhatsApp(nota: NotaReposicao): string {
  const linhas = [
    "NOTA DE REPOSIÇÃO — ALMOXARIFADO",
    `Referência: ${nota.referencia}`,
    `Data: ${new Date(nota.data).toLocaleString("pt-BR")}`,
    "",
    ...nota.itens.map(
      (item) =>
        `• ${item.produto}: saldo atual ${item.quantidadeAtual}; mínimo ${item.quantidadeMinima}; sugerido para reposição ${item.quantidadeRepor}.`
    ),
    "",
    nota.origem === "automatica"
      ? "Nota gerada automaticamente ao atingir o limite mínimo de estoque."
      : "Nota de reposição gerada na área administrativa.",
  ];

  return linhas.join("\n");
}

export function obterLinkWhatsApp(nota: NotaReposicao): string {
  const telefone = "5531988608306";
  return `https://wa.me/${telefone}?text=${encodeURIComponent(montarMensagemWhatsApp(nota))}`;
}

export function abrirNotaNoWhatsApp(nota: NotaReposicao): void {
  window.open(obterLinkWhatsApp(nota), "_blank", "noopener,noreferrer");
}
