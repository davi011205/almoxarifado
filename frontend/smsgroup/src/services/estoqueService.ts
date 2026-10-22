
import type {
  Estoque,
  RegistrarMovimentoParams
} from "../types";

export function registrarMovimento({
  estoque,
  produtoId,
  quantidade,
  operacao
}: RegistrarMovimentoParams): Estoque {
  const id = produtoId.trim();
  const qtd = Number(quantidade);

  if (!id) {
    throw new Error("Informe ou selecione um produto antes de continuar.");
  }

  if (!Number.isInteger(qtd) || qtd <= 0) {
    throw new Error(
      "Informe uma quantidade inteira maior que zero."
    );
  }

  const atual = estoque[id] ?? 0;

  if (operacao === "retirar" && qtd > atual) {
    throw new Error(
      `Estoque insuficiente. Quantidade disponível: ${atual}.`
    );
  }

  const novoTotal =
    operacao === "inserir"
      ? atual + qtd
      : atual - qtd;

  return {
    ...estoque,
    [id]: novoTotal
  };
}

const CHAVE_ESTOQUE = "almoxarifado.estoque";

export function obterEstoqueSalvo(): Estoque {
  const dados = localStorage.getItem(CHAVE_ESTOQUE);

  if (!dados) return {};

  try {
    return JSON.parse(dados) as Estoque;
  } catch {
    return {};
  }
}

export function salvarEstoqueSalvo(estoque: Estoque): void {
  localStorage.setItem(CHAVE_ESTOQUE, JSON.stringify(estoque));
}