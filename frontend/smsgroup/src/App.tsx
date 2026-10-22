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
import Administrador from "./pages/Administrador";

import {
  encerrarSessao,
  iniciarSessao,
  obterFuncionarioSessao,
} from "./services/autenticacaoService";

import {
  obterEstoqueSalvo,
  salvarEstoqueSalvo,
} from "./services/estoqueService";

import type {
  DestinoPainel,
  Estoque,
  Funcionario,
  OperacaoEstoque,
} from "./types";

interface RotaProtegidaProps {
  funcionario: Funcionario | null;
  apenasAdmin?: boolean;
  children: ReactNode;
}

function RotaProtegida({
  funcionario,
  apenasAdmin = false,
  children,
}: RotaProtegidaProps) {
  if (!funcionario) {
    return <Navigate to="/" replace />;
  }

  if (apenasAdmin && funcionario.perfil !== "administrador") {
    return <Navigate to="/painel" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const navigate = useNavigate();

  const [funcionarioAtual, setFuncionarioAtual] =
    useState<Funcionario | null>(() => obterFuncionarioSessao());

  const [estoque, setEstoque] = useState<Estoque>(
    () => obterEstoqueSalvo()
  );

  function entrar(funcionario: Funcionario) {
    iniciarSessao(funcionario);
    setFuncionarioAtual(funcionario);
    navigate("/painel", { replace: true });
  }

  function sair() {
    encerrarSessao();
    setFuncionarioAtual(null);
    navigate("/", { replace: true });
  }

  function atualizarEstoque(novoEstoque: Estoque) {
    salvarEstoqueSalvo(novoEstoque);
    setEstoque(novoEstoque);
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
    if (!funcionarioAtual) {
      return <Navigate to="/" replace />;
    }

    return (
      <RotaProtegida funcionario={funcionarioAtual}>
        <MovimentacaoEstoque
          operacao={operacao}
          estoque={estoque}
          funcionario={funcionarioAtual}
          onSair={sair}
          onVoltar={() => navigate("/painel")}
          onAtualizarEstoque={atualizarEstoque}
        />
      </RotaProtegida>
    );
  }

  function renderizarAdministrador() {
    if (!funcionarioAtual) {
      return <Navigate to="/" replace />;
    }

    return (
      <RotaProtegida
        funcionario={funcionarioAtual}
        apenasAdmin
      >
        <Administrador
          estoque={estoque}
          funcionario={funcionarioAtual}
          onSair={sair}
          onVoltar={() => navigate("/painel")}
        />
      </RotaProtegida>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          funcionarioAtual ? (
            <Navigate to="/painel" replace />
          ) : (
            <Login onEntrar={entrar} />
          )
        }
      />

      <Route
        path="/painel"
        element={
          <RotaProtegida funcionario={funcionarioAtual}>
            {funcionarioAtual && (
              <Painel
                onSair={sair}
                onNavegar={navegar}
                funcionario={funcionarioAtual}
                onAbrirAdmin={() => navigate("/administrador")}
              />
            )}
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
          <RotaProtegida funcionario={funcionarioAtual}>
            <ConsultaEstoque
              estoque={estoque}
              onSair={sair}
              onVoltar={() => navigate("/painel")}
            />
          </RotaProtegida>
        }
      />

      <Route
        path="/administrador"
        element={renderizarAdministrador()}
      />

      <Route
        path="*"
        element={
          <Navigate
            to={funcionarioAtual ? "/painel" : "/"}
            replace
          />
        }
      />
    </Routes>
  );
}