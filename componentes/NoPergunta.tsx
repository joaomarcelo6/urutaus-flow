import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { NoPergunta } from "@/modelo/tipos";

export default function NoPerguntaComponente({ data }: NodeProps<NoPergunta>) {
  const saidas = data.opcoes.map((opcao) => (
    <div key={opcao.id} style={{ position: "relative", padding: "4px 0" }}>
      {opcao.rotulo}
      <Handle
        type="source"
        id={opcao.id}
        position={Position.Right}
        style={{ top: "50%" }}
      />{" "}
    </div>
  ));
  return (
    <div
      style={{
        padding: 10,
        border: "1px solid #333",
        borderRadius: 6,
        background: "#0a0101",
        minWidth: 160,
      }}
    >
      <Handle type="target" position={Position.Top} />

      <strong>{data.label}</strong>

      {saidas}
    </div>
  );
}
