import type { Funcionario } from "../types";
import {
  apiRequest,
  limparCredenciais,
  obterFuncionarioSessaoSalvo,
  salvarFuncionarioSessao,
  salvarToken,
} from "./api";

interface LoginResponse {
  token: string;
  funcionario: Funcionario;
}

export async function autenticarFuncionario(
  usuario: string,
  senha: string
): Promise<Funcionario> {
  const resultado = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    public: true,
    body: JSON.stringify({ usuario: usuario.trim(), senha }),
  });

  salvarToken(resultado.token);
  salvarFuncionarioSessao(resultado.funcionario);
  return resultado.funcionario;
}

export async function validarSessao(): Promise<Funcionario> {
  const funcionario = await apiRequest<Funcionario>("/auth/me");
  salvarFuncionarioSessao(funcionario);
  return funcionario;
}

export async function listarFuncionarios(): Promise<Funcionario[]> {
  return apiRequest<Funcionario[]>("/funcionarios");
}

export async function cadastrarFuncionario(dados: {
  nome: string;
  usuario: string;
  senha: string;
}): Promise<Funcionario> {
  return apiRequest<Funcionario>("/funcionarios", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export async function atualizarFuncionario(
  id: string,
  dados: { nome: string; usuario: string; senha?: string }
): Promise<Funcionario> {
  const corpo = {
    nome: dados.nome,
    usuario: dados.usuario,
    ...(dados.senha?.trim() ? { senha: dados.senha } : {}),
  };
  return apiRequest<Funcionario>(`/funcionarios/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(corpo),
  });
}

export async function excluirFuncionario(id: string): Promise<void> {
  return apiRequest<void>(`/funcionarios/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function iniciarSessao(funcionario: Funcionario): void {
  salvarFuncionarioSessao(funcionario);
}

export function obterFuncionarioSessao(): Funcionario | null {
  return obterFuncionarioSessaoSalvo<Funcionario>();
}

export function encerrarSessao(): void {
  limparCredenciais();
}
