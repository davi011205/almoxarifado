

import { useCallback, useState } from "react";
import Header from "../components/layout/Header/Header";
import Botao from "../components/ui/Botao";
import CampoFormulario from "../components/ui/CampoFormulario";
import LeitorQR from "../components/ui/LeitorQR";
import { registrarMovimento } from "../services/estoqueService";
import type { FormEvent } from "react";

import type {
  MovimentacaoEstoqueProps
} from "../types";

export default function MovimentacaoEstoque({
  operacao,
  estoque,
  onSair,
  onVoltar,
  onAtualizarEstoque
}: MovimentacaoEstoqueProps) {
  const [produtoQR, setProdutoQR] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("");

  const aoLer = useCallback((texto: string) => {
    setProdutoQR(texto);
    setMensagem("");
    setTipoMensagem("");
  }, []);

  function confirmarMovimento(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const novoEstoque = registrarMovimento({
        estoque,
        produtoId: produtoQR,
        quantidade,
        operacao
      });

      onAtualizarEstoque(novoEstoque);

      const novoTotal = novoEstoque[produtoQR.trim()];

      setMensagem(
        `${operacao === "inserir" ? "Entrada" : "Saída"} registrada! ` +
        `Produto ${produtoQR.trim()}: ${novoTotal} unidade(s) em estoque.`
      );

      setTipoMensagem("sucesso");
   
    } catch (e: unknown) {
      const mensagemErro = e instanceof Error
          ? e.message
          : "Ocorreu um erro inesperado ao registrar a movimentação.";

      setMensagem(mensagemErro);
      setTipoMensagem("erro");
    }

  }

  return (
    <main className="pagina">
      <Header onSair={onSair} />

      {!produtoQR ? (
        <LeitorQR
          aoLer={aoLer}
          aoFechar={onVoltar}
        />
      ) : (
        <section className="painel">
          <h2>
            {operacao === "inserir"
              ? "Inserir produto"
              : "Retirar produto"}
          </h2>

          <p className="descricao">
            QR Code lido. Confira o identificador do produto.
          </p>

          <div className="resumo-produto">
            <strong>Código do produto:</strong>
            <p className="codigo-produto">{produtoQR}</p>

            <strong>Estoque atual:</strong>
            <p>{estoque[produtoQR] || 0} unidade(s)</p>
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
            <p className={
              tipoMensagem === "erro"
                ? "mensagem-erro"
                : "mensagem-sucesso"
            }>
              {mensagem}
            </p>
          )}

          <div className="grupo-botoes">
            <Botao
              variante="secundario"
              onClick={() => {
                setProdutoQR("");
                setMensagem("");
                setTipoMensagem("");
                setQuantidade("1");
              }}
            >
              Ler outro QR Code
            </Botao>

            <Botao variante="secundario" onClick={onVoltar}>
              Voltar ao painel
            </Botao>
          </div>
        </section>
      )}
    </main>
  );
}
