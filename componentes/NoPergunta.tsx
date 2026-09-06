import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { NoPergunta } from "@/modelo/tipos";
import NoBase, { corDoNo, estiloBadge, estiloHandle, estiloVazio } from "@/componentes/NoBase";

export default function NoPerguntaComponente({ data, selected }: NodeProps<NoPergunta>) {
  const cor = corDoNo("pergunta");

  return (
    <NoBase tipo="pergunta" titulo={data.label} selecionado={selected}>
      <Handle type="target" position={Position.Top} style={estiloHandle(cor)} />

      {data.opcoes.length === 0 ? (
        <p style={estiloVazio}>Nenhuma opção cadastrada</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {data.opcoes.map((opcao, indice) => (
            <div
              key={opcao.id}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                padding: "3px 18px 3px 4px",
                borderRadius: 6,
                background: "#f4f2ff",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  flexShrink: 0,
                  borderRadius: "50%",
                  background: cor,
                  color: "#fff",
                  fontSize: 10,
                }}
              >
                {indice + 1}
              </span>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={opcao.rotulo}
              >
                {opcao.rotulo}
              </span>
              <Handle
                type="source"
                id={opcao.id}
                position={Position.Right}
                style={{ ...estiloHandle(cor), top: "50%" }}
              />
            </div>
          ))}
        </div>
      )}

      {data.salvarEm && <span style={estiloBadge(cor)}>salva em: {data.salvarEm}</span>}
    </NoBase>
  );
}
