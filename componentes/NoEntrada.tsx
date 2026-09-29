import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { NoEntrada } from "@/modelo/tipos";
import NoBase, {
  corDoNo,
  estiloBadge,
  estiloHandle,
  estiloTexto,
  estiloVazio,
} from "@/componentes/NoBase";

export default function NoEntradaComponente({ data, selected }: NodeProps<NoEntrada>) {
  const cor = corDoNo("entrada");

  return (
    <NoBase tipo="entrada" titulo={data.label} selecionado={selected}>
      <Handle type="target" position={Position.Top} style={estiloHandle(cor)} />

      <p style={estiloTexto} title={data.texto}>
        {data.texto || <span style={estiloVazio}>Sem pergunta definida</span>}
      </p>

      {data.salvarEm && <span style={estiloBadge(cor)}>salva em: {data.salvarEm}</span>}

      <Handle type="source" position={Position.Bottom} style={estiloHandle(cor)} />
    </NoBase>
  );
}
