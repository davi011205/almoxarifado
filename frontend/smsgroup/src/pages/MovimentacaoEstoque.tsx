
import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import Header from "../components/layout/Header/Header";
import Botao from "../components/ui/Botao";
import CampoFormulario from "../components/ui/CampoFormulario";
import LeitorQR from "../components/ui/LeitorQR";
import ModalAlertaEstoque, { type ItemAlertaEstoque } from "../components/ui/ModalAlerta/ModalAlertaEstoque";
import { registrarMovimento } from "../services/estoqueService";
import { ESTOQUE_MINIMO } from "../constants/estoque";
import {
  abrirNotaNoWhatsApp,
  criarNotaReposicao,
  obterQuantidadeIdeal,
  obterQuantidadeMinima,
} from "../services/reposicaoService";
import type { MovimentacaoEstoqueProps } from "../types";
import { salvarMovimentacao } from "../services/movimentacoesService";

type MetodoSelecao = "escolher" | "qr" | "nome";

interface ItemCarrinho {
  produto: string;
  quantidade: number;
}

/** Reutiliza a chave já cadastrada, mesmo que o usuário varie maiúsculas/minúsculas. */
function obterIdentificadorProduto(
  texto: string,
  estoque: Record<string, number>,
  carrinho: ItemCarrinho[]
): string {
  const nome = texto.trim();
  const nomeNormalizado = nome.toLocaleLowerCase("pt-BR");

  return (
    Object.keys(estoque).find(
      (produto) => produto.toLocaleLowerCase("pt-BR") === nomeNormalizado
    ) ??
    carrinho.find(
      (item) => item.produto.toLocaleLowerCase("pt-BR") === nomeNormalizado
    )?.produto ??
    nome
  );
}

