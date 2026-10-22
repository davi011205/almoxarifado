import { useState, type FormEvent } from "react";

import Header from "../components/layout/Header/Header";
import Botao from "../components/ui/Botao";

import { ESTOQUE_MINIMO } from "../constants/estoque";
import {
  cadastrarFuncionario,
  listarFuncionarios,
} from "../services/autenticacaoService";
import { listarMovimentacoes } from "../services/movimentacoesService";

import type {
  AdministradorProps,
  Funcionario,
  RegistroMovimentacao,
} from "../types";

interface ItemReposicao {
  produto: string;
  quantidadeAtual: number;
  quantidadeRepor: number;
}

interface NotaReposicao {
  referencia: string;
  data: string;
  itens: ItemReposicao[];
}

export default function Administrador({
  estoque,
  funcionario,
  onSair,
  onVoltar,
}: AdministradorProps) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>(
    () => listarFuncionarios().filter((f) => f.perfil === "funcionario")
  );

  const [movimentacoes] = useState<RegistroMovimentacao[]>(
    () => listarMovimentacoes()
  );

  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const [notaGerada, setNotaGerada] = useState<NotaReposicao | null>(null);

  const produtosAbaixoDoMinimo = Object.entries(estoque)
    .map(([produto, quantidade]) => ({
      produto,
      quantidadeAtual: quantidade,
      quantidadeRepor: Math.max(0, ESTOQUE_MINIMO - quantidade),
    }))
    .filter((item) => item.quantidadeAtual < ESTOQUE_MINIMO)
    .sort((a, b) => a.quantidadeAtual - b.quantidadeAtual);

  function fazerCadastro(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setErro("");
    setMensagem("");

    try {
      cadastrarFuncionario({ nome, usuario, senha });

      setFuncionarios(
        listarFuncionarios().filter((f) => f.perfil === "funcionario")
      );

      setNome("");
      setUsuario("");
      setSenha("");
      setMensagem("Funcionário cadastrado com sucesso.");
    } catch (e: unknown) {
      setErro(
        e instanceof Error
          ? e.message
          : "Não foi possível cadastrar o funcionário."
      );
    }
  }

  function gerarNotaReposicao() {
    if (produtosAbaixoDoMinimo.length === 0) return;

    setNotaGerada({
      referencia: `REP-${Date.now()}`,
      data: new Date().toLocaleString("pt-BR"),
      itens: produtosAbaixoDoMinimo.map((item) => ({ ...item })),
    });
  }

  return (
    <main className="pagina">
      <Header onSair={onSair} />

      <section className="conteudo-administracao">
        <div className="cabecalho-admin">
          <div>
            <p className="descricao">Área administrativa</p>
            <h1>Administração do almoxarifado</h1>
            <p>
              Bem-vindo(a), <strong>{funcionario.nome}</strong>.
            </p>
          </div>

          <Botao variante="secundario" onClick={onVoltar}>
            Voltar ao painel
          </Botao>
        </div>

        {/* ALERTA DE ESTOQUE BAIXO */}
        <section className="secao-estoque-baixo">
          <div className="titulo-estoque-baixo">
            <div>
              <h2>Produtos abaixo do estoque mínimo</h2>
              <p>
                Limite configurado: {ESTOQUE_MINIMO} unidade(s) por produto.
              </p>
            </div>

            <span className="contador-estoque-baixo">
              {produtosAbaixoDoMinimo.length} produto(s)
            </span>
          </div>

          {produtosAbaixoDoMinimo.length === 0 ? (
            <p className="mensagem-sem-alertas">
              Nenhum produto abaixo do estoque mínimo.
            </p>
          ) : (
            <>
              <div className="tabela-responsiva">
                <table className="tabela-admin tabela-alerta-estoque">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Quantidade atual</th>
                      <th>Quantidade sugerida para reposição</th>
                    </tr>
                  </thead>

                  <tbody>
                    {produtosAbaixoDoMinimo.map((item) => (
                      <tr key={item.produto}>
                        <td>{item.produto}</td>
                        <td className="estoque-baixo-valor">
                          {item.quantidadeAtual}
                        </td>
                        <td>{item.quantidadeRepor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="descricao">
                A sugestão de reposição considera a quantidade necessária para
                alcançar o mínimo configurado.
              </p>

              <Botao onClick={gerarNotaReposicao}>
                Gerar nota de reposição
              </Botao>
            </>
          )}
        </section>

        {/* NOTA DE REPOSIÇÃO */}
        {notaGerada && (
          <section className="nota-reposicao">
            <div className="nota-cabecalho">
              <div>
                <h2>Nota de solicitação de reposição</h2>
                <p>Almoxarifado</p>
              </div>

              <div className="nota-identificacao">
                <p>
                  <strong>Referência:</strong> {notaGerada.referencia}
                </p>
                <p>
                  <strong>Data:</strong> {notaGerada.data}
                </p>
              </div>
            </div>

            <p>
              Solicitação preliminar de reposição dos produtos abaixo. Este
              documento é uma prévia e não representa um pedido efetivado.
            </p>

            <div className="tabela-responsiva">
              <table className="tabela-admin">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Saldo atual</th>
                    <th>Quantidade a repor</th>
                  </tr>
                </thead>

                <tbody>
                  {notaGerada.itens.map((item) => (
                    <tr key={item.produto}>
                      <td>{item.produto}</td>
                      <td>{item.quantidadeAtual}</td>
                      <td>{item.quantidadeRepor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="nota-rodape">
              Documento demonstrativo — sujeito a conferência e aprovação.
            </p>

            <div className="nota-acoes">
              <Botao
                onClick={() => window.print()}
                className="botao-largo"
              >
                Imprimir ou salvar como PDF
              </Botao>

              <Botao
                variante="secundario"
                onClick={() => setNotaGerada(null)}
              >
                Fechar nota
              </Botao>
            </div>
          </section>
        )}

        {/* CADASTRO DE FUNCIONÁRIOS */}
        <section className="secao-admin">
          <h2>Cadastrar funcionário</h2>
          <p className="descricao">
            O funcionário cadastrado poderá entrar no sistema e registrar
            entradas e retiradas de produtos.
          </p>

          <form className="formulario-admin" onSubmit={fazerCadastro}>
            <div className="campo-login">
              <label htmlFor="nome-funcionario">Nome completo</label>
              <input
                id="nome-funcionario"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="campo-login">
              <label htmlFor="usuario-funcionario">Nome de usuário</label>
              <input
                id="usuario-funcionario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                autoComplete="off"
                required
              />
            </div>

            <div className="campo-login">
              <label htmlFor="senha-funcionario">Senha</label>
              <input
                id="senha-funcionario"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            {erro && (
              <p className="mensagem-erro" role="alert">
                {erro}
              </p>
            )}

            {mensagem && (
              <p className="mensagem-sucesso" role="status">
                {mensagem}
              </p>
            )}

            <Botao type="submit">Cadastrar funcionário</Botao>
          </form>

          <h3>Funcionários cadastrados</h3>

          {funcionarios.length === 0 ? (
            <p>Nenhum funcionário cadastrado.</p>
          ) : (
            <div className="tabela-responsiva">
              <table className="tabela-admin">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Usuário</th>
                    <th>Perfil</th>
                  </tr>
                </thead>

                <tbody>
                  {funcionarios.map((f) => (
                    <tr key={f.id}>
                      <td>{f.nome}</td>
                      <td>{f.usuario}</td>
                      <td>Funcionário</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* HISTÓRICO DE MOVIMENTAÇÕES */}
        <section className="secao-admin">
          <h2>Histórico de movimentações</h2>
          <p className="descricao">
            Entradas e retiradas registradas no sistema, da mais recente à mais
            antiga.
          </p>

          {movimentacoes.length === 0 ? (
            <p>Nenhuma movimentação registrada até o momento.</p>
          ) : (
            <div className="tabela-responsiva">
              <table className="tabela-admin">
                <thead>
                  <tr>
                    <th>Data e hora</th>
                    <th>Produto</th>
                    <th>Operação</th>
                    <th>Quantidade movimentada</th>
                    <th>Funcionário responsável</th>
                  </tr>
                </thead>

                <tbody>
                  {movimentacoes.map((registro) => (
                    <tr key={registro.id}>
                      <td>
                        {new Date(registro.data).toLocaleString("pt-BR")}
                      </td>
                      <td>{registro.produto}</td>
                      <td>
                        <span
                          className={
                            registro.operacao === "inserir"
                              ? "etiqueta-entrada"
                              : "etiqueta-retirada"
                          }
                        >
                          {registro.operacao === "inserir"
                            ? "Entrada"
                            : "Retirada"}
                        </span>
                      </td>
                      <td>{registro.quantidade}</td>
                      <td>{registro.funcionarioNome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}