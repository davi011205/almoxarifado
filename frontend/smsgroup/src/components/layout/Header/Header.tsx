
import Botao from "../../ui/Botao";
import type { HeaderProps } from "../../../types";

export default function Header({
  subtitulo,
  onSair
}: HeaderProps) {
  return (
    <header className="header">
      <div>
        <strong className="marca">ALMOXARIFADO</strong>

        {subtitulo && (
          <div className="subtitulo">{subtitulo}</div>
        )}
      </div>

      <Botao variante="secundario" onClick={onSair}>
        Sair
      </Botao>
    </header>
  );
}
