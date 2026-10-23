import { ESTOQUE_MINIMO } from "../constants/estoque";
import type { ItemReposicao, NotaReposicao } from "../types";
import { apiRequest } from "./api";

const WHATSAPP_PADRAO = "5531988608306";
export const QUANTIDADE_IDEAL_PADRAO = 50;

interface ConfiguracaoReposicao {
  whatsapp: string;
  quantidadesMinimas: Record<string, number>;
  quantidadesIdeais: Record<string, number>;
}

let cacheMinimos: Record<string, number> = {};
let cacheIdeais: Record<string, number> = {};
let cacheWhatsApp = WHATSAPP_PADRAO;

export async function carregarConfiguracoesReposicao(): Promise<ConfiguracaoReposicao> {
  const configuracao = await apiRequest<ConfiguracaoReposicao>("/configuracoes/reposicao");
  cacheMinimos = configuracao.quantidadesMinimas ?? {};
  cacheIdeais = configuracao.quantidadesIdeais ?? {};
  cacheWhatsApp = (configuracao.whatsapp || WHATSAPP_PADRAO).replace(/\D/g, "");
  return {
    whatsapp: cacheWhatsApp,
    quantidadesMinimas: { ...cacheMinimos },
    quantidadesIdeais: { ...cacheIdeais },
  };
}

export function listarQuantidadesMinimas(): Record<string, number> {
  return { ...cacheMinimos };
}

export function obterQuantidadeMinima(produto: string): number {
  return cacheMinimos[produto] ?? ESTOQUE_MINIMO;
}

export async function salvarQuantidadeMinima(
  produto: string,
  quantidadeMinima: number
): Promise<Record<string, number>> {
  const id = produto.trim();
  if (!id) throw new Error("Não foi possível identificar o produto.");
  if (!Number.isInteger(quantidadeMinima) || quantidadeMinima < 0) {
    throw new Error("A quantidade mínima deve ser um número inteiro igual ou maior que zero.");
  }

  const quantidadeIdeal = cacheIdeais[id] ?? QUANTIDADE_IDEAL_PADRAO;
  const atualizado = await apiRequest<{ produto: string; quantidadeMinima: number; quantidadeIdeal: number }>(
    `/produtos/${encodeURIComponent(id)}/parametros`,
    {
      method: "PUT",
      body: JSON.stringify({ quantidadeMinima, quantidadeIdeal }),
    }
  );
  cacheMinimos = { ...cacheMinimos, [id]: atualizado.quantidadeMinima };
  cacheIdeais = { ...cacheIdeais, [id]: atualizado.quantidadeIdeal };
  return listarQuantidadesMinimas();
}

export function listarQuantidadesIdeais(): Record<string, number> {
  return { ...cacheIdeais };
}

export function obterQuantidadeIdeal(produto: string): number {
  return cacheIdeais[produto] ?? QUANTIDADE_IDEAL_PADRAO;
}

export async function salvarQuantidadeIdeal(
  produto: string,
  quantidadeIdeal: number
): Promise<Record<string, number>> {
  const id = produto.trim();
  if (!id) throw new Error("Não foi possível identificar o produto.");
  if (!Number.isInteger(quantidadeIdeal) || quantidadeIdeal < 0) {
    throw new Error("A quantidade ideal deve ser um número inteiro igual ou maior que zero.");
  }

  const quantidadeMinima = cacheMinimos[id] ?? ESTOQUE_MINIMO;
  const atualizado = await apiRequest<{ produto: string; quantidadeMinima: number; quantidadeIdeal: number }>(
    `/produtos/${encodeURIComponent(id)}/parametros`,
    {
      method: "PUT",
      body: JSON.stringify({ quantidadeMinima, quantidadeIdeal }),
    }
  );
  cacheMinimos = { ...cacheMinimos, [id]: atualizado.quantidadeMinima };
  cacheIdeais = { ...cacheIdeais, [id]: atualizado.quantidadeIdeal };
  return listarQuantidadesIdeais();
}

export function obterWhatsAppReposicao(): string {
  return cacheWhatsApp;
}

export async function salvarWhatsAppReposicao(numero: string): Promise<string> {
  const normalizado = numero.replace(/\D/g, "");
  if (normalizado.length < 10 || normalizado.length > 15) {
    throw new Error("Informe o WhatsApp com código do país e DDD, contendo entre 10 e 15 dígitos.");
  }
  const configuracao = await apiRequest<ConfiguracaoReposicao>("/configuracoes/whatsapp", {
    method: "PUT",
    body: JSON.stringify({ numero: normalizado }),
  });
  cacheWhatsApp = (configuracao.whatsapp || normalizado).replace(/\D/g, "");
  cacheMinimos = configuracao.quantidadesMinimas ?? cacheMinimos;
  cacheIdeais = configuracao.quantidadesIdeais ?? cacheIdeais;
  return cacheWhatsApp;
}

export async function listarNotasReposicao(): Promise<NotaReposicao[]> {
  return apiRequest<NotaReposicao[]>("/notas-reposicao");
}

export async function criarNotaReposicao(
  itens: ItemReposicao[],
  origem: NotaReposicao["origem"] = "manual"
): Promise<NotaReposicao> {
  // O backend ignora listas fornecidas pelo cliente e monta a nota a partir do estoque
  // compartilhado e dos limites que estão salvos no banco, para evitar notas incompletas/desatualizadas.
  if (itens.length === 0) {
    throw new Error("Não existem produtos abaixo do estoque mínimo para incluir na nota.");
  }
  return apiRequest<NotaReposicao>("/notas-reposicao", {
    method: "POST",
    body: JSON.stringify({ origem }),
  });
}

export function montarMensagemWhatsApp(nota: NotaReposicao): string {
  return [
    "NOTA DE REPOSIÇÃO — ALMOXARIFADO",
    `Referência: ${nota.referencia}`,
    `Data: ${new Date(nota.data).toLocaleString("pt-BR")}`,
    "",
    ...nota.itens.map(
      (item) =>
        `• ${item.produto}: saldo atual ${item.quantidadeAtual}; quantidade ideal ${item.quantidadeIdeal ?? QUANTIDADE_IDEAL_PADRAO}; quantidade a repor ${Math.max(0, (item.quantidadeIdeal ?? QUANTIDADE_IDEAL_PADRAO) - item.quantidadeAtual)}.`
    ),
    "",
    "Nota gerada e confirmada na área administrativa do almoxarifado.",
  ].join("\n");
}

export function obterLinkWhatsApp(nota: NotaReposicao): string {
  return `https://wa.me/${obterWhatsAppReposicao()}?text=${encodeURIComponent(montarMensagemWhatsApp(nota))}`;
}

export function baixarNotaReposicao(nota: NotaReposicao): void {
  const escapar = (valor: string | number) => `"${String(valor).replace(/"/g, '""')}"`;
  const linhas = [
    ["Nota de solicitação de reposição"],
    ["Referência", nota.referencia],
    ["Data", new Date(nota.data).toLocaleString("pt-BR")],
    [],
    ["Produto", "Saldo atual", "Quantidade mínima", "Quantidade ideal", "Quantidade a repor"],
    ...nota.itens.map((item) => [
      item.produto,
      item.quantidadeAtual,
      item.quantidadeMinima,
      item.quantidadeIdeal ?? QUANTIDADE_IDEAL_PADRAO,
      Math.max(0, (item.quantidadeIdeal ?? QUANTIDADE_IDEAL_PADRAO) - item.quantidadeAtual),
    ]),
  ];
  const csv = linhas.map((linha) => linha.map(escapar).join(";")).join("\r\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nota.referencia}.csv`;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function abrirNotaNoWhatsApp(nota: NotaReposicao): void {
  window.open(obterLinkWhatsApp(nota), "_blank", "noopener,noreferrer");
}
