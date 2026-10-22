export type PerfilAcesso = "administrador" | "funcionario";

export interface Funcionario {
  id: string;
  nome: string;
  usuario: string;
  senha: string;
  perfil: PerfilAcesso;
}

export interface RegistroMovimentacao {
  id: string;
  produto: string;
  quantidade: number;
  operacao: OperacaoEstoque;
  funcionarioId: string;
  funcionarioNome: string;
  data: string;
}

export interface ItemReposicao {
  produto: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  quantidadeIdeal: number;
  quantidadeRepor: number;
}

export interface NotaReposicao {
  referencia: string;
  data: string;
  itens: ItemReposicao[];
  origem: "automatica" | "manual";
}

export interface AdministradorProps {
  estoque: Estoque;
  funcionario: Funcionario;
  onSair: () => void;
  onVoltar: () => void;
}

export type OperacaoEstoque = "inserir" | "retirar";

export type DestinoPainel =
  | OperacaoEstoque
  | "consultar";

export type Estoque = Record<string, number>;

export interface HeaderProps {
  subtitulo?: string;
  onSair: () => void;
}

export interface BotaoProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "primario" | "secundario";
  className?: string;
}

export interface CampoFormularioProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
}

export interface CartaoAcaoProps {
  icone: string;
  titulo: string;
  descricao: string;
  onClick: () => void;
}

export interface LoginProps {
  onEntrar: (funcionario: Funcionario) => void;
}

export interface PainelProps {
  onSair: () => void;
  onNavegar: (destino: DestinoPainel) => void;
  funcionario: Funcionario;
  onAbrirAdmin: () => void;
}

export interface MovimentacaoEstoqueProps {
  operacao: OperacaoEstoque;
  estoque: Estoque;
  onSair: () => void;
  onVoltar: () => void;
  onAtualizarEstoque: (estoque: Estoque) => void;
  funcionario: Funcionario;
}

export interface ConsultaEstoqueProps {
  estoque: Estoque;
  onSair: () => void;
  onVoltar: () => void;
}

export interface LeitorQRProps {
  aoLer: (texto: string) => void;
  aoFechar: () => void;
}

export interface RegistrarMovimentoParams {
  estoque: Estoque;
  produtoId: string;
  quantidade: string | number;
  operacao: OperacaoEstoque;
}
