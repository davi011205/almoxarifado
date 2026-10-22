import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import Header from "../components/layout/Header/Header";
import Botao from "../components/ui/Botao";
import CampoFormulario from "../components/ui/CampoFormulario";
import LeitorQR from "../components/ui/LeitorQR";
import ModalAlertaEstoque from "../components/ui/ModalAlerta/ModalAlertaEstoque";
import { registrarMovimento } from "../services/estoqueService";
import { ESTOQUE_MINIMO } from "../constants/estoque";
import {
  abrirNotaNoWhatsApp,
  criarNotaReposicao,
  obterQuantidadeMinima,
} from "../services/reposicaoService";
import type { MovimentacaoEstoqueProps } from "../types";
import { salvarMovimentacao } from "../services/movimentacoesService";

type MetodoSelecao = "escolher" | "qr" | "nome";

/** Reutiliza a chave já cadastrada, mesmo que o usuário varie maiúsculas/minúsculas. */
function obterIdentificadorProduto(
  texto: string,
  estoque: Record<string, number>
): string {
  const nome = texto.trim();
  const nomeNormalizado = nome.toLocaleLowerCase("pt-BR");

  return (
    Object.keys(estoque).find(
      (produto) => produto.toLocaleLowerCase("pt-BR") === nomeNormalizado
    ) ?? nome
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
  const [quantidadeAlerta, setQuantidadeAlerta] = useState<number | null>(null);
  const [minimoAlerta, setMinimoAlerta] = useState(ESTOQUE_MINIMO);

  const selecionarProduto = useCallback(
    (texto: string) => {
      const produto = obterIdentificadorProduto(texto, estoque);
      setProdutoQR(produto);
      setNomeDigitado(produto);
      setMensagem("");
      setTipoMensagem("");
      setQuantidadeAlerta(null);
    },
    [estoque]
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

  function confirmarMovimento(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const produtoId = produtoQR.trim();
      const novoEstoque = registrarMovimento({
        estoque,
        produtoId,
        quantidade,
        operacao,
      });

      const novoTotal = novoEstoque[produtoId] ?? 0;
      const quantidadeAnterior = estoque[produtoId] ?? 0;
      const produtoJaExistia = Object.prototype.hasOwnProperty.call(estoque, produtoId);
      const quantidadeMinima = obterQuantidadeMinima(produtoId);

      // Registra a movimentação e o funcionário responsável.
      salvarMovimentacao({
        produto: produtoId,
        quantidade: Number(quantidade),
        operacao,
        funcionarioId: funcionario.id,
        funcionarioNome: funcionario.nome,
        data: new Date().toISOString(),
      });

      // Persiste o saldo atualizado. Depois de uma operação bem-sucedida,
      // zera-se o campo para evitar uma segunda operação acidental.
      onAtualizarEstoque(novoEstoque);
      setQuantidade("0");

      let notaAutomaticaCriada = false;
      let falhaAoGerarNota = false;
      const atingiuMinimo = novoTotal <= quantidadeMinima &&
        (quantidadeAnterior > quantidadeMinima || !produtoJaExistia);

      if (atingiuMinimo) {
        try {
          const nota = criarNotaReposicao([
            {
              produto: produtoId,
              quantidadeAtual: novoTotal,
              quantidadeMinima,
              quantidadeRepor: Math.max(1, quantidadeMinima - novoTotal),
            },
          ], "automatica");
          abrirNotaNoWhatsApp(nota);
          notaAutomaticaCriada = true;
        } catch {
          // A movimentação já foi persistida; não a desfazemos se a geração da nota falhar.
          falhaAoGerarNota = true;
        }
      }

      const mensagemBase =
        `${operacao === "inserir" ? "Entrada" : "Saída"} registrada! ` +
        `Produto ${produtoId}: ${novoTotal} unidade(s) em estoque.`;
      const mensagemNota = notaAutomaticaCriada
        ? " Uma nota de reposição foi salva e a abertura do WhatsApp foi solicitada com a mensagem preenchida; confirme o envio no aplicativo."
        : falhaAoGerarNota
          ? " A movimentação foi registrada, mas não foi possível salvar/abrir a nota de reposição."
          : "";
      setMensagem(mensagemBase + mensagemNota);
      setTipoMensagem("sucesso");

      if (operacao === "retirar" && novoTotal <= quantidadeMinima) {
        setQuantidadeAlerta(novoTotal);
        setMinimoAlerta(quantidadeMinima);
      } else {
        setQuantidadeAlerta(null);
      }
    } catch (e: unknown) {
      const mensagemErro = e instanceof Error
        ? e.message
        : "Ocorreu um erro inesperado ao registrar a movimentação.";

      setMensagem(mensagemErro);
      setTipoMensagem("erro");
      setQuantidadeAlerta(null);
    }
  }

  function selecionarOutroProduto() {
    setProdutoQR("");
    setNomeDigitado("");
    setMetodoSelecao("escolher");
    setMensagem("");
    setTipoMensagem("");
    setQuantidade("1");
    setQuantidadeAlerta(null);
  }

  const estoqueAtual = estoque[produtoQR.trim()] ?? 0;
  const quantidadeMinimaProduto = produtoQR
    ? obterQuantidadeMinima(produtoQR)
    : ESTOQUE_MINIMO;
  const tituloOperacao = operacao === "inserir" ? "Inserir produto" : "Retirar produto";

  return (
    <main className="pagina">
      <Header onSair={onSair} />

      {!produtoQR ? (
        <>
          {metodoSelecao === "escolher" && (
            <section className="painel">
              <h2>{tituloOperacao}</h2>
              <p className="descricao">
                Como deseja identificar o produto?
              </p>

              <div className="opcoes-selecao">
                <Botao
                  type="button"
                  className="botao-largo"
                  onClick={() => setMetodoSelecao("qr")}
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
                Digite o nome do produto. Você também pode escolher um nome já
                utilizado no estoque.
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
                  Para atualizar um produto existente, selecione o nome sugerido
                  e evite criar outra versão do mesmo nome.
                </p>

                {mensagem && (
                  <p role="alert" className="mensagem-erro">
                    {mensagem}
                  </p>
                )}

                <Botao type="submit" className="botao-largo">
                  Continuar
                </Botao>
              </form>

              <Botao
                type="button"
                variante="secundario"
                onClick={() => {
                  setMensagem("");
                  setTipoMensagem("");
                  setMetodoSelecao("escolher");
                }}
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
            Produto selecionado. Confira o nome e informe a quantidade.
          </p>

          <div className="resumo-produto">
            <strong>Produto:</strong>
            <p className="codigo-produto">{produtoQR}</p>

            <strong>Estoque atual:</strong>
            <p
              className={
                estoqueAtual <= quantidadeMinimaProduto
                  ? "quantidade-estoque baixa"
                  : "quantidade-estoque"
              }
            >
              {estoqueAtual} unidade(s)
            </p>
            <strong>Quantidade mínima:</strong>
            <p className="quantidade-estoque">{quantidadeMinimaProduto} unidade(s)</p>
          </div>

          <form onSubmit={confirmarMovimento}>
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
              Confirmar {operacao === "inserir" ? "entrada" : "retirada"}
            </Botao>
          </form>

          {mensagem && (
            <p
              role="status"
              className={
                tipoMensagem === "erro"
                  ? "mensagem-erro"
                  : "mensagem-sucesso"
              }
            >
              {mensagem}
            </p>
          )}

          <div className="grupo-botoes">
            <Botao variante="secundario" onClick={selecionarOutroProduto}>
              Selecionar outro produto
            </Botao>

            <Botao variante="secundario" onClick={onVoltar}>
              Voltar ao painel
            </Botao>
          </div>
        </section>
      )}

      {quantidadeAlerta !== null && (
        <ModalAlertaEstoque
          quantidade={quantidadeAlerta}
          minimo={minimoAlerta}
          onFechar={() => setQuantidadeAlerta(null)}
        />
      )}
    </main>
  );
}
