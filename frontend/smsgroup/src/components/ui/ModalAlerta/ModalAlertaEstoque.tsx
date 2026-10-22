import Botao from "../Botao";
import "./ModalAlerta.css";

interface ModalAlertaEstoqueProps {
  quantidade: number;
  minimo: number;
  onFechar: () => void;
}

export default function ModalAlertaEstoque({
  quantidade,
  minimo,
  onFechar,
}: ModalAlertaEstoqueProps) {
  return (
    <div className="modal-overlay">
      <section
        className="modal-alerta-estoque"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-alerta-estoque"
      >
        <div className="modal-alerta-icone" aria-hidden="true">
          !
        </div>

        <h2 id="titulo-alerta-estoque">Estoque no limite mínimo</h2>

        <p>
          A movimentação foi registrada. Este produto está com apenas{" "}
          <strong>{quantidade} unidade(s)</strong> em estoque.
        </p>

        <p>
          O limite mínimo configurado para este produto é de{" "}
          <strong>{minimo} unidade(s)</strong>. Quando o produto cruza esse limite, uma nota é salva e a abertura do WhatsApp é solicitada para envio.
        </p>

        <Botao onClick={onFechar} className="botao-largo">
          Entendi
        </Botao>
      </section>
    </div>
  );
}