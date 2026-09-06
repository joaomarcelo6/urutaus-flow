import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { NoMensagem } from "@/modelo/tipos";
import NoBase, { corDoNo, estiloHandle, estiloTexto, estiloVazio } from "@/componentes/NoBase";

export default function NoMensagemComponente({ data, selected }: NodeProps<NoMensagem>) {
  const cor = corDoNo("mensagem");

  return (
    <NoBase tipo="mensagem" titulo={data.label} selecionado={selected}>
      <Handle type="target" position={Position.Top} style={estiloHandle(cor)} />

      <p style={estiloTexto} title={data.texto}>
        {data.texto || <span style={estiloVazio}>Sem texto definido</span>}
      </p>

      <Handle type="source" position={Position.Bottom} style={estiloHandle(cor)} />
    </NoBase>
  );
}
