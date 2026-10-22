
import Header from "../components/layout/Header/Header";
import Botao from "../components/ui/Botao";
import type { ConsultaEstoqueProps } from "../types";

export default function ConsultaEstoque({
  estoque,
  onSair,
  onVoltar
}: ConsultaEstoqueProps) {
  const produtos = Object.entries(estoque);

  return (
    <main className="pagina">
      <Header onSair={onSair} />

      <section className="painel">
        <h2>Consultar depósito</h2>

        {produtos.length === 0 ? (
          <p className="descricao">
            Nenhum produto registrado nesta sessão.
          </p>
        ) : (
          produtos.map(([id, quantidade]) => (
            <div className="item-estoque" key={id}>
              <strong className="codigo-produto">{id}</strong>
              <span>{quantidade} unidade(s)</span>
            </div>
          ))
        )}

        <Botao variante="secundario" onClick={onVoltar}>
          ← Voltar ao painel
        </Botao>
      </section>
    </main>
  );
}
