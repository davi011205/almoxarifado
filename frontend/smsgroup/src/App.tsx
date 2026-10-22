
import { useState } from "react";

import Login from "./pages/Login";
import Painel from "./pages/Painel";
import MovimentacaoEstoque from "./pages/MovimentacaoEstoque";
import ConsultaEstoque from "./pages/ConsultaEstoque";
import type {
  DestinoPainel,
  Estoque
} from "./types";

export default function App() {
  const [logado, setLogado] = useState<boolean>(false);
  const [operacao, setOperacao] = useState<DestinoPainel | "">("");
  const [estoque, setEstoque] = useState<Estoque>({});

  function sair(): void {
    setLogado(false);
    setOperacao("");
  }

  function navegar(destino: DestinoPainel): void {
    setOperacao(destino);
  }

  if (!logado) {
    return <Login onEntrar={() => setLogado(true)} />;
  }

  if (operacao === "inserir" || operacao === "retirar") {
    return (
      <MovimentacaoEstoque
        operacao={operacao}
        estoque={estoque}
        onSair={sair}
        onVoltar={() => setOperacao("")}
        onAtualizarEstoque={setEstoque}
      />
    );
  }

  if (operacao === "consultar") {
    return (
      <ConsultaEstoque
        estoque={estoque}
        onSair={sair}
        onVoltar={() => setOperacao("")}
      />
    );
  }

  return (
    <Painel
      onSair={sair}
      onNavegar={navegar}
    />
  );
}
