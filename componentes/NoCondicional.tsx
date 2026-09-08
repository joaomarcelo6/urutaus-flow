import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { NoCondicional } from "@/modelo/tipos";
import NoBase, { corDoNo, estiloHandle } from "@/componentes/NoBase";

const ROTULO_OPERADOR: Record<string, string> = {
  igual: "=",
  diferente: "≠",
  maior: ">",
  contem: "contém",
  existe: "existe",
};

const COR_VERDADEIRO = "#1a9e4a";
const COR_FALSO = "#c94040";

export default function NoCondicionalComponente({ data, selected }: NodeProps<NoCondicional>) {
  const cor = corDoNo("condicional");
  const { chave, operador } = data.regra;

  return (
    <NoBase tipo="condicional" titulo={data.label} selecionado={selected}>
      <Handle type="target" position={Position.Top} style={estiloHandle(cor)} />

      <p
        style={{
          margin: "2px 0 8px",
          fontSize: 12,
          fontFamily: "monospace",
          color: "#555",
        }}
      >
        {chave || "?"} {ROTULO_OPERADOR[operador] ?? operador}
        {data.regra.operador === "existe"
          ? ""
          : data.regra.operador === "maior"
            ? ` ${data.regra.valor}`
            : ` ${data.regra.valor || "?"}`}
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          fontWeight: 600,
        }}
      >
        <span style={{ color: COR_VERDADEIRO }}>✓ verdadeiro</span>
        <span style={{ color: COR_FALSO }}>✗ falso</span>
      </div>

      <Handle
        type="source"
        id="verdadeiro"
        position={Position.Left}
        style={estiloHandle(COR_VERDADEIRO)}
      />
      <Handle
        type="source"
        id="falso"
        position={Position.Right}
        style={estiloHandle(COR_FALSO)}
      />
    </NoBase>
  );
}
