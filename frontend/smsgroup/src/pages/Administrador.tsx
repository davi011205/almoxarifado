import { useState, type FormEvent } from "react";

import Header from "../components/layout/Header/Header";
import Botao from "../components/ui/Botao";
import { ESTOQUE_MINIMO } from "../constants/estoque";
import {
  cadastrarFuncionario,
  listarFuncionarios,
} from "../services/autenticacaoService";
import { listarMovimentacoes } from "../services/movimentacoesService";
import {
  abrirNotaNoWhatsApp,
  criarNotaReposicao,
  listarNotasReposicao,
  listarQuantidadesMinimas,
  salvarQuantidadeMinima,
} from "../services/reposicaoService";
import type {
  AdministradorProps,
  Funcionario,
  ItemReposicao,
  NotaReposicao,
  RegistroMovimentacao,
} from "../types";

const NOTAS_POR_PAGINA = 10;

function criarItensReposicao(
  estoque: Record<string, number>,
  minimos: Record<string, number>
): ItemReposicao[] {
  return Object.entries(estoque)
    .map(([produto, quantidadeAtual]) => {
      const quantidadeMinima = minimos[produto] ?? ESTOQUE_MINIMO;
      return {
        produto,
        quantidadeAtual,
        quantidadeMinima,
        // Quando já está exatamente no limite, sugere uma unidade para sair da zona de alerta.
        quantidadeRepor: Math.max(1, quantidadeMinima - quantidadeAtual),
      };
    })
    .filter((item) => item.quantidadeAtual <= item.quantidadeMinima)
    .sort((a, b) => a.produto.localeCompare(b.produto, "pt-BR", { sensitivity: "base" }));
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
  const [movimentacoes] = useState<RegistroMovimentacao[]>(() => listarMovimentacoes());
  const [quantidadesMinimas, setQuantidadesMinimas] = useState<Record<string, number>>(
    () => listarQuantidadesMinimas()
  );
  const [minimosEditados, setMinimosEditados] = useState<Record<string, string>>({});
  const [feedbackMinimo, setFeedbackMinimo] = useState<{
    produto: string;
    mensagem: string;
    erro: boolean;
  } | null>(null);
  const [notasReposicao, setNotasReposicao] = useState<NotaReposicao[]>(
    () => listarNotasReposicao()
  );
  const [paginaNotas, setPaginaNotas] = useState(1);
  const [notaGerada, setNotaGerada] = useState<NotaReposicao | null>(null);

  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const produtosOrdenados = Object.entries(estoque).sort(([a], [b]) =>
    a.localeCompare(b, "pt-BR", { sensitivity: "base" })
  );
  const produtosAbaixoDoMinimo = criarItensReposicao(estoque, quantidadesMinimas);
  const totalPaginasNotas = Math.max(1, Math.ceil(notasReposicao.length / NOTAS_POR_PAGINA));
  const paginaNotasValida = Math.min(paginaNotas, totalPaginasNotas);
  const notasDaPagina = notasReposicao.slice(
    (paginaNotasValida - 1) * NOTAS_POR_PAGINA,
    paginaNotasValida * NOTAS_POR_PAGINA
  );

  function fazerCadastro(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setMensagem("");

    try {
      cadastrarFuncionario({ nome, usuario, senha });
      setFuncionarios(listarFuncionarios().filter((f) => f.perfil === "funcionario"));
      setNome("");
      setUsuario("");
      setSenha("");
      setMensagem("Funcionário cadastrado com sucesso.");
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Não foi possível cadastrar o funcionário.");
    }
  }

  function salvarMinimoProduto(produto: string) {
    const texto = minimosEditados[produto] ?? String(
      quantidadesMinimas[produto] ?? ESTOQUE_MINIMO
    );
    const minimo = Number(texto);

    if (texto.trim() === "" || !Number.isInteger(minimo) || minimo < 0) {
      setFeedbackMinimo({
        produto,
        mensagem: "Informe um número inteiro igual ou maior que zero.",
        erro: true,
      });
      return;
    }

    try {
      const novosMinimos = salvarQuantidadeMinima(produto, minimo);
      setQuantidadesMinimas(novosMinimos);
      setMinimosEditados((atuais) => ({ ...atuais, [produto]: String(minimo) }));
      setFeedbackMinimo({
        produto,
        mensagem: `Quantidade mínima definida como ${minimo}.`,
        erro: false,
      });
    } catch (e: unknown) {
      setFeedbackMinimo({
        produto,
        mensagem: e instanceof Error ? e.message : "Não foi possível salvar o mínimo.",
        erro: true,
      });
    }
  }

  function gerarNotaReposicao() {
    if (produtosAbaixoDoMinimo.length === 0) return;

    const nota = criarNotaReposicao(produtosAbaixoDoMinimo, "manual");
    setNotasReposicao(listarNotasReposicao());
    setPaginaNotas(1);
    setNotaGerada(nota);
  }

  function selecionarNotaParaVisualizar(nota: NotaReposicao) {
    setNotaGerada(nota);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="pagina">
      <Header onSair={onSair} />

      <section className="conteudo-administracao">
        <div className="cabecalho-admin">
          <div>
            <p className="descricao">Área administrativa</p>
            <h1>Administração do almoxarifado</h1>
            <p>Bem-vindo(a), <strong>{funcionario.nome}</strong>.</p>
          </div>
          <Botao variante="secundario" onClick={onVoltar}>Voltar ao painel</Botao>
        </div>

        <section className="secao-estoque-baixo">
          <div className="titulo-estoque-baixo">
            <div>
              <h2>Produtos no limite ou abaixo do estoque mínimo</h2>
              <p>O limite é configurado individualmente na seção de mínimos por produto.</p>
            </div>
            <span className="contador-estoque-baixo">{produtosAbaixoDoMinimo.length} produto(s)</span>
          </div>

          {produtosAbaixoDoMinimo.length === 0 ? (
            <p className="mensagem-sem-alertas">Nenhum produto no limite ou abaixo do estoque mínimo.</p>
          ) : (
            <>
              <div className="tabela-responsiva">
                <table className="tabela-admin tabela-alerta-estoque">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Quantidade atual</th>
                      <th>Quantidade mínima</th>
                      <th>Quantidade sugerida para reposição</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtosAbaixoDoMinimo.map((item) => (
                      <tr key={item.produto}>
                        <td>{item.produto}</td>
                        <td className="estoque-baixo-valor">{item.quantidadeAtual}</td>
                        <td>{item.quantidadeMinima}</td>
                        <td>{item.quantidadeRepor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="descricao">
                Uma nota automática é criada quando uma movimentação faz um produto alcançar ou ficar abaixo do seu mínimo. O botão abaixo também permite gerar uma nota conjunta.
              </p>
              <Botao onClick={gerarNotaReposicao}>Gerar nota de reposição</Botao>
            </>
          )}
        </section>

        {notaGerada && (
          <section className="nota-reposicao nota-preview">
            <div className="nota-cabecalho">
              <div>
                <h2>Nota de solicitação de reposição</h2>
                <p>Almoxarifado · {notaGerada.origem === "automatica" ? "geração automática" : "geração administrativa"}</p>
              </div>
              <div className="nota-identificacao">
                <p><strong>Referência:</strong> {notaGerada.referencia}</p>
                <p><strong>Data:</strong> {new Date(notaGerada.data).toLocaleString("pt-BR")}</p>
              </div>
            </div>

            <div className="tabela-responsiva">
              <table className="tabela-admin">
                <thead>
                  <tr><th>Produto</th><th>Saldo atual</th><th>Quantidade mínima</th><th>Quantidade a repor</th></tr>
                </thead>
                <tbody>
                  {notaGerada.itens.map((item) => (
                    <tr key={item.produto}>
                      <td>{item.produto}</td>
                      <td>{item.quantidadeAtual}</td>
                      <td>{item.quantidadeMinima}</td>
                      <td>{item.quantidadeRepor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="nota-rodape">A mensagem de WhatsApp é aberta com o conteúdo preenchido; é necessário confirmar o envio no WhatsApp.</p>
            <div className="nota-acoes">
              <Botao onClick={() => window.print()}>Imprimir ou salvar como PDF</Botao>
              <Botao variante="secundario" onClick={() => abrirNotaNoWhatsApp(notaGerada)}>Enviar pelo WhatsApp</Botao>
              <Botao variante="secundario" onClick={() => setNotaGerada(null)}>Fechar nota</Botao>
            </div>
          </section>
        )}

        <section className="secao-admin">
          <h2>Quantidade mínima por produto</h2>
          <p className="descricao">
            Configure individualmente a quantidade que dispara alertas e notas de reposição. Use zero se não desejar definir um limite mínimo para aquele item.
          </p>
          {produtosOrdenados.length === 0 ? (
            <p>Nenhum produto cadastrado no estoque para configurar.</p>
          ) : (
            <div className="tabela-responsiva">
              <table className="tabela-admin">
                <thead>
                  <tr><th>Produto / QR Code</th><th>Estoque atual</th><th>Quantidade mínima</th><th>Ação</th></tr>
                </thead>
                <tbody>
                  {produtosOrdenados.map(([produto, quantidade]) => {
                    const minimoAtual = quantidadesMinimas[produto] ?? ESTOQUE_MINIMO;
                    return (
                      <tr key={produto}>
                        <td className="codigo-produto">{produto}</td>
                        <td>{quantidade}</td>
                        <td>
                          <label className="somente-leitor" htmlFor={`minimo-${encodeURIComponent(produto)}`}>
                            Quantidade mínima para {produto}
                          </label>
                          <input
                            id={`minimo-${encodeURIComponent(produto)}`}
                            className="campo campo-minimo"
                            type="number"
                            min="0"
                            step="1"
                            value={minimosEditados[produto] ?? String(minimoAtual)}
                            onChange={(e) => setMinimosEditados((atuais) => ({ ...atuais, [produto]: e.target.value }))}
                          />
                        </td>
                        <td>
                          <Botao type="button" onClick={() => salvarMinimoProduto(produto)}>Salvar</Botao>
                          {feedbackMinimo?.produto === produto && (
                            <p className={feedbackMinimo.erro ? "mensagem-erro mensagem-minimo" : "mensagem-sucesso mensagem-minimo"} role="status">
                              {feedbackMinimo.mensagem}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="secao-admin">
          <h2>Notas de reposição geradas</h2>
          <p className="descricao">
            Histórico persistente, ordenado da nota mais recente para a mais antiga. Cada nota pode ser consultada e enviada pelo WhatsApp.
          </p>
          {notasReposicao.length === 0 ? (
            <p>Nenhuma nota de reposição foi gerada até o momento.</p>
          ) : (
            <>
              <div className="lista-notas-reposicao">
                {notasDaPagina.map((nota) => (
                  <details className="nota-historico" key={nota.referencia}>
                    <summary>
                      <span>
                        <strong>{nota.referencia}</strong>
                        <span className="nota-historico-data">{new Date(nota.data).toLocaleString("pt-BR")}</span>
                      </span>
                      <span className={`etiqueta-nota ${nota.origem === "automatica" ? "etiqueta-nota-auto" : "etiqueta-nota-manual"}`}>
                        {nota.origem === "automatica" ? "Automática" : "Administrativa"}
                      </span>
                    </summary>
                    <div className="tabela-responsiva">
                      <table className="tabela-admin">
                        <thead>
                          <tr><th>Produto</th><th>Saldo atual</th><th>Quantidade mínima</th><th>Quantidade a repor</th></tr>
                        </thead>
                        <tbody>
                          {nota.itens.map((item) => (
                            <tr key={item.produto}>
                              <td>{item.produto}</td>
                              <td>{item.quantidadeAtual}</td>
                              <td>{item.quantidadeMinima}</td>
                              <td>{item.quantidadeRepor}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="nota-acoes">
                      <Botao type="button" onClick={() => selecionarNotaParaVisualizar(nota)}>Visualizar / imprimir</Botao>
                      <Botao type="button" variante="secundario" onClick={() => abrirNotaNoWhatsApp(nota)}>Enviar pelo WhatsApp</Botao>
                    </div>
                  </details>
                ))}
              </div>
              {totalPaginasNotas > 1 && (
                <nav className="paginacao" aria-label="Paginação das notas de reposição">
                  <Botao
                    variante="secundario"
                    type="button"
                    disabled={paginaNotasValida <= 1}
                    onClick={() => setPaginaNotas((pagina) => Math.max(1, pagina - 1))}
                  >Anterior</Botao>
                  <span aria-live="polite">Página {paginaNotasValida} de {totalPaginasNotas} · {notasReposicao.length} nota(s)</span>
                  <Botao
                    variante="secundario"
                    type="button"
                    disabled={paginaNotasValida >= totalPaginasNotas}
                    onClick={() => setPaginaNotas((pagina) => Math.min(totalPaginasNotas, pagina + 1))}
                  >Próxima</Botao>
                </nav>
              )}
            </>
          )}
        </section>

        <section className="secao-admin">
          <h2>Cadastrar funcionário</h2>
          <p className="descricao">
            O funcionário cadastrado poderá entrar no sistema e registrar entradas e retiradas de produtos.
          </p>
          <form className="formulario-admin" onSubmit={fazerCadastro}>
            <div className="campo-login">
              <label htmlFor="nome-funcionario">Nome completo</label>
              <input id="nome-funcionario" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="campo-login">
              <label htmlFor="usuario-funcionario">Nome de usuário</label>
              <input id="usuario-funcionario" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="off" required />
            </div>
            <div className="campo-login">
              <label htmlFor="senha-funcionario">Senha</label>
              <input id="senha-funcionario" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" required />
            </div>
            {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
            {mensagem && <p className="mensagem-sucesso" role="status">{mensagem}</p>}
            <Botao type="submit">Cadastrar funcionário</Botao>
          </form>

          <h3>Funcionários cadastrados</h3>
          {funcionarios.length === 0 ? (
            <p>Nenhum funcionário cadastrado.</p>
          ) : (
            <div className="tabela-responsiva">
              <table className="tabela-admin">
                <thead><tr><th>Nome</th><th>Usuário</th><th>Perfil</th></tr></thead>
                <tbody>
                  {funcionarios.map((f) => (
                    <tr key={f.id}><td>{f.nome}</td><td>{f.usuario}</td><td>Funcionário</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="secao-admin">
          <h2>Histórico de movimentações</h2>
          <p className="descricao">Entradas e retiradas registradas no sistema, da mais recente à mais antiga.</p>
          {movimentacoes.length === 0 ? (
            <p>Nenhuma movimentação registrada até o momento.</p>
          ) : (
            <div className="tabela-responsiva">
              <table className="tabela-admin">
                <thead><tr><th>Data e hora</th><th>Produto</th><th>Operação</th><th>Quantidade movimentada</th><th>Funcionário responsável</th></tr></thead>
                <tbody>
                  {movimentacoes.map((registro) => (
                    <tr key={registro.id}>
                      <td>{new Date(registro.data).toLocaleString("pt-BR")}</td>
                      <td>{registro.produto}</td>
                      <td>
                        <span className={registro.operacao === "inserir" ? "etiqueta-entrada" : "etiqueta-retirada"}>
                          {registro.operacao === "inserir" ? "Entrada" : "Retirada"}
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
