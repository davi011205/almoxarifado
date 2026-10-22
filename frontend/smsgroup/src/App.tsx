
import { useState, type ReactNode } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Painel from "./pages/Painel";
import MovimentacaoEstoque from "./pages/MovimentacaoEstoque";
import ConsultaEstoque from "./pages/ConsultaEstoque";

import type {
  Estoque,
  DestinoPainel,
  OperacaoEstoque,
} from "./types";

interface RotaProtegidaProps {
  autenticado: boolean;
  children: ReactNode;
}

function RotaProtegida({autenticado, children}: RotaProtegidaProps) {
  if (!autenticado) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const [autenticado, setAutenticado] = useState(
    () => sessionStorage.getItem("autenticado") === "true"
  );
  const [estoque, setEstoque] = useState<Estoque>({});
  const navigate = useNavigate();

  function entrar() {
    sessionStorage.setItem("autenticado", "true");
    setAutenticado(true);
    navigate("/painel");
  }

  function sair() {
    sessionStorage.removeItem("autenticado");
    setAutenticado(false);
    navigate("/", { replace: true });
  }

  function navegar(destino: DestinoPainel) {
    const rotas: Record<DestinoPainel, string> = {
      inserir: "/estoque/inserir",
      retirar: "/estoque/retirar",
      consultar: "/estoque/consultar",
    };

    navigate(rotas[destino]);
  }

  function renderizarMovimentacao(operacao: OperacaoEstoque) {
    return (
      <RotaProtegida autenticado={autenticado}>
        <MovimentacaoEstoque
          operacao={operacao}
          estoque={estoque}
          onSair={sair}
          onVoltar={() => navigate("/painel")}
          onAtualizarEstoque={setEstoque}
        />
      </RotaProtegida>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          autenticado ? (
            <Navigate to="/painel" replace />
          ) : (
            <Login onEntrar={entrar} />
          )
        }
      />

      <Route
        path="/painel"
        element={
          <RotaProtegida autenticado={autenticado}>
            <Painel onSair={sair} onNavegar={navegar} />
          </RotaProtegida>
        }
      />

      <Route
        path="/estoque/inserir"
        element={renderizarMovimentacao("inserir")}
      />

      <Route
        path="/estoque/retirar"
        element={renderizarMovimentacao("retirar")}
      />

      <Route
        path="/estoque/consultar"
        element={
          <RotaProtegida autenticado={autenticado}>
            <ConsultaEstoque
              estoque={estoque}
              onSair={sair}
              onVoltar={() => navigate("/painel")}
            />
          </RotaProtegida>
        }
      />

      <Route
        path="*"
        element={<Navigate to={autenticado ? "/painel" : "/"} replace />}
      />
    </Routes>
  );
}
