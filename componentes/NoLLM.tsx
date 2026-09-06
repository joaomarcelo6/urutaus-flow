import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { NoLLM } from "@/modelo/tipos";
import NoBase, {
  corDoNo,
  estiloBadge,
  estiloHandle,
  estiloTexto,
  estiloVazio,
} from "@/componentes/NoBase";

export default function NoLLMComponente({ data, selected }: NodeProps<NoLLM>) {
  const cor = corDoNo("llm");

  return (
    <NoBase tipo="llm" titulo={data.label} selecionado={selected}>
      <Handle type="target" position={Position.Top} style={estiloHandle(cor)} />

      <p style={estiloTexto} title={data.prompt}>
        {data.prompt || <span style={estiloVazio}>Sem prompt definido</span>}
      </p>

      {data.salvarEm && <span style={estiloBadge(cor)}>salva em: {data.salvarEm}</span>}

      <Handle type="source" position={Position.Bottom} style={estiloHandle(cor)} />
    </NoBase>
  );
}
