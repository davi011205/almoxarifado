
import type { CartaoAcaoProps } from "../../types";

export default function CartaoAcao({
  icone,
  titulo,
  descricao,
  onClick
}: CartaoAcaoProps) {
  return (
    <button className="cartao-acao" onClick={onClick}>
      <span className="icone-acao">{icone}</span>
      <h2>{titulo}</h2>
      <p className="descricao">{descricao}</p>
      <strong className="link-acao">Acessar →</strong>
    </button>
  );
}
