import { useState, type FormEvent } from "react";
import Botao from "../components/ui/Botao";
import { autenticarFuncionario } from "../services/autenticacaoService";
import type { LoginProps } from "../types";

export default function Login({ onEntrar }: LoginProps) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function fazerLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const funcionario = await autenticarFuncionario(usuario, senha);
      await onEntrar(funcionario);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Não foi possível entrar no sistema.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="pagina pagina-login">
      <section className="painel painel-login">
        <h1>Almoxarifado</h1>
        <p className="descricao">Entre com seu usuário e senha.</p>
        <form onSubmit={fazerLogin}>
          <div className="campo-login">
            <label htmlFor="usuario">Usuário</label>
            <input id="usuario" type="text" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" required />
          </div>
          <div className="campo-login">
            <label htmlFor="senha">Senha</label>
            <input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required />
          </div>
          {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
          <Botao type="submit" className="botao-largo" disabled={carregando}>
            {carregando ? "Conectando..." : "Entrar"}
          </Botao>
        </form>
      </section>
    </main>
  );
}
