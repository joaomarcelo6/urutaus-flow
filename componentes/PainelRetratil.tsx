"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { CASCA } from "@/componentes/casca";

type Props = {
  lado: "esquerda" | "direita";
  larguraAberta: number;
  children: ReactNode;
};

const LARGURA_SETA = 28;

const estiloSeta: CSSProperties = {
  width: LARGURA_SETA,
  flexShrink: 0,
  border: "none",
  background: CASCA.fundoElevado,
  color: CASCA.texto,
  cursor: "pointer",
  fontSize: 14,
};

/**
 * Casca genérica para a barra lateral e o painel de edição: os dois só
 * diferem na largura aberta e em de que lado do canvas ficam.
 *
 * Quem encolhe é o container do conteúdo, não o painel inteiro — o botão de
 * seta é irmão dele e fica sempre visível. Se o painel inteiro encolhesse, o
 * botão sairia da área visível junto com o conteúdo e não haveria como
 * reabrir.
 */
export default function PainelRetratil({ lado, larguraAberta, children }: Props) {
  const [aberto, setAberto] = useState(true);

  const seta =
    lado === "esquerda" ? (aberto ? "\u2039" : "\u203a") : aberto ? "\u203a" : "\u2039";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: lado === "esquerda" ? "row" : "row-reverse",
        flexShrink: 0,
        height: "100%",
        background: CASCA.fundo,
        borderRight: lado === "esquerda" ? `1px solid ${CASCA.borda}` : undefined,
        borderLeft: lado === "direita" ? `1px solid ${CASCA.borda}` : undefined,
      }}
    >
      <div
        style={{
          width: aberto ? larguraAberta : 0,
          flexShrink: 0,
          overflow: "hidden",
          transition: "width 0.2s ease",
        }}
      >
        <div style={{ width: larguraAberta, height: "100%", overflowY: "auto" }}>
          {children}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        aria-label={aberto ? "Recolher painel" : "Expandir painel"}
        title={aberto ? "Recolher painel" : "Expandir painel"}
        style={estiloSeta}
      >
        {seta}
      </button>
    </div>
  );
}
