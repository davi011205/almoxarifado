
import type { InputHTMLAttributes } from "react";

interface CampoFormularioProps
  extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
}

export default function CampoFormulario({
  id,
  label,
  ...props
}: CampoFormularioProps) {
  return (
    <div className="grupo-campo">
      <label htmlFor={id}>{label}</label>

      <input
        id={id}
        className="campo"
        {...props}
      />
    </div>
  );
}
