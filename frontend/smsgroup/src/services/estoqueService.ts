
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
    throw new Error("Leia primeiro o QR Code do produto.");
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
