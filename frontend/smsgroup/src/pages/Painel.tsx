
import Header from "../components/layout/Header/Header";
import Rodape from "../components/layout/Rodape";
import CartaoAcao from "../components/ui/CartaoAcao";
import type { DestinoPainel, PainelProps } from "../types";

const acoes: {
  icone: string;
  titulo: string;
  descricao: string;
  destino: DestinoPainel;
}[] = [
  {
    icone: "＋",
    titulo: "Inserir produto",
    descricao: "Ler o QR Code e registrar entrada.",
    destino: "inserir"
  },
  {
    icone: "−",
    titulo: "Retirar produto",
    descricao: "Ler o QR Code e registrar saída.",
    destino: "retirar"
  },
  {
    icone: "⌕",
    titulo: "Consultar depósito",
    descricao: "Visualizar produtos e quantidades.",
    destino: "consultar"
  }
];

export default function Painel({
  onSair,
  onNavegar
}: PainelProps) {
  return (
    <main className="pagina">
      <Header
        subtitulo="Sistema de gestão de estoque"
        onSair={onSair}
      />

      <section className="introducao">
        <p className="destaque">ÁREA DO FUNCIONÁRIO</p>
        <h1 className="titulo-boas-vindas">Bem-vindo, Davi!</h1>
        <p className="descricao">O que você deseja fazer hoje?</p>
      </section>

      <section className="grade-acoes">
        {acoes.map((acao) => (
          <CartaoAcao
            key={acao.destino}
            {...acao}
            onClick={() => onNavegar(acao.destino)}
          />
        ))}
      </section>

      <Rodape />
    </main>
  );
}
