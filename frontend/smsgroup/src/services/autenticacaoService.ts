import type { Funcionario } from "../types";

const CHAVE_FUNCIONARIOS = "almoxarifado.funcionarios";
const CHAVE_SESSAO = "almoxarifado.usuarioAtual";

const administradorInicial: Funcionario = {
  id: "admin-inicial",
  nome: "Administrador",
  usuario: "davi",
  senha: "1234",
  perfil: "administrador",
};

function gerarId(): string {
  return globalThis.crypto?.randomUUID?.() ??
    `func-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function listarFuncionarios(): Funcionario[] {
  const dados = localStorage.getItem(CHAVE_FUNCIONARIOS);

  if (!dados) {
    localStorage.setItem(
      CHAVE_FUNCIONARIOS,
      JSON.stringify([administradorInicial])
    );

    return [administradorInicial];
  }

  try {
    const funcionarios = JSON.parse(dados) as Funcionario[];

    if (!funcionarios.some((f) => f.perfil === "administrador")) {
      funcionarios.unshift(administradorInicial);

      localStorage.setItem(
        CHAVE_FUNCIONARIOS,
        JSON.stringify(funcionarios)
      );
    }

    return funcionarios;
  } catch {
    localStorage.setItem(
      CHAVE_FUNCIONARIOS,
      JSON.stringify([administradorInicial])
    );

    return [administradorInicial];
  }
}

export function autenticarFuncionario(
  usuario: string,
  senha: string
): Funcionario | null {
  const funcionario = listarFuncionarios().find(
    (f) =>
      f.usuario.toLowerCase() === usuario.trim().toLowerCase() &&
      f.senha === senha
  );

  return funcionario ?? null;
}

export function cadastrarFuncionario(dados: {
  nome: string;
  usuario: string;
  senha: string;
}): Funcionario {
  const funcionarios = listarFuncionarios();

  const usuario = dados.usuario.trim();

  if (!dados.nome.trim() || !usuario || !dados.senha) {
    throw new Error("Preencha todos os campos.");
  }

  if (
    funcionarios.some(
      (f) => f.usuario.toLowerCase() === usuario.toLowerCase()
    )
  ) {
    throw new Error("Este nome de usuário já está cadastrado.");
  }

  const novoFuncionario: Funcionario = {
    id: gerarId(),
    nome: dados.nome.trim(),
    usuario,
    senha: dados.senha,
    perfil: "funcionario",
  };

  localStorage.setItem(
    CHAVE_FUNCIONARIOS,
    JSON.stringify([...funcionarios, novoFuncionario])
  );

  return novoFuncionario;
}

export function iniciarSessao(funcionario: Funcionario): void {
  sessionStorage.setItem(CHAVE_SESSAO, funcionario.id);
}

export function obterFuncionarioSessao(): Funcionario | null {
  const id = sessionStorage.getItem(CHAVE_SESSAO);

  if (!id) return null;

  return listarFuncionarios().find((f) => f.id === id) ?? null;
}

export function encerrarSessao(): void {
  sessionStorage.removeItem(CHAVE_SESSAO);
}