import type { Estoque, OperacaoEstoque, RegistrarMovimentoParams, RegistroMovimentacao } from "../types";
import { apiRequest } from "./api";

export interface ItemCarrinhoRequest {
  produto: string;
  quantidade: number;
}

export interface ProdutoEstoque {
  produto: string;
  quantidade: number;
  quantidadeMinima: number;
  quantidadeIdeal: number;
}

export interface ResultadoMovimentacao {
  estoque: Estoque;
  produtosAbaixoDoMinimo: ProdutoEstoque[];
  movimentacoes: RegistroMovimentacao[];
}

/** Validação antecipada para apresentar erros sem precisar enviar um lote inválido à API. */
export function registrarMovimento({
  estoque,
  produtoId,
  quantidade,
  operacao,
}: RegistrarMovimentoParams): Estoque {
  const id = produtoId.trim();
  const qtd = Number(quantidade);

  if (!id) throw new Error("Informe ou selecione um produto antes de continuar.");
  if (!Number.isInteger(qtd) || qtd <= 0) {
    throw new Error("Informe uma quantidade inteira maior que zero.");
  }

  const atual = estoque[id] ?? 0;
  if (operacao === "retirar" && qtd > atual) {
    throw new Error(`Estoque insuficiente. Quantidade disponível: ${atual}.`);
  }

  return {
    ...estoque,
    [id]: operacao === "inserir" ? atual + qtd : atual - qtd,
  };
}

export async function obterEstoqueSalvo(): Promise<Estoque> {
  return apiRequest<Estoque>("/estoque");
}

export async function listarProdutosEstoque(): Promise<ProdutoEstoque[]> {
  return apiRequest<ProdutoEstoque[]>("/estoque/produtos");
}

export async function confirmarMovimentacoes(params: {
  operacao: OperacaoEstoque;
  itens: ItemCarrinhoRequest[];
  projetoDestino?: string;
}): Promise<ResultadoMovimentacao> {
  return apiRequest<ResultadoMovimentacao>("/estoque/movimentacoes", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
