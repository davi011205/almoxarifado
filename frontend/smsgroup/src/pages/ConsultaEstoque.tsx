import { useState } from "react";
import Header from "../components/layout/Header/Header";
import Botao from "../components/ui/Botao";
import type { ConsultaEstoqueProps } from "../types";
import { obterQuantidadeMinima } from "../services/reposicaoService";

const ITENS_POR_PAGINA = 20;

export default function ConsultaEstoque({
  estoque,
  onSair,
  onVoltar,
}: ConsultaEstoqueProps) {
  const [busca, setBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);

  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  const produtos = Object.entries(estoque)
    .filter(([identificador]) =>
      identificador.toLocaleLowerCase("pt-BR").includes(termo)
    )
    .sort(([a], [b]) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));

  const totalPaginas = Math.max(1, Math.ceil(produtos.length / ITENS_POR_PAGINA));
  const paginaValida = Math.min(paginaAtual, totalPaginas);
  const inicio = (paginaValida - 1) * ITENS_POR_PAGINA;
  const produtosDaPagina = produtos.slice(inicio, inicio + ITENS_POR_PAGINA);

  function alterarBusca(valor: string) {
    setBusca(valor);
    setPaginaAtual(1);
  }

  return (
    <main className="pagina">
      <Header onSair={onSair} />

      <section className="painel painel-consulta">
        <h2>Consultar depósito</h2>
        <p className="descricao">
          Pesquise pelo nome ou pelo conteúdo do QR Code do produto.
        </p>

        <label className="rotulo-pesquisa" htmlFor="pesquisa-produtos">
          Nome ou QR Code
        </label>
        <input
          id="pesquisa-produtos"
          className="campo"
          type="search"
          placeholder="Ex.: Parafuso sextavado"
          value={busca}
          onChange={(e) => alterarBusca(e.target.value)}
        />

        <p className="descricao resultado-pesquisa" aria-live="polite">
          {produtos.length} produto(s) encontrado(s)
          {produtos.length > 0 && ` · Exibindo ${inicio + 1}–${Math.min(inicio + ITENS_POR_PAGINA, produtos.length)}`}
        </p>

        {Object.keys(estoque).length === 0 ? (
          <p className="descricao">Nenhum produto registrado no estoque.</p>
        ) : produtos.length === 0 ? (
          <p className="mensagem-sem-alertas">
            Nenhum produto corresponde à pesquisa. Confira o nome ou o QR Code.
          </p>
        ) : (
          <>
            <div className="lista-produtos-estoque">
              {produtosDaPagina.map(([id, quantidade]) => {
                const minimo = obterQuantidadeMinima(id);
                return (
                  <div className="item-estoque" key={id}>
                    <div className="detalhes-item-estoque">
                      <strong className="codigo-produto">{id}</strong>
                      <span className="descricao minimo-produto">
                        Mínimo: {minimo} unidade(s)
                      </span>
                    </div>
                    <span
                      className={
                        quantidade <= minimo
                          ? "quantidade-estoque baixa"
                          : "quantidade-estoque"
                      }
                    >
                      {quantidade} unidade(s)
                    </span>
                  </div>
                );
              })}
            </div>

            {totalPaginas > 1 && (
              <nav className="paginacao" aria-label="Paginação dos produtos">
                <Botao
                  variante="secundario"
                  type="button"
                  disabled={paginaValida <= 1}
                  onClick={() => setPaginaAtual((pagina) => Math.max(1, pagina - 1))}
                >
                  Anterior
                </Botao>
                <span aria-live="polite">Página {paginaValida} de {totalPaginas}</span>
                <Botao
                  variante="secundario"
                  type="button"
                  disabled={paginaValida >= totalPaginas}
                  onClick={() => setPaginaAtual((pagina) => Math.min(totalPaginas, pagina + 1))}
                >
                  Próxima
                </Botao>
              </nav>
            )}
          </>
        )}

        <Botao variante="secundario" onClick={onVoltar}>
          ← Voltar ao painel
        </Botao>
      </section>
    </main>
  );
}
