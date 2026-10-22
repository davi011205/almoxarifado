import type { RegistroMovimentacao } from "../types";

const CHAVE_MOVIMENTACOES = "almoxarifado.movimentacoes";

type NovaMovimentacao = Omit<RegistroMovimentacao, "id">;

function gerarId(): string {
  return globalThis.crypto?.randomUUID?.() ??
    `mov-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function listarMovimentacoes(): RegistroMovimentacao[] {
  const dados = localStorage.getItem(CHAVE_MOVIMENTACOES);

  if (!dados) return [];

  try {
    const registros = JSON.parse(dados) as RegistroMovimentacao[];

    return registros.sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );
  } catch {
    return [];
  }
}

export function salvarMovimentacao(
  movimentacao: NovaMovimentacao
): void {
  const registros = listarMovimentacoes();

  const novoRegistro: RegistroMovimentacao = {
    ...movimentacao,
    id: gerarId(),
  };

  localStorage.setItem(
    CHAVE_MOVIMENTACOES,
    JSON.stringify([novoRegistro, ...registros])
  );
}