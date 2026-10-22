import { ESTOQUE_MINIMO } from "../constants/estoque";
import type { ItemReposicao, NotaReposicao } from "../types";

const CHAVE_QUANTIDADES_MINIMAS = "almoxarifado.quantidadesMinimas";
const CHAVE_QUANTIDADES_IDEAIS = "almoxarifado.quantidadesIdeais";
const CHAVE_NOTAS_REPOSICAO = "almoxarifado.notasReposicao";
const CHAVE_WHATSAPP_REPOSICAO = "almoxarifado.whatsappReposicao";
const WHATSAPP_PADRAO = "5531988608306";
export const QUANTIDADE_IDEAL_PADRAO = 50;

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
  return listarQuantidadesMinimas()[produto] ?? ESTOQUE_MINIMO;
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

  const atualizados = { ...listarQuantidadesMinimas(), [id]: quantidadeMinima };
  localStorage.setItem(CHAVE_QUANTIDADES_MINIMAS, JSON.stringify(atualizados));
  return atualizados;
}

export function listarQuantidadesIdeais(): Record<string, number> {
  return lerRegistroNumerico(CHAVE_QUANTIDADES_IDEAIS);
}

export function obterQuantidadeIdeal(produto: string): number {
  return listarQuantidadesIdeais()[produto] ?? QUANTIDADE_IDEAL_PADRAO;
}

export function salvarQuantidadeIdeal(
  produto: string,
  quantidadeIdeal: number
): Record<string, number> {
  const id = produto.trim();
  if (!id) throw new Error("Não foi possível identificar o produto.");
  if (!Number.isInteger(quantidadeIdeal) || quantidadeIdeal < 0) {
    throw new Error("A quantidade ideal deve ser um número inteiro igual ou maior que zero.");
  }

  const atualizados = { ...listarQuantidadesIdeais(), [id]: quantidadeIdeal };
  localStorage.setItem(CHAVE_QUANTIDADES_IDEAIS, JSON.stringify(atualizados));
  return atualizados;
}

export function obterWhatsAppReposicao(): string {
  const salvo = localStorage.getItem(CHAVE_WHATSAPP_REPOSICAO);
  return (salvo ?? WHATSAPP_PADRAO).replace(/\D/g, "");
}

export function salvarWhatsAppReposicao(numero: string): string {
  const normalizado = numero.replace(/\D/g, "");
  if (normalizado.length < 10 || normalizado.length > 15) {
    throw new Error("Informe o WhatsApp com código do país e DDD, contendo entre 10 e 15 dígitos.");
  }
  localStorage.setItem(CHAVE_WHATSAPP_REPOSICAO, normalizado);
  return normalizado;
}

export function listarNotasReposicao(): NotaReposicao[] {
  const dados = localStorage.getItem(CHAVE_NOTAS_REPOSICAO);
  if (!dados) return [];

  try {
    const notas = JSON.parse(dados) as NotaReposicao[];
    if (!Array.isArray(notas)) return [];

    // Mantém compatibilidade com notas criadas por versões anteriores do sistema.
    return notas
      .filter((nota) =>
        typeof nota?.referencia === "string" &&
        typeof nota?.data === "string" &&
        Array.isArray(nota?.itens)
      )
      .map((nota) => ({
        ...nota,
        itens: nota.itens.map((item) => ({
          ...item,
          quantidadeIdeal: Number.isInteger(item.quantidadeIdeal)
            ? item.quantidadeIdeal
            : QUANTIDADE_IDEAL_PADRAO,
          quantidadeRepor: Number.isInteger(item.quantidadeRepor)
            ? item.quantidadeRepor
            : Math.max(0, QUANTIDADE_IDEAL_PADRAO - item.quantidadeAtual),
        })),
      }))
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  } catch {
    return [];
  }
}

export function criarNotaReposicao(
  itens: ItemReposicao[],
  origem: NotaReposicao["origem"] = "manual"
): NotaReposicao {
  if (itens.length === 0) {
    throw new Error("Não existem produtos abaixo do estoque mínimo para incluir na nota.");
  }

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
        `• ${item.produto}: saldo atual ${item.quantidadeAtual}; quantidade ideal ${item.quantidadeIdeal ?? QUANTIDADE_IDEAL_PADRAO}; quantidade a repor ${Math.max(0, item.quantidadeIdeal - item.quantidadeAtual)}.`
    ),
    "",
    "Nota gerada e confirmada na área administrativa do almoxarifado.",
  ];

  return linhas.join("\n");
}

export function obterLinkWhatsApp(nota: NotaReposicao): string {
  const telefone = obterWhatsAppReposicao();
  return `https://wa.me/${telefone}?text=${encodeURIComponent(montarMensagemWhatsApp(nota))}`;
}

export function baixarNotaReposicao(nota: NotaReposicao): void {
  const escapar = (valor: string | number) =>
    `"${String(valor).replace(/"/g, '""')}"`;
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
