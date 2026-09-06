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
];

const arestasIniciais: Edge[] = [{ id: "e1-2", source: "1", target: "2" }];

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
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
