const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const TOKEN_KEY = "almoxarifado.authToken";
const FUNCIONARIO_KEY = "almoxarifado.usuarioAtual";

export interface ApiOptions extends RequestInit {
  public?: boolean;
}

export function obterToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function salvarToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function limparCredenciais(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(FUNCIONARIO_KEY);
}

export function salvarFuncionarioSessao(funcionario: unknown): void {
  sessionStorage.setItem(FUNCIONARIO_KEY, JSON.stringify(funcionario));
}

export function obterFuncionarioSessaoSalvo<T>(): T | null {
  const dados = sessionStorage.getItem(FUNCIONARIO_KEY);
  if (!dados) return null;
  try {
    return JSON.parse(dados) as T;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { public: publicRequest = false, headers: suppliedHeaders, ...rest } = options;
  const headers = new Headers(suppliedHeaders);
  if (rest.body !== undefined && rest.body !== null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  if (!publicRequest) {
    const token = obterToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...rest, headers });
  } catch {
    throw new Error(
      "Não foi possível conectar à API do almoxarifado. Verifique se o backend está online e se VITE_API_URL está configurada."
    );
  }

  if (!response.ok) {
    let message = `A solicitação falhou (HTTP ${response.status}).`;
    try {
      const data = (await response.json()) as { message?: string; error?: string };
      message = data.message || data.error || message;
    } catch {
      // A resposta pode não conter JSON.
    }
    if (response.status === 401 && !publicRequest) {
      // Não limpamos o token automaticamente aqui: o chamador decide como tratar a sessão.
    }
    throw new Error(message);
  }

  if (response.status === 204 || response.headers.get("content-length") === "0" || !response.headers.get("content-type")?.includes("application/json")) {
    return undefined as T;
  }
  const body = await response.text();
  if (!body.trim()) return undefined as T;
  return JSON.parse(body) as T;
}
