
import type { ButtonHTMLAttributes } from "react";

interface BotaoProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "primario" | "secundario";
}

export default function Botao({
  children,
  variante = "primario",
  className = "",
  ...props
}: BotaoProps) {
  return (
    <button
      className={`botao botao-${variante} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
