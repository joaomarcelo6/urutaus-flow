import type { CSSProperties } from "react";
import type { Problema } from "@/lib/percurso";

type Props = {
  problemas: Problema[];
  aoSelecionar: (noId: string) => void;
};

const CORES = {
  erro: "#c94040",
  aviso: "#b8860b",
} as const;

const estiloPainel: CSSProperties = {
  borderTop: "1px solid #e2e2e2",
  padding: 16,
  boxSizing: "border-box",
  maxHeight: "45%",
  overflowY: "auto",
  fontFamily: "system-ui, sans-serif",
};

export default function PainelProblemas({ problemas, aoSelecionar }: Props) {
  const erros = problemas.filter((problema) => problema.gravidade === "erro");

  return (
    <section style={estiloPainel}>
      <h2
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          color: "#888",
          margin: "0 0 10px",
        }}
      >
        Problemas {problemas.length > 0 && `(${erros.length} erro${erros.length === 1 ? "" : "s"})`}
      </h2>

      {problemas.length === 0 ? (
        <p style={{ fontSize: 12, color: "#1a9e4a", margin: 0 }}>
          ✓ Fluxo pronto para exportar.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {problemas.map((problema, indice) => (
            <li key={`${problema.tipo}-${problema.noId}-${indice}`}>
              <button
                type="button"
                disabled={problema.noId === null}
                onClick={() =>
                  problema.noId !== null && aoSelecionar(problema.noId)
                }
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  borderLeft: `3px solid ${CORES[problema.gravidade]}`,
                  padding: "4px 8px",
                  marginBottom: 6,
                  fontSize: 12,
                  fontFamily: "inherit",
                  color: "#444",
                  cursor: problema.noId === null ? "default" : "pointer",
                }}
              >
                {problema.mensagem}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
