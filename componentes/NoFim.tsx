import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { NoFim } from "@/modelo/tipos";

export default function NoFimComponente({ data }: NodeProps<NoFim>) {
  return (
    <div
      style={{
        padding: 10,
        border: "1px solid #333",
        borderRadius: 6,
        background: "#fa0808",
        minWidth: 160,
      }}
    >
      <Handle type="target" position={Position.Top} />

      <strong>{data.label}</strong>
    </div>
  );
}
