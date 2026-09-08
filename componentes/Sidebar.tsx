import type { CSSProperties, DragEvent } from "react";
import type { TipoDeNo } from "@/modelo/tipos";
import { corDoNo, iconeDoNo } from "@/componentes/NoBase";

/**
 * O tipo do nó viaja no dataTransfer com essa chave. O drop do canvas lê a
 * mesma constante — sem ela, a ponta que escreve e a ponta que lê teriam
 * strings soltas iguais só por coincidência.
 */
export const FORMATO_ARRASTO = "application/urutaus-tipo-de-no";

/**
 * `Record<TipoDeNo, ...>` em vez de lista: um tipo novo no modelo quebra o
 * build aqui até ganhar rótulo, em vez de simplesmente não aparecer na paleta.
 */
const ITENS: Record<TipoDeNo, { rotulo: string; descricao: string }> = {
  mensagem: { rotulo: "Mensagem", descricao: "Envia um texto" },
  pergunta: { rotulo: "Pergunta", descricao: "Oferece opções" },
  condicional: { rotulo: "Condição", descricao: "Compara o contexto" },
  llm: { rotulo: "IA", descricao: "Chama o modelo" },
  fim: { rotulo: "Fim", descricao: "Encerra a conversa" },
};

const ORDEM = Object.keys(ITENS) as TipoDeNo[];

const estiloBarra: CSSProperties = {
  width: 200,
  borderRight: "1px solid #e2e2e2",
  background: "#fafafa",
  padding: 16,
  boxSizing: "border-box",
  fontFamily: "system-ui, sans-serif",
};

function estiloItem(cor: string): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    marginBottom: 8,
    borderRadius: 8,
    background: "#fff",
    // Longhand de propósito: misturar `border` com `borderLeft` no mesmo
    // estilo faz o React avisar sobre conflito de shorthand.
    borderTop: "1px solid #e2e2e2",
    borderRight: "1px solid #e2e2e2",
    borderBottom: "1px solid #e2e2e2",
    borderLeft: `4px solid ${cor}`,
    cursor: "grab",
    userSelect: "none",
  };
}

export default function Sidebar() {
  function aoComecarArrasto(evento: DragEvent<HTMLDivElement>, tipo: TipoDeNo) {
    evento.dataTransfer.setData(FORMATO_ARRASTO, tipo);
    evento.dataTransfer.effectAllowed = "move";
  }

  return (
    <aside style={estiloBarra}>
      <h2
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          color: "#888",
          margin: "0 0 10px",
        }}
      >
        Blocos
      </h2>

      {ORDEM.map((tipo) => (
        <div
          key={tipo}
          draggable
          onDragStart={(evento) => aoComecarArrasto(evento, tipo)}
          style={estiloItem(corDoNo(tipo))}
        >
          <span style={{ fontSize: 15, lineHeight: 1 }}>{iconeDoNo(tipo)}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {ITENS[tipo].rotulo}
            </div>
            <div style={{ fontSize: 11, color: "#888" }}>
              {ITENS[tipo].descricao}
            </div>
          </div>
        </div>
      ))}

      <p style={{ fontSize: 11, color: "#999", marginTop: 16, lineHeight: 1.5 }}>
        Arraste um bloco para o canvas.
      </p>
    </aside>
  );
}
