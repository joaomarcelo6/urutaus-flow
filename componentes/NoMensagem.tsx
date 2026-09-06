import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { NoMensagem } from "@/modelo/tipos";

export default function NoMensagemComponente({ data }: NodeProps<NoMensagem>) {
  return (
    <div
      style={{
        padding: 10,
        border: "1px solid #333",
        borderRadius: 6,
        background: "#03fe20",
        minWidth: 160,
      }}
    >
      <Handle type="target" position={Position.Top} />

      <strong>{data.label}</strong>
      <div style={{ fontSize: 12, color: "#090df8" }}>{data.texto}</div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
