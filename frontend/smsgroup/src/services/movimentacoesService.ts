import type { RegistroMovimentacao } from "../types";
import { apiRequest } from "./api";

export async function listarMovimentacoes(): Promise<RegistroMovimentacao[]> {
  return apiRequest<RegistroMovimentacao[]>("/movimentacoes");
}
