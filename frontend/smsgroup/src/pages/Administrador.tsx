import { useState, type FormEvent } from "react";

import Header from "../components/layout/Header/Header";
import Botao from "../components/ui/Botao";
import { ESTOQUE_MINIMO } from "../constants/estoque";
import {
  cadastrarFuncionario,
  listarFuncionarios,
  atualizarFuncionario,
  excluirFuncionario,
} from "../services/autenticacaoService";
import { listarMovimentacoes } from "../services/movimentacoesService";
import {
  abrirNotaNoWhatsApp,
  baixarNotaReposicao,
  criarNotaReposicao,
  listarNotasReposicao,
  listarQuantidadesIdeais,
  listarQuantidadesMinimas,
  obterWhatsAppReposicao,
  salvarQuantidadeIdeal,
  salvarQuantidadeMinima,
  salvarWhatsAppReposicao,
  QUANTIDADE_IDEAL_PADRAO,
} from "../services/reposicaoService";
import type {
  AdministradorProps,
  Funcionario,
  ItemReposicao,
  NotaReposicao,
  RegistroMovimentacao,
} from "../types";

const NOTAS_POR_PAGINA = 10;

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
  const [quantidadesIdeais, setQuantidadesIdeais] = useState<Record<string, number>>(
    () => listarQuantidadesIdeais()
  );
  const [minimosEditados, setMinimosEditados] = useState<Record<string, string>>({});
  const [ideaisEditados, setIdeaisEditados] = useState<Record<string, string>>({});
  const [feedbackMinimo, setFeedbackMinimo] = useState<{
    produto: string;
    mensagem: string;
    erro: boolean;
  } | null>(null);
  const [feedbackIdeal, setFeedbackIdeal] = useState<{
    produto: string;
    mensagem: string;
    erro: boolean;
  } | null>(null);

  const [whatsApp, setWhatsApp] = useState(() => obterWhatsAppReposicao());
  const [feedbackWhatsApp, setFeedbackWhatsApp] = useState("");
  const [erroWhatsApp, setErroWhatsApp] = useState("");

  const [notasReposicao, setNotasReposicao] = useState<NotaReposicao[]>(
    () => listarNotasReposicao()
  );
  const [paginaNotas, setPaginaNotas] = useState(1);
  const [notaGerada, setNotaGerada] = useState<NotaReposicao | null>(null);
  const [itensNotaPendente, setItensNotaPendente] = useState<ItemReposicao[] | null>(null);
  const [erroNota, setErroNota] = useState("");
  const [buscaMinimo, setBuscaMinimo] = useState("");

  const [funcionarioEditando, setFuncionarioEditando] = useState<Funcionario | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState<Funcionario | null>(null);
  const [edicaoNome, setEdicaoNome] = useState("");
  const [edicaoUsuario, setEdicaoUsuario] = useState("");
  const [edicaoSenha, setEdicaoSenha] = useState("");

  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const produtosOrdenados = Object.entries(estoque)
    .filter(([produto]) =>
      produto.toLocaleLowerCase("pt-BR").includes(buscaMinimo.trim().toLocaleLowerCase("pt-BR"))
    )
    .sort(([a], [b]) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));

  const produtosEmFalta: ItemReposicao[] = Object.entries(estoque)
    .map(([produto, quantidadeAtual]) => {
      const quantidadeMinima = quantidadesMinimas[produto] ?? ESTOQUE_MINIMO;
      const quantidadeIdeal = quantidadesIdeais[produto] ?? QUANTIDADE_IDEAL_PADRAO;
      return {
        produto,
        quantidadeAtual,
        quantidadeMinima,
        quantidadeIdeal,
        quantidadeRepor: Math.max(0, quantidadeIdeal - quantidadeAtual),
      };
    })
    .filter((item) => item.quantidadeAtual < item.quantidadeMinima)
    .sort((a, b) => a.quantidadeAtual - b.quantidadeAtual);

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
    const texto = minimosEditados[produto] ?? String(quantidadesMinimas[produto] ?? ESTOQUE_MINIMO);
    const minimo = Number(texto);

    if (texto.trim() === "" || !Number.isInteger(minimo) || minimo < 0) {
      setFeedbackMinimo({ produto, mensagem: "Informe um inteiro igual ou maior que zero.", erro: true });
      return;
    }

    try {
      const atualizados = salvarQuantidadeMinima(produto, minimo);
      setQuantidadesMinimas(atualizados);
      setMinimosEditados((atuais) => ({ ...atuais, [produto]: String(minimo) }));
      setFeedbackMinimo({ produto, mensagem: `Estoque mínimo definido como ${minimo}.`, erro: false });
    } catch (e: unknown) {
      setFeedbackMinimo({
        produto,
        mensagem: e instanceof Error ? e.message : "Não foi possível salvar o mínimo.",
        erro: true,
      });
    }
  }

  function salvarIdealProduto(produto: string) {
    const texto = ideaisEditados[produto] ?? String(quantidadesIdeais[produto] ?? QUANTIDADE_IDEAL_PADRAO);
    const ideal = Number(texto);

    if (texto.trim() === "" || !Number.isInteger(ideal) || ideal < 0) {
      setFeedbackIdeal({ produto, mensagem: "Informe um inteiro igual ou maior que zero.", erro: true });
      return;
    }

    try {
      const atualizados = salvarQuantidadeIdeal(produto, ideal);
      setQuantidadesIdeais(atualizados);
      setIdeaisEditados((atuais) => ({ ...atuais, [produto]: String(ideal) }));
      setFeedbackIdeal({ produto, mensagem: `Quantidade ideal definida como ${ideal}.`, erro: false });
    } catch (e: unknown) {
      setFeedbackIdeal({
        produto,
        mensagem: e instanceof Error ? e.message : "Não foi possível salvar a quantidade ideal.",
        erro: true,
      });
    }
  }

  function salvarTelefoneWhatsApp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedbackWhatsApp("");
    setErroWhatsApp("");

    try {
      const salvo = salvarWhatsAppReposicao(whatsApp);
      setWhatsApp(salvo);
      setFeedbackWhatsApp("Número de WhatsApp salvo. As próximas notas usarão este destinatário.");
    } catch (e: unknown) {
      setErroWhatsApp(e instanceof Error ? e.message : "Não foi possível salvar o número.");
    }
  }

  function prepararNotaReposicao() {
    setErroNota("");
    if (produtosEmFalta.length === 0) {
      setErroNota("Não há produtos abaixo do estoque mínimo neste momento.");
      return;
    }
    // A nota ainda não é gravada. Os itens ficam apenas em revisão até a confirmação.
    setItensNotaPendente(produtosEmFalta.map((item) => ({ ...item })));
  }

  function confirmarGeracaoNota() {
    if (!itensNotaPendente?.length) return;

    try {
      const nota = criarNotaReposicao(itensNotaPendente, "manual");
      setNotasReposicao(listarNotasReposicao());
      setPaginaNotas(1);
      setNotaGerada(nota);
      setItensNotaPendente(null);
      setErroNota("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: unknown) {
      setErroNota(e instanceof Error ? e.message : "Não foi possível criar a nota de reposição.");
    }
  }

  function selecionarNotaParaVisualizar(nota: NotaReposicao) {
    setNotaGerada(nota);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editarFuncionario(f: Funcionario) {
    setFuncionarioEditando(f);
    setEdicaoNome(f.nome);
    setEdicaoUsuario(f.usuario);
    setEdicaoSenha("");
    setErro("");
  }

  function confirmarEdicaoFuncionario(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!funcionarioEditando) return;

    try {
      atualizarFuncionario(funcionarioEditando.id, {
        nome: edicaoNome,
        usuario: edicaoUsuario,
        senha: edicaoSenha,
      });
      setFuncionarios(listarFuncionarios().filter((f) => f.perfil === "funcionario"));
      setFuncionarioEditando(null);
      setMensagem("Funcionário atualizado com sucesso.");
      setErro("");
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Não foi possível atualizar o funcionário.");
    }
  }

  function confirmarExclusaoFuncionario() {
    if (!confirmarExclusao) return;
    excluirFuncionario(confirmarExclusao.id);
    setFuncionarios(listarFuncionarios().filter((f) => f.perfil === "funcionario"));
    setConfirmarExclusao(null);
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

        {/* Destaque de estoque baixo e nota com todos os produtos em falta. */}
        <section className="secao-estoque-baixo">
          <div className="titulo-estoque-baixo">
            <div>
              <h2>Produtos abaixo do estoque mínimo</h2>
              <p className="descricao">A nota incluirá todos os produtos abaixo do limite configurado.</p>
            </div>
            <span className="contador-estoque-baixo">{produtosEmFalta.length} produto(s)</span>
          </div>

          {produtosEmFalta.length === 0 ? (
            <p className="mensagem-sem-alertas">Nenhum produto abaixo do estoque mínimo.</p>
          ) : (
            <div className="tabela-responsiva">
              <table className="tabela-admin">
                <thead>
                  <tr><th>Produto</th><th>Estoque atual</th><th>Estoque mínimo</th><th>Quantidade ideal</th><th>Quantidade a repor</th></tr>
                </thead>
                <tbody>
                  {produtosEmFalta.map((item) => (
                    <tr key={item.produto}>
                      <td>{item.produto}</td>
                      <td className="estoque-baixo-valor">{item.quantidadeAtual}</td>
                      <td>{item.quantidadeMinima}</td>
                      <td>{item.quantidadeIdeal}</td>
                      <td>{item.quantidadeRepor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="nota-acoes">
            <Botao type="button" onClick={prepararNotaReposicao} disabled={produtosEmFalta.length === 0}>
              Preparar nota com todos os itens em falta
            </Botao>
          </div>
          {erroNota && <p className="mensagem-erro" role="alert">{erroNota}</p>}
        </section>

        {/* Definição do número de WhatsApp utilizado nas notas. */}
        <section className="secao-admin">
          <h2>WhatsApp para notas de reposição</h2>
          <p className="descricao">
            Informe o telefone com código do país e DDD. Exemplo: 5531999999999. O número salvo será usado no botão de envio das notas.
          </p>
          <form className="config-whatsapp-form" onSubmit={salvarTelefoneWhatsApp}>
            <div className="campo-login">
              <label htmlFor="whatsapp-reposicao">Número de WhatsApp</label>
              <input
                id="whatsapp-reposicao"
                className="campo"
                type="tel"
                inputMode="tel"
                placeholder="5531999999999"
                value={whatsApp}
                onChange={(e) => setWhatsApp(e.target.value)}
                required
              />
            </div>
            <Botao type="submit">Salvar número</Botao>
          </form>
          {feedbackWhatsApp && <p className="mensagem-sucesso" role="status">{feedbackWhatsApp}</p>}
          {erroWhatsApp && <p className="mensagem-erro" role="alert">{erroWhatsApp}</p>}
        </section>

        {/* Visualização de nota só aparece após sua confirmação final. */}
        {notaGerada && (
          <section className="nota-reposicao nota-preview">
            <div className="nota-cabecalho">
              <div>
                <h2>Nota de solicitação de reposição</h2>
                <p>Almoxarifado · {notaGerada.origem === "automatica" ? "gerada após confirmação da retirada" : "gerada após confirmação administrativa"}</p>
              </div>
              <div className="nota-identificacao">
                <p><strong>Referência:</strong> {notaGerada.referencia}</p>
                <p><strong>Data:</strong> {new Date(notaGerada.data).toLocaleString("pt-BR")}</p>
              </div>
            </div>
            <div className="tabela-responsiva">
              <table className="tabela-admin">
                <thead>
                  <tr><th>Produto</th><th>Saldo atual</th><th>Estoque mínimo</th><th>Quantidade ideal</th><th>Quantidade a repor</th></tr>
                </thead>
                <tbody>
                  {notaGerada.itens.map((item) => (
                    <tr key={item.produto}>
                      <td>{item.produto}</td>
                      <td>{item.quantidadeAtual}</td>
                      <td>{item.quantidadeMinima}</td>
                      <td>{item.quantidadeIdeal ?? QUANTIDADE_IDEAL_PADRAO}</td>
                      <td>{Math.max(0, (item.quantidadeIdeal ?? QUANTIDADE_IDEAL_PADRAO) - item.quantidadeAtual)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="nota-rodape">Esta nota foi salva após a confirmação final. O envio pelo WhatsApp ainda precisa ser confirmado no aplicativo.</p>
            <div className="nota-acoes">
              <Botao type="button" onClick={() => baixarNotaReposicao(notaGerada)}>Baixar nota</Botao>
              <Botao type="button" variante="secundario" onClick={() => window.print()}>Imprimir ou salvar como PDF</Botao>
              <Botao type="button" variante="secundario" onClick={() => abrirNotaNoWhatsApp(notaGerada)}>Enviar pelo WhatsApp</Botao>
              <Botao type="button" variante="secundario" onClick={() => setNotaGerada(null)}>Fechar nota</Botao>
            </div>
          </section>
        )}

        {/* Configuração de quantidade mínima e quantidade ideal por produto. */}
        <section className="secao-admin">
          <h2>Estoque mínimo e quantidade ideal por produto</h2>
          <p className="descricao">
            O estoque mínimo identifica produtos em falta. A quantidade ideal é o nível desejado após reposição e, por padrão, é 50 unidades. A nota calcula quantidade a repor como quantidade ideal menos estoque atual.
          </p>
          <label className="rotulo-pesquisa" htmlFor="busca-minimo-produto">Pesquisar produto pelo nome</label>
          <input
            id="busca-minimo-produto"
            className="campo"
            type="search"
            placeholder="Digite o nome do produto"
            value={buscaMinimo}
            onChange={(e) => setBuscaMinimo(e.target.value)}
          />

          {produtosOrdenados.length === 0 ? (
            <p>Nenhum produto cadastrado no estoque para configurar.</p>
          ) : (
            <div className="tabela-responsiva">
              <table className="tabela-admin">
                <thead>
                  <tr><th>Produto / QR Code</th><th>Estoque atual</th><th>Estoque mínimo</th><th>Quantidade ideal</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  {produtosOrdenados.map(([produto, quantidade]) => {
                    const minimoAtual = quantidadesMinimas[produto] ?? ESTOQUE_MINIMO;
                    const idealAtual = quantidadesIdeais[produto] ?? QUANTIDADE_IDEAL_PADRAO;
                    const idSeguro = encodeURIComponent(produto);
                    return (
                      <tr key={produto}>
                        <td className="codigo-produto">{produto}</td>
                        <td>{quantidade}</td>
                        <td>
                          <label className="somente-leitor" htmlFor={`minimo-${idSeguro}`}>Estoque mínimo para {produto}</label>
                          <input
                            id={`minimo-${idSeguro}`}
                            className="campo campo-minimo"
                            type="number"
                            min="0"
                            step="1"
                            value={minimosEditados[produto] ?? String(minimoAtual)}
                            onChange={(e) => setMinimosEditados((atuais) => ({ ...atuais, [produto]: e.target.value }))}
                          />
                        </td>
                        <td>
                          <label className="somente-leitor" htmlFor={`ideal-${idSeguro}`}>Quantidade ideal para {produto}</label>
                          <input
                            id={`ideal-${idSeguro}`}
                            className="campo campo-minimo"
                            type="number"
                            min="0"
                            step="1"
                            value={ideaisEditados[produto] ?? String(idealAtual)}
                            onChange={(e) => setIdeaisEditados((atuais) => ({ ...atuais, [produto]: e.target.value }))}
                          />
                        </td>
                        <td>
                          <div className="acoes-config-produto">
                            <Botao type="button" onClick={() => salvarMinimoProduto(produto)}>Salvar mínimo</Botao>
                            {feedbackMinimo?.produto === produto && (
                              <p className={feedbackMinimo.erro ? "mensagem-erro mensagem-minimo" : "mensagem-sucesso mensagem-minimo"} role="status">{feedbackMinimo.mensagem}</p>
                            )}
                            <Botao type="button" variante="secundario" onClick={() => salvarIdealProduto(produto)}>Salvar ideal</Botao>
                            {feedbackIdeal?.produto === produto && (
                              <p className={feedbackIdeal.erro ? "mensagem-erro mensagem-minimo" : "mensagem-sucesso mensagem-minimo"} role="status">{feedbackIdeal.mensagem}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Confirmação final: somente o botão abaixo cria e salva a nota. */}
        {itensNotaPendente && (
          <div className="modal-overlay">
            <section className="modal-conteudo modal-nota-confirmacao" role="dialog" aria-modal="true" aria-labelledby="titulo-confirmar-nota">
              <h2 id="titulo-confirmar-nota">Confirmar nota de reposição</h2>
              <p>
                A nota ainda não foi gerada nem salva. Confira todos os produtos abaixo do estoque mínimo e as quantidades sugeridas. Ao confirmar, uma única nota será criada com todos estes itens.
              </p>
              <div className="tabela-responsiva">
                <table className="tabela-admin">
                  <thead><tr><th>Produto</th><th>Saldo atual</th><th>Quantidade ideal</th><th>Quantidade a repor</th></tr></thead>
                  <tbody>
                    {itensNotaPendente.map((item) => (
                      <tr key={item.produto}>
                        <td>{item.produto}</td>
                        <td>{item.quantidadeAtual}</td>
                        <td>{item.quantidadeIdeal}</td>
                        <td>{Math.max(0, item.quantidadeIdeal - item.quantidadeAtual)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="nota-acoes">
                <Botao type="button" onClick={confirmarGeracaoNota}>Confirmar e gerar nota</Botao>
                <Botao type="button" variante="secundario" onClick={() => setItensNotaPendente(null)}>Cancelar</Botao>
              </div>
            </section>
          </div>
        )}

        <section className="secao-admin">
          <h2>Histórico de notas de reposição</h2>
          <p className="descricao">
            As notas são salvas somente após a confirmação final da retirada ou após a confirmação explícita do administrador. Notas anteriores continuam no histórico.
          </p>
          {notasReposicao.length === 0 ? (
            <p>Nenhuma nota de reposição confirmada até o momento.</p>
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
                        {nota.origem === "automatica" ? "Após retirada confirmada" : "Administrativa confirmada"}
                      </span>
                    </summary>
                    <div className="tabela-responsiva">
                      <table className="tabela-admin">
                        <thead><tr><th>Produto</th><th>Saldo atual</th><th>Estoque mínimo</th><th>Quantidade ideal</th><th>Quantidade a repor</th></tr></thead>
                        <tbody>
                          {nota.itens.map((item) => (
                            <tr key={item.produto}>
                              <td>{item.produto}</td>
                              <td>{item.quantidadeAtual}</td>
                              <td>{item.quantidadeMinima}</td>
                              <td>{item.quantidadeIdeal ?? QUANTIDADE_IDEAL_PADRAO}</td>
                              <td>{Math.max(0, (item.quantidadeIdeal ?? QUANTIDADE_IDEAL_PADRAO) - item.quantidadeAtual)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="nota-acoes">
                      <Botao type="button" onClick={() => baixarNotaReposicao(nota)}>Baixar nota</Botao>
                      <Botao type="button" variante="secundario" onClick={() => selecionarNotaParaVisualizar(nota)}>Visualizar / imprimir</Botao>
                      <Botao type="button" variante="secundario" onClick={() => abrirNotaNoWhatsApp(nota)}>Enviar pelo WhatsApp</Botao>
                    </div>
                  </details>
                ))}
              </div>
              {totalPaginasNotas > 1 && (
                <nav className="paginacao" aria-label="Paginação das notas de reposição">
                  <Botao variante="secundario" type="button" disabled={paginaNotasValida <= 1} onClick={() => setPaginaNotas((pagina) => Math.max(1, pagina - 1))}>Anterior</Botao>
                  <span aria-live="polite">Página {paginaNotasValida} de {totalPaginasNotas} · {notasReposicao.length} nota(s)</span>
                  <Botao variante="secundario" type="button" disabled={paginaNotasValida >= totalPaginasNotas} onClick={() => setPaginaNotas((pagina) => Math.min(totalPaginasNotas, pagina + 1))}>Próxima</Botao>
                </nav>
              )}
            </>
          )}
        </section>

        <section className="secao-admin">
          <h2>Cadastrar funcionário</h2>
          <p className="descricao">O funcionário cadastrado poderá entrar no sistema e registrar entradas e retiradas de produtos.</p>
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
            {erro && !funcionarioEditando && <p className="mensagem-erro" role="alert">{erro}</p>}
            {mensagem && <p className="mensagem-sucesso" role="status">{mensagem}</p>}
            <Botao type="submit">Cadastrar funcionário</Botao>
          </form>

          <h3>Funcionários cadastrados</h3>
          {funcionarios.length === 0 ? (
            <p>Nenhum funcionário cadastrado.</p>
          ) : (
            <div className="tabela-responsiva">
              <table className="tabela-admin">
                <thead><tr><th>Nome</th><th>Usuário</th><th>Perfil</th><th>Editar</th><th>Excluir</th></tr></thead>
                <tbody>
                  {funcionarios.map((f) => (
                    <tr key={f.id}>
                      <td>{f.nome}</td><td>{f.usuario}</td><td>Funcionário</td>
                      <td><Botao type="button" variante="secundario" onClick={() => editarFuncionario(f)}>Editar</Botao></td>
                      <td><Botao type="button" variante="secundario" onClick={() => setConfirmarExclusao(f)}>Excluir</Botao></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {funcionarioEditando && (
          <div className="modal-overlay">
            <section className="modal-conteudo" role="dialog" aria-modal="true" aria-labelledby="titulo-editar-funcionario">
              <h2 id="titulo-editar-funcionario">Editar funcionário</h2>
              <form className="formulario-admin" onSubmit={confirmarEdicaoFuncionario}>
                <label>Nome completo<input className="campo" value={edicaoNome} onChange={(e) => setEdicaoNome(e.target.value)} required /></label>
                <label>Usuário<input className="campo" value={edicaoUsuario} onChange={(e) => setEdicaoUsuario(e.target.value)} required /></label>
                <label>Nova senha (opcional)<input className="campo" type="password" value={edicaoSenha} onChange={(e) => setEdicaoSenha(e.target.value)} placeholder="Deixe vazio para manter" /></label>
                {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
                <div className="nota-acoes">
                  <Botao type="submit">Salvar alterações</Botao>
                  <Botao type="button" variante="secundario" onClick={() => { setFuncionarioEditando(null); setErro(""); }}>Cancelar</Botao>
                </div>
              </form>
            </section>
          </div>
        )}

        {confirmarExclusao && (
          <div className="modal-overlay">
            <section className="modal-conteudo" role="alertdialog" aria-modal="true" aria-labelledby="titulo-excluir-funcionario">
              <h2 id="titulo-excluir-funcionario">Confirmar exclusão</h2>
              <p>Tem certeza de que deseja excluir o funcionário <strong>{confirmarExclusao.nome}</strong>? Esta ação não pode ser desfeita.</p>
              <div className="nota-acoes">
                <Botao type="button" onClick={confirmarExclusaoFuncionario}>Sim, excluir</Botao>
                <Botao type="button" variante="secundario" onClick={() => setConfirmarExclusao(null)}>Cancelar</Botao>
              </div>
            </section>
          </div>
        )}

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
                      <td><span className={registro.operacao === "inserir" ? "etiqueta-entrada" : "etiqueta-retirada"}>{registro.operacao === "inserir" ? "Entrada" : "Retirada"}</span></td>
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
