

import { useEffect, useRef, useState } from "react";
import Botao from "./Botao";
import { Html5Qrcode } from "html5-qrcode";
import type { LeitorQRProps } from "../../types";

export default function LeitorQR({
  aoLer,
  aoFechar,
}: LeitorQRProps) {
  const [erro, setErro] = useState("");
  const [pronto, setPronto] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const canceladoRef = useRef(false);
  const processandoRef = useRef(false);

  useEffect(() => {
    let iniciado = false;
    let encerrando = false;

    canceladoRef.current = false;
    processandoRef.current = false;
    setErro("");
    setPronto(false);

    async function pararScanner() {
      if (encerrando) return;
      encerrando = true;

      const atual = scannerRef.current;
      scannerRef.current = null;

      if (!atual) return;

      try {
        if (iniciado) {
          iniciado = false;
          await atual.stop();
        }
      } catch {
        // A câmera pode já estar parada.
      }

      try {
        atual.clear();
      } catch {
        // O leitor pode já ter sido limpo.
      }
    }

    async function iniciar() {
      let scanner: Html5Qrcode | null = null;

      try {
        if (canceladoRef.current) return;

        scanner = new Html5Qrcode("leitor-qr");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 230, height: 230 },
          },
          (texto: string) => {
            if (
              canceladoRef.current ||
              processandoRef.current
            ) {
              return;
            }

            processandoRef.current = true;
            aoLer(texto);
          },
          () => {}
        );

        iniciado = true;

        if (canceladoRef.current) {
          await pararScanner();
          return;
        }

        setPronto(true);
      } catch (e: unknown) {
        if (!canceladoRef.current) {
          const detalhe =
            e instanceof Error ? ` ${e.message}` : "";

          setErro(
            "Não foi possível abrir a câmera. Autorize o acesso " +
              "e verifique se o site está em HTTPS." +
              detalhe
          );

          await pararScanner();
        }
      }
    }

    void iniciar();

    return () => {
      canceladoRef.current = true;
      void pararScanner();
    };
  }, [aoLer]);

  return (
    <section className="painel">
      <h2>Leitor de QR Code</h2>

      <p className="descricao">
        Autorize a câmera e aponte para o QR Code do produto.
      </p>

      <div id="leitor-qr" className="area-leitor" />

      {!pronto && !erro && (
        <p className="descricao">Iniciando câmera...</p>
      )}

      {erro && <p className="mensagem-erro">{erro}</p>}

      <Botao variante="secundario" onClick={aoFechar}>
        ← Voltar ao painel
      </Botao>
    </section>
  );
}
