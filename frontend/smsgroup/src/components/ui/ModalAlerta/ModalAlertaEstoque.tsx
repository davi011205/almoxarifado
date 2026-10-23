import Botao from "../Botao";
import "./ModalAlerta.css";

export interface ItemAlertaEstoque {
  produto: string;
  quantidade: number;
  minimo: number;
}

interface ModalAlertaEstoqueProps {
  itens: ItemAlertaEstoque[];
  onFechar: () => void;
}

export default function ModalAlertaEstoque({
  itens,
  onFechar,
}: ModalAlertaEstoqueProps) {
  if (itens.length === 0) return null;

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

        <h2 id="titulo-alerta-estoque">Atenção ao nível do estoque</h2>
        <p>
          A movimentação foi registrada, mas os produtos abaixo estão no limite
          ou abaixo do estoque mínimo configurado:
        </p>

        <div className="alerta-estoque-lista">
          {itens.map((item) => (
            <div className="alerta-estoque-item" key={item.produto}>
              <strong>{item.produto}</strong>
              <span>
                Saldo atual: {item.quantidade} unidade(s) · Mínimo: {item.minimo}
              </span>
            </div>
          ))}
        </div>

        <p>
          A nota de reposição é criada somente ao confirmar a movimentação final,
          quando a retirada deixa produtos abaixo do mínimo. A área administrativa
          também permite revisar e confirmar uma nota com todos os itens em falta.
        </p>

        <Botao onClick={onFechar} className="botao-largo">
          Entendi
        </Botao>
      </section>
    </div>
  );
}