
export function autenticar(
  codigo: string,
  senha: string
): boolean {
  return (
    codigo.trim().toLowerCase() === "davi" &&
    senha === "1234"
  );
}
