"use client";

import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type Edge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { NoDoFluxo } from "@/modelo/tipos";

import NoMensagemComponente from "@/componentes/NoMensagem";
import NoFimComponente from "@/componentes/NoFim";
import NoPerguntaComponente from "@/componentes/NoPergunta";

const nosIniciais: NoDoFluxo[] = [
  {
    id: "1",
    type: "mensagem",
    position: { x: 0, y: 0 },
    data: { label: "Boas-vindas", texto: "Olá! Tudo bem?" },
  },
  {
    id: "2",
    type: "fim",
    position: { x: 0, y: 160 },
    data: { label: "Fim" },
  },
  {
    id: "3",
    type: "pergunta",
    position: { x: -300, y: 60 },
    data: {
      label: "Escolha",
      opcoes: [
        { id: "op_sim", rotulo: "sim" },
        { id: "op_nao", rotulo: "não" },
      ],
      salvarEm: "aqui",
    },
  },
];

const arestasIniciais: Edge[] = [{ id: "e1-2", source: "1", target: "2" }];

const nodeTypes = {
  mensagem: NoMensagemComponente,
  fim: NoFimComponente,
  pergunta: NoPerguntaComponente,
};

export default function Page() {
  const [nos, setNos, aoMudarNos] = useNodesState<NoDoFluxo>(nosIniciais);
  const [arestas, setArestas, aoMudarArestas] =
    useEdgesState<Edge>(arestasIniciais);

  const aoConectar = useCallback(
    (conexao: Connection) => setArestas((atuais) => addEdge(conexao, atuais)),
    [setArestas],
  );

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nos}
        edges={arestas}
        onNodesChange={aoMudarNos}
        onEdgesChange={aoMudarArestas}
        onConnect={aoConectar}
        fitView
        nodeTypes={nodeTypes}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
