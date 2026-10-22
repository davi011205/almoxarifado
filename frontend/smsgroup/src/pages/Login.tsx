
import { useState } from "react";
import type { FormEvent } from "react";

import CampoFormulario from "../components/ui/CampoFormulario";
import Botao from "../components/ui/Botao";
import { autenticar } from "../services/autenticacaoService";
import type { LoginProps } from "../types";

export default function Login({ onEntrar }: LoginProps) {
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  function entrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (autenticar(codigo, senha)) {
      setErro("");
      onEntrar();
    } else {
      setErro("Código ou senha incorretos!");
    }
  }

  return (
    <main className="pagina-login">
      <form className="painel painel-login" onSubmit={entrar}>
        <div className="logo">A</div>
        <h1>Almoxarifado</h1>

        <p className="descricao">
          Acesse sua conta de funcionário.
        </p>

        <CampoFormulario
          id="codigo"
          label="Código do funcionário"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Digite seu código"
          autoComplete="username"
          required
        />

        <CampoFormulario
          id="senha"
          label="Senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Digite sua senha"
          autoComplete="current-password"
          required
        />

        {erro && <p className="mensagem-erro">{erro}</p>}

        <Botao type="submit" className="botao-largo">
          Entrar no sistema →
        </Botao>
      </form>
    </main>
  );
}
