import type { CSSProperties, ReactNode } from "react";
import type { TipoDeNo } from "@/modelo/tipos";

/** Os tipos vêm do modelo; aqui só se decide como cada um aparece na tela. */
export type TipoNo = TipoDeNo;

const CORES: Record<TipoNo, string> = {
  mensagem: "#25d366",
  pergunta: "#7c5cff",
  condicional: "#f5a623",
  llm: "#2fb4c9",
  fim: "#e0455f",
};

const ICONES: Record<TipoNo, string> = {
  mensagem: "💬",
  pergunta: "❓",
  condicional: "🔀",
  llm: "🤖",
  fim: "⏹️",
};

export function corDoNo(tipo: TipoNo): string {
  return CORES[tipo];
}

export function iconeDoNo(tipo: TipoNo): string {
  return ICONES[tipo];
}

export const estiloTexto: CSSProperties = {
  margin: "2px 0 6px",
  fontSize: 12,
  color: "#555",
  maxWidth: 220,
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
};

export const estiloVazio: CSSProperties = {
  color: "#999",
  fontStyle: "italic",
};

export function estiloBadge(cor: string): CSSProperties {
  return {
    display: "inline-block",
    fontSize: 10,
    fontWeight: 600,
    color: cor,
    background: `${cor}1a`,
    borderRadius: 999,
    padding: "2px 8px",
    marginTop: 4,
  };
}

export function estiloHandle(cor: string): CSSProperties {
  return {
    background: cor,
    width: 9,
    height: 9,
    border: "2px solid #fff",
  };
}

type NoBaseProps = {
  tipo: TipoNo;
  titulo: string;
  selecionado?: boolean;
  children?: ReactNode;
};

export default function NoBase({ tipo, titulo, selecionado, children }: NoBaseProps) {
  const cor = CORES[tipo];

  const estiloCartao: CSSProperties = {
    minWidth: 180,
    borderRadius: 10,
    background: "#ffffff",
    border: `1.5px solid ${selecionado ? cor : "#e2e2e2"}`,
    borderLeft: `4px solid ${cor}`,
    boxShadow: selecionado
      ? `0 0 0 3px ${cor}33, 0 2px 6px rgba(0,0,0,0.12)`
      : "0 1px 3px rgba(0,0,0,0.08)",
    padding: "8px 12px",
    fontFamily: "system-ui, sans-serif",
    color: "#1f1f1f",
  };

  return (
    <div style={estiloCartao}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>{ICONES[tipo]}</span>
        <strong style={{ fontSize: 13 }}>{titulo}</strong>
      </div>
      {children}
    </div>
  );
}
