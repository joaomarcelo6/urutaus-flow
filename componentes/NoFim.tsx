import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { NoFim } from "@/modelo/tipos";
import NoBase, { corDoNo, estiloHandle } from "@/componentes/NoBase";

export default function NoFimComponente({ data, selected }: NodeProps<NoFim>) {
  const cor = corDoNo("fim");

  return (
    <NoBase tipo="fim" titulo={data.label} selecionado={selected}>
      <Handle type="target" position={Position.Top} style={estiloHandle(cor)} />
    </NoBase>
  );
}
