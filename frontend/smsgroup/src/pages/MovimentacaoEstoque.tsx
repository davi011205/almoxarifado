
import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import Header from "../components/layout/Header/Header";
import Botao from "../components/ui/Botao";
import CampoFormulario from "../components/ui/CampoFormulario";
import LeitorQR from "../components/ui/LeitorQR";
import ModalAlertaEstoque from "../components/ui/ModalAlerta/ModalAlertaEstoque";
import { registrarMovimento } from "../services/estoqueService";
import { ESTOQUE_MINIMO } from "../constants/estoque";
import type { MovimentacaoEstoqueProps } from "../types";
import { salvarMovimentacao } from "../services/movimentacoesService";

export default function MovimentacaoEstoque({
  operacao,
  estoque,
  funcionario,
  onSair,
  onVoltar,
  onAtualizarEstoque,
}: MovimentacaoEstoqueProps) {
  const [produtoQR, setProdutoQR] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("");
  const [quantidadeAlerta, setQuantidadeAlerta] = useState<number | null > (null);

  const aoLer = useCallback((texto: string) => {
    setProdutoQR(texto);
    setMensagem("");
    setTipoMensagem("");
    setQuantidadeAlerta(null);
  }, []);

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
      // Registra a movimentação e o funcionário responsável.
      salvarMovimentacao({
        produto: produtoId,
        quantidade: Number(quantidade),
        operacao,
        funcionarioId: funcionario.id,
        funcionarioNome: funcionario.nome,
        data: new Date().toISOString(),
      });

      // Persiste o saldo atualizado.
      onAtualizarEstoque(novoEstoque);

      setMensagem(
        `${operacao === "inserir" ? "Entrada" : "Saída"} registrada! ` +
          `Produto ${produtoId}: ${novoTotal} unidade(s) em estoque.`
      );

      setTipoMensagem("sucesso");

      //modal
      if (operacao === "retirar" && novoTotal < ESTOQUE_MINIMO) {
        setQuantidadeAlerta(novoTotal);
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

  function lerOutroQRCode() {
    setProdutoQR("");
    setMensagem("");
    setTipoMensagem("");
    setQuantidade("1");
    setQuantidadeAlerta(null);
  }

  const estoqueAtual = estoque[produtoQR.trim()] ?? 0;

  return (
    <main className="pagina">
      <Header onSair={onSair} />

      {!produtoQR ? (
        <LeitorQR aoLer={aoLer} aoFechar={onVoltar} />
      ) : (
        <section className="painel">
          <h2>
            {operacao === "inserir" ? "Inserir produto" : "Retirar produto"}
          </h2>

          <p className="descricao">
            QR Code lido. Confira o identificador do produto.
          </p>

          <div className="resumo-produto">
            <strong>Código do produto:</strong>
            <p className="codigo-produto">{produtoQR}</p>

            <strong>Estoque atual:</strong>
            <p className={estoqueAtual < ESTOQUE_MINIMO
                        ? "quantidade-estoque baixa"
                        : "quantidade-estoque"
                    }>{estoqueAtual} unidade(s)</p>
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
            <Botao variante="secundario" onClick={lerOutroQRCode}>
              Ler outro QR Code
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
          minimo={ESTOQUE_MINIMO}
          onFechar={() => setQuantidadeAlerta(null)}
        />
      )}
    </main>
  );
}
