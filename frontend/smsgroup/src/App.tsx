import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import Login from "./pages/Login";
import Painel from "./pages/Painel";
import MovimentacaoEstoque from "./pages/MovimentacaoEstoque";
import ConsultaEstoque from "./pages/ConsultaEstoque";
import Administrador from "./pages/Administrador";

import {
  encerrarSessao,
  iniciarSessao,
  obterFuncionarioSessao,
  validarSessao,
} from "./services/autenticacaoService";
import { obterEstoqueSalvo } from "./services/estoqueService";
import { carregarConfiguracoesReposicao } from "./services/reposicaoService";

import type { DestinoPainel, Estoque, Funcionario, OperacaoEstoque } from "./types";

interface RotaProtegidaProps {
  funcionario: Funcionario | null;
  apenasAdmin?: boolean;
  children: ReactNode;
}

function RotaProtegida({ funcionario, apenasAdmin = false, children }: RotaProtegidaProps) {
  if (!funcionario) return <Navigate to="/" replace />;
  if (apenasAdmin && funcionario.perfil !== "administrador") {
    return <Navigate to="/painel" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [funcionarioAtual, setFuncionarioAtual] = useState<Funcionario | null>(() => obterFuncionarioSessao());
  const [estoque, setEstoque] = useState<Estoque>({});
  const [carregandoSessao, setCarregandoSessao] = useState(() => Boolean(obterFuncionarioSessao()));
  const [erroInicializacao, setErroInicializacao] = useState("");

  useEffect(() => {
    if (!obterFuncionarioSessao()) return;
    let montado = true;

    async function inicializar() {
      try {
        const funcionario = await validarSessao();
        const [estoqueAtual] = await Promise.all([
          obterEstoqueSalvo(),
          carregarConfiguracoesReposicao(),
        ]);
        if (montado) {
          setFuncionarioAtual(funcionario);
          setEstoque(estoqueAtual);
          setErroInicializacao("");
        }
      } catch {
        encerrarSessao();
        if (montado) {
          setFuncionarioAtual(null);
          setErroInicializacao("Sua sessão expirou ou a API está indisponível. Entre novamente.");
        }
      } finally {
        if (montado) setCarregandoSessao(false);
      }
    }

    void inicializar();
    return () => { montado = false; };
  }, []);

  // Recarrega o estado compartilhado sempre que o usuário navega para outra tela.
  // Assim a aplicação busca o saldo e os limites atuais no banco, em vez de depender
  // de valores armazenados apenas no navegador.
  useEffect(() => {
    if (!funcionarioAtual || carregandoSessao) return;
    let ativo = true;
    async function sincronizarDados() {
      try {
        const [estoqueAtual] = await Promise.all([
          obterEstoqueSalvo(),
          carregarConfiguracoesReposicao(),
        ]);
        if (ativo) setEstoque(estoqueAtual);
      } catch (e: unknown) {
        if (ativo) setErroInicializacao(e instanceof Error ? e.message : "Não foi possível sincronizar o estoque.");
      }
    }
    void sincronizarDados();
    return () => { ativo = false; };
  }, [funcionarioAtual?.id, carregandoSessao, location.pathname]);

  async function entrar(funcionario: Funcionario) {
    try {
      iniciarSessao(funcionario);
      const [estoqueAtual] = await Promise.all([
        obterEstoqueSalvo(),
        carregarConfiguracoesReposicao(),
      ]);
      setEstoque(estoqueAtual);
      setFuncionarioAtual(funcionario);
      setErroInicializacao("");
      navigate("/painel", { replace: true });
    } catch (e: unknown) {
      encerrarSessao();
      setFuncionarioAtual(null);
      setErroInicializacao(e instanceof Error ? e.message : "Não foi possível carregar os dados do almoxarifado.");
      throw e;
    }
  }

  function sair() {
    encerrarSessao();
    setFuncionarioAtual(null);
    setEstoque({});
    navigate("/", { replace: true });
  }

  // As movimentações já são persistidas pelo backend. Aqui apenas sincronizamos o estado visual.
  function atualizarEstoque(novoEstoque: Estoque) {
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
    if (!funcionarioAtual) return <Navigate to="/" replace />;
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
    if (!funcionarioAtual) return <Navigate to="/" replace />;
    return (
      <RotaProtegida funcionario={funcionarioAtual} apenasAdmin>
        <Administrador
          estoque={estoque}
          funcionario={funcionarioAtual}
          onSair={sair}
          onVoltar={() => navigate("/painel")}
        />
      </RotaProtegida>
    );
  }

  if (carregandoSessao) {
    return <main className="pagina"><section className="painel"><p>Conectando ao almoxarifado...</p></section></main>;
  }

  return (
    <>
      {erroInicializacao && !funcionarioAtual && (
        <div className="aviso-conexao-api" role="alert">{erroInicializacao}</div>
      )}
      <Routes>
        <Route path="/" element={funcionarioAtual ? <Navigate to="/painel" replace /> : <Login onEntrar={entrar} />} />
        <Route path="/painel" element={
          <RotaProtegida funcionario={funcionarioAtual}>
            {funcionarioAtual && <Painel onSair={sair} onNavegar={navegar} funcionario={funcionarioAtual} onAbrirAdmin={() => navigate("/administrador")} />}
          </RotaProtegida>
        } />
        <Route path="/estoque/inserir" element={renderizarMovimentacao("inserir")} />
        <Route path="/estoque/retirar" element={renderizarMovimentacao("retirar")} />
        <Route path="/estoque/consultar" element={
          <RotaProtegida funcionario={funcionarioAtual}>
            <ConsultaEstoque estoque={estoque} onSair={sair} onVoltar={() => navigate("/painel")} />
          </RotaProtegida>
        } />
        <Route path="/administrador" element={renderizarAdministrador()} />
        <Route path="*" element={<Navigate to={funcionarioAtual ? "/painel" : "/"} replace />} />
      </Routes>
    </>
  );
}
