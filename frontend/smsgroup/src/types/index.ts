
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
  onEntrar: () => void;
}

export interface PainelProps {
  onSair: () => void;
  onNavegar: (destino: DestinoPainel) => void;
}

export interface MovimentacaoEstoqueProps {
  operacao: OperacaoEstoque;
  estoque: Estoque;
  onSair: () => void;
  onVoltar: () => void;
  onAtualizarEstoque: (estoque: Estoque) => void;
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