export default function MovimentacaoEstoque({
  operacao,
  estoque,
  funcionario,
  onSair,
  onVoltar,
  onAtualizarEstoque,
}: MovimentacaoEstoqueProps) {
  const [produtoQR, setProdutoQR] = useState("");
  const [nomeDigitado, setNomeDigitado] = useState("");
  const [metodoSelecao, setMetodoSelecao] = useState<MetodoSelecao>("escolher");
  const [quantidade, setQuantidade] = useState("1");
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("");
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [revisaoAberta, setRevisaoAberta] = useState(false);
  const [itensAlerta, setItensAlerta] = useState<ItemAlertaEstoque[]>([]);

  const selecionarProduto = useCallback(
    (texto: string) => {
      const produto = obterIdentificadorProduto(texto, estoque, carrinho);
      setProdutoQR(produto);
      setNomeDigitado(produto);
      setMensagem("");
      setTipoMensagem("");
    },
    [estoque, carrinho]
  );

  function confirmarNomeProduto(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!nomeDigitado.trim()) {
      setMensagem("Digite o nome do produto para continuar.");
      setTipoMensagem("erro");
      return;
    }

    selecionarProduto(nomeDigitado);
  }

  function adicionarAoCarrinho(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMensagem("");
    setTipoMensagem("");

    const produtoId = produtoQR.trim();
    const qtd = Number(quantidade);

    if (!produtoId) {
      setMensagem("Selecione um produto antes de adicioná-lo.");
      setTipoMensagem("erro");
      return;
    }

    if (!Number.isInteger(qtd) || qtd <= 0) {
      setMensagem("Informe uma quantidade inteira maior que zero.");
      setTipoMensagem("erro");
      return;
    }

    const jaNoCarrinho = carrinho.find((item) => item.produto === produtoId);
    const quantidadeAcumulada = (jaNoCarrinho?.quantidade ?? 0) + qtd;
    const estoqueDisponivel = estoque[produtoId] ?? 0;

    if (operacao === "retirar" && quantidadeAcumulada > estoqueDisponivel) {
      setMensagem(
        `Quantidade indisponível. Você já adicionou ${jaNoCarrinho?.quantidade ?? 0} unidade(s) deste produto ao carrinho e o saldo atual é ${estoqueDisponivel}.`
      );
      setTipoMensagem("erro");
      return;
    }

    setCarrinho((itens) => {
      const existente = itens.find((item) => item.produto === produtoId);
      if (existente) {
        return itens.map((item) =>
          item.produto === produtoId
            ? { ...item, quantidade: item.quantidade + qtd }
            : item
        );
      }
      return [...itens, { produto: produtoId, quantidade: qtd }];
    });

    setMensagem(`${produtoId} foi adicionado ao carrinho.`);
    setTipoMensagem("sucesso");
    setProdutoQR("");
    setNomeDigitado("");
    setMetodoSelecao("escolher");
    setQuantidade("1");
  }

  function alterarQuantidadeCarrinho(produto: string, texto: string) {
    const novaQuantidade = Number(texto);
    if (texto.trim() === "" || !Number.isInteger(novaQuantidade) || novaQuantidade <= 0) {
      return;
    }

    if (
      operacao === "retirar" &&
      novaQuantidade > (estoque[produto] ?? 0)
    ) {
      setMensagem(
        `A quantidade de ${produto} não pode exceder o saldo disponível de ${estoque[produto] ?? 0}.`
      );
      setTipoMensagem("erro");
      return;
    }

    setCarrinho((itens) =>
      itens.map((item) =>
        item.produto === produto ? { ...item, quantidade: novaQuantidade } : item
      )
    );
    setMensagem("");
    setTipoMensagem("");
  }

  function removerDoCarrinho(produto: string) {
    setCarrinho((itens) => itens.filter((item) => item.produto !== produto));
    setMensagem("");
    setTipoMensagem("");
  }

  function abrirRevisaoFinal() {
    if (carrinho.length === 0) {
      setMensagem("Adicione pelo menos um produto ao carrinho antes de confirmar.");
      setTipoMensagem("erro");
      return;
    }
    setMensagem("");
    setTipoMensagem("");
    setRevisaoAberta(true);
  }

  function confirmarMovimentacaoFinal() {
    try {
      // Calcula todo o novo estoque primeiro. Nenhuma alteração é persistida
      // até validar todos os produtos do carrinho.
      let novoEstoque = { ...estoque };
      const alertas: ItemAlertaEstoque[] = [];

      for (const item of carrinho) {
        novoEstoque = registrarMovimento({
          estoque: novoEstoque,
          produtoId: item.produto,
          quantidade: item.quantidade,
          operacao,
        });

        if (operacao === "retirar") {
          const quantidadeFinal = novoEstoque[item.produto] ?? 0;
          const minimo = obterQuantidadeMinima(item.produto);
          if (quantidadeFinal <= minimo) {
            alertas.push({
              produto: item.produto,
              quantidade: quantidadeFinal,
              minimo,
            });
          }
        }
      }

      // Só após validar todos os itens atualizamos estoque e histórico.
      onAtualizarEstoque(novoEstoque);
      const dataMovimento = new Date().toISOString();
      for (const item of carrinho) {
        salvarMovimentacao({
          produto: item.produto,
          quantidade: item.quantidade,
          operacao,
          funcionarioId: funcionario.id,
          funcionarioNome: funcionario.nome,
          data: dataMovimento,
        });
      }

      const totalUnidades = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
      let complementoNota = "";

      // A nota só é criada no clique de confirmação final. Caso uma retirada
      // deixe um dos produtos movimentados abaixo do mínimo, a nota inclui
      // todos os produtos que estão abaixo do mínimo no estoque atualizado.
      const produtoRetiradoFicouAbaixo = operacao === "retirar" && carrinho.some((item) => {
        const saldoFinal = novoEstoque[item.produto] ?? 0;
        return saldoFinal < obterQuantidadeMinima(item.produto);
      });

      if (produtoRetiradoFicouAbaixo) {
        const itensEmFalta = Object.entries(novoEstoque)
          .map(([produto, quantidadeAtual]) => {
            const quantidadeMinima = obterQuantidadeMinima(produto);
            const quantidadeIdeal = obterQuantidadeIdeal(produto);
            return {
              produto,
              quantidadeAtual,
              quantidadeMinima,
              quantidadeIdeal,
              quantidadeRepor: Math.max(0, quantidadeIdeal - quantidadeAtual),
            };
          })
          .filter((item) => item.quantidadeAtual < item.quantidadeMinima);

        if (itensEmFalta.length > 0) {
          try {
            const nota = criarNotaReposicao(itensEmFalta, "automatica");
            abrirNotaNoWhatsApp(nota);
            complementoNota = ` Foi gerada a nota ${nota.referencia} com todos os produtos abaixo do mínimo e o WhatsApp foi aberto para conferir o envio.`;
          } catch {
            complementoNota = " A movimentação foi registrada, mas não foi possível gerar a nota de reposição.";
          }
        }
      }

      setMensagem(
        `${operacao === "inserir" ? "Entrada" : "Retirada"} confirmada! ` +
          `${carrinho.length} produto(s), total de ${totalUnidades} unidade(s), registrado(s) por ${funcionario.nome}.` +
          complementoNota
      );
      setTipoMensagem("sucesso");
      setCarrinho([]);
      setProdutoQR("");
      setNomeDigitado("");
      setMetodoSelecao("escolher");
      setQuantidade("1");
      setRevisaoAberta(false);
      setItensAlerta(alertas);
    } catch (e: unknown) {
      const mensagemErro = e instanceof Error
        ? e.message
        : "Ocorreu um erro inesperado ao registrar a movimentação.";
      setMensagem(mensagemErro);
      setTipoMensagem("erro");
    }
  }

  function cancelarRevisao() {
    setRevisaoAberta(false);
  }

  const estoqueAtual = estoque[produtoQR.trim()] ?? 0;
  const quantidadeMinimaProduto = produtoQR
    ? obterQuantidadeMinima(produtoQR)
    : ESTOQUE_MINIMO;
  const tituloOperacao = operacao === "inserir" ? "Inserir produto" : "Retirar produto";
  const quantidadeTotalCarrinho = carrinho.reduce((soma, item) => soma + item.quantidade, 0);

  function selecionarOutroProdutoSeguro() {
    setProdutoQR("");
    setNomeDigitado("");
    setMetodoSelecao("escolher");
    setQuantidade("1");
    setMensagem("");
    setTipoMensagem("");
  }

  return (
    <main className="pagina">
      <Header onSair={onSair} />

      {!produtoQR ? (
        <>
          {metodoSelecao === "escolher" && (
            <section className="painel">
              <h2>{tituloOperacao}</h2>
              <p className="descricao">
                Adicione todos os produtos e respectivas quantidades ao carrinho. O estoque só será alterado após a revisão e confirmação final.
              </p>

              <div className="opcoes-selecao">
                <Botao
                  type="button"
                  className="botao-largo"
                  onClick={() => {
                    setMensagem("");
                    setTipoMensagem("");
                    setMetodoSelecao("qr");
                  }}
                >
                  📷 Ler QR Code
                </Botao>

                <Botao
                  type="button"
                  variante="secundario"
                  className="botao-largo"
                  onClick={() => {
                    setMensagem("");
                    setTipoMensagem("");
                    setMetodoSelecao("nome");
                  }}
                >
                  Digitar nome do produto
                </Botao>
              </div>

              <Botao variante="secundario" onClick={onVoltar}>
                ← Voltar ao painel
              </Botao>
            </section>
          )}

          {metodoSelecao === "qr" && (
            <LeitorQR
              aoLer={selecionarProduto}
              aoFechar={() => setMetodoSelecao("escolher")}
            />
          )}

          {metodoSelecao === "nome" && (
            <section className="painel">
              <h2>{tituloOperacao}</h2>
              <p className="descricao">
                Digite o nome do produto ou escolha um produto existente no estoque.
              </p>

              <form onSubmit={confirmarNomeProduto}>
                <CampoFormulario
                  id="nome-produto"
                  label="Nome do produto"
                  type="text"
                  autoComplete="off"
                  list="produtos-existentes"
                  placeholder="Ex.: Parafuso sextavado"
                  value={nomeDigitado}
                  onChange={(e) => setNomeDigitado(e.target.value)}
                  required
                  autoFocus
                />

                <datalist id="produtos-existentes">
                  {Object.keys(estoque)
                    .sort((a, b) => a.localeCompare(b, "pt-BR"))
                    .map((produto) => (
                      <option key={produto} value={produto} />
                    ))}
                </datalist>

                <p className="dica-campo">
                  Para atualizar um produto existente, selecione o nome sugerido.
                </p>

                <Botao type="submit" className="botao-largo">
                  Selecionar produto
                </Botao>
              </form>

              <Botao
                type="button"
                variante="secundario"
                onClick={() => setMetodoSelecao("escolher")}
              >
                ← Escolher outra opção
              </Botao>
            </section>
          )}
        </>
      ) : (
        <section className="painel">
          <h2>{tituloOperacao}</h2>
          <p className="descricao">
            Produto selecionado. Informe a quantidade e adicione-o ao carrinho. A movimentação ainda não será registrada.
          </p>

          <div className="resumo-produto">
            <strong>Produto:</strong>
            <p className="codigo-produto">{produtoQR}</p>

            <strong>Estoque atual:</strong>
            <p className={estoqueAtual <= quantidadeMinimaProduto ? "quantidade-estoque baixa" : "quantidade-estoque"}>
              {estoqueAtual} unidade(s)
            </p>
            <strong>Estoque mínimo:</strong>
            <p className="quantidade-estoque">{quantidadeMinimaProduto} unidade(s)</p>
            {operacao === "retirar" && (
              <>
                <strong>Disponível para retirada:</strong>
                <p>{Math.max(0, estoqueAtual - (carrinho.find((item) => item.produto === produtoQR)?.quantidade ?? 0))} unidade(s)</p>
              </>
            )}
          </div>

          <form onSubmit={adicionarAoCarrinho}>
            <CampoFormulario
              id="quantidade"
              label="Quantidade"
              type="number"
              min="1"
              step="1"
              required
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />

            <Botao type="submit" className="botao-largo">
              Adicionar ao carrinho
            </Botao>
          </form>

          <Botao
            variante="secundario"
            onClick={() => {
              setProdutoQR("");
              setNomeDigitado("");
              setMetodoSelecao("escolher");
              setQuantidade("1");
              setMensagem("");
              setTipoMensagem("");
            }}
          >
            ← Selecionar outro produto
          </Botao>
        </section>
      )}

      {mensagem && (
        <div className="painel">
          <p role={tipoMensagem === "erro" ? "alert" : "status"} className={tipoMensagem === "erro" ? "mensagem-erro" : "mensagem-sucesso"}>
            {mensagem}
          </p>
        </div>
      )}

      {carrinho.length > 0 && (
        <section className="painel carrinho-movimentacao">
          <div className="carrinho-cabecalho">
            <div>
              <p className="descricao">Etapa 2 · Revise os produtos</p>
              <h2>Carrinho de {operacao === "inserir" ? "entrada" : "retirada"}</h2>
            </div>
            <span className="carrinho-contador">{carrinho.length} produto(s)</span>
          </div>

          <div className="tabela-responsiva">
            <table className="tabela-admin">
              <thead>
                <tr><th>Produto</th><th>Estoque atual</th><th>Quantidade</th><th>Remover</th></tr>
              </thead>
              <tbody>
                {carrinho.map((item) => (
                  <tr key={item.produto}>
                    <td className="codigo-produto">{item.produto}</td>
                    <td>{estoque[item.produto] ?? 0}</td>
                    <td>
                      <label className="somente-leitor" htmlFor={`carrinho-qtd-${encodeURIComponent(item.produto)}`}>
                        Quantidade de {item.produto}
                      </label>
                      <input
                        id={`carrinho-qtd-${encodeURIComponent(item.produto)}`}
                        className="campo campo-quantidade-carrinho"
                        type="number"
                        min="1"
                        max={operacao === "retirar" ? (estoque[item.produto] ?? 0) : undefined}
                        step="1"
                        value={item.quantidade}
                        onChange={(e) => alterarQuantidadeCarrinho(item.produto, e.target.value)}
                      />
                    </td>
                    <td>
                      <Botao type="button" variante="secundario" onClick={() => removerDoCarrinho(item.produto)}>
                        Remover
                      </Botao>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="carrinho-resumo">
            <strong>Total de unidades: {quantidadeTotalCarrinho}</strong>
            <p className="descricao">O saldo e o histórico só serão atualizados depois da confirmação final.</p>
          </div>

          <div className="nota-acoes">
            <Botao type="button" variante="secundario" onClick={selecionarOutroProdutoSeguro}>
              Adicionar mais produtos
            </Botao>
            <Botao type="button" onClick={abrirRevisaoFinal}>
              Revisar e confirmar movimentação
            </Botao>
            <Botao type="button" variante="secundario" onClick={() => { setCarrinho([]); setMensagem("Carrinho esvaziado."); setTipoMensagem("sucesso"); }}>
              Esvaziar carrinho
            </Botao>
          </div>
        </section>
      )}

      {revisaoAberta && (
        <div className="modal-overlay">
          <section className="modal-conteudo modal-revisao-carrinho" role="dialog" aria-modal="true" aria-labelledby="titulo-revisao-movimento">
            <p className="descricao">Última etapa</p>
            <h2 id="titulo-revisao-movimento">Confirmar {operacao === "inserir" ? "entrada" : "retirada"} de produtos?</h2>
            <p>Confira os itens abaixo. Depois de confirmar, o estoque e o histórico serão atualizados.</p>
            <div className="tabela-responsiva">
              <table className="tabela-admin">
                <thead><tr><th>Produto</th><th>Quantidade</th><th>Saldo após movimentação</th></tr></thead>
                <tbody>
                  {carrinho.map((item) => {
                    const atual = estoque[item.produto] ?? 0;
                    const final = operacao === "inserir" ? atual + item.quantidade : atual - item.quantidade;
                    return <tr key={item.produto}><td>{item.produto}</td><td>{item.quantidade}</td><td>{final}</td></tr>;
                  })}
                </tbody>
              </table>
            </div>
            <p><strong>Responsável:</strong> {funcionario.nome}</p>
            <p className="descricao">Se a retirada deixar produtos abaixo do estoque mínimo, uma nota com todos os itens em falta será preparada somente após esta confirmação final.</p>
            <div className="nota-acoes">
              <Botao type="button" onClick={confirmarMovimentacaoFinal}>
                Confirmar {operacao === "inserir" ? "entrada" : "retirada"}
              </Botao>
              <Botao type="button" variante="secundario" onClick={cancelarRevisao}>
                Voltar e editar carrinho
              </Botao>
            </div>
          </section>
        </div>
      )}

      {itensAlerta.length > 0 && (
        <ModalAlertaEstoque
          itens={itensAlerta}
          onFechar={() => setItensAlerta([])}
        />
      )}
    </main>
  );
}
