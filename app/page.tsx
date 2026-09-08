"use client";

import { useCallback, useMemo, useState, type DragEvent } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Edge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { NoDoFluxo } from "@/modelo/tipos";
import { podeConectar } from "@/lib/validacao";
import { encontrarProblemas } from "@/lib/percurso";
import { criarNo, ehTipoDeNo } from "@/lib/criarNo";

import NoMensagemComponente from "@/componentes/NoMensagem";
import NoFimComponente from "@/componentes/NoFim";
import NoPerguntaComponente from "@/componentes/NoPergunta";
import NoLLMComponente from "@/componentes/NoLLM";
import NoCondicionalComponente from "@/componentes/NoCondicional";
import PainelEdicao from "@/componentes/PainelEdicao";
import PainelProblemas from "@/componentes/PainelProblemas";
import Sidebar, { FORMATO_ARRASTO } from "@/componentes/Sidebar";

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

const nodeTypes = {
  mensagem: NoMensagemComponente,
  fim: NoFimComponente,
  pergunta: NoPerguntaComponente,
  condicional: NoCondicionalComponente,
  llm: NoLLMComponente,
};

function Editor() {
  const [nos, setNos, aoMudarNos] = useNodesState<NoDoFluxo>(nosIniciais);
  const [arestas, setArestas, aoMudarArestas] =
    useEdgesState<Edge>(arestasIniciais);
  const [inicio, setInicio] = useState<string | null>("1");

  const { screenToFlowPosition } = useReactFlow();

  const aoConectar = useCallback(
    (conexao: Connection) => setArestas((atuais) => addEdge(conexao, atuais)),
    [setArestas],
  );

  /**
   * O React Flow chama isso durante o arrasto e recusa a ligação quando dá
   * falso. Mesma função que a validação de import usa — a regra mora em
   * `lib/validacao.ts`, aqui só se liga o fio.
   */
  const conexaoValida = useCallback(
    (conexao: Connection | Edge) => podeConectar(nos, arestas, conexao),
    [nos, arestas],
  );

  const aoArrastarSobre = useCallback((evento: DragEvent) => {
    evento.preventDefault();
    evento.dataTransfer.dropEffect = "move";
  }, []);

  /**
   * `screenToFlowPosition` converte a coordenada do ponteiro (pixel da tela)
   * para a coordenada do canvas, que é o que o nó guarda. Sem essa conversão o
   * nó cairia no lugar errado assim que o usuário desse zoom ou pan.
   */
  const aoSoltar = useCallback(
    (evento: DragEvent) => {
      evento.preventDefault();

      const tipo = evento.dataTransfer.getData(FORMATO_ARRASTO);
      if (!ehTipoDeNo(tipo)) return;

      const posicao = screenToFlowPosition({
        x: evento.clientX,
        y: evento.clientY,
      });

      const novo = criarNo(tipo, posicao);
      setNos((atuais) => [...atuais, novo]);

      // Primeiro nó do fluxo vira o início sozinho; depois disso a escolha é
      // explícita, pelo botão no painel.
      setInicio((atual) => atual ?? novo.id);
    },
    [screenToFlowPosition, setNos],
  );

  const aoAtualizarNo = useCallback(
    (noAtualizado: NoDoFluxo) => {
      setNos((atuais) =>
        atuais.map((no) => (no.id === noAtualizado.id ? noAtualizado : no)),
      );
    },
    [setNos],
  );

  const aoSelecionarNo = useCallback(
    (noId: string) => {
      setNos((atuais) =>
        atuais.map((no) => ({ ...no, selected: no.id === noId })),
      );
    },
    [setNos],
  );

  const problemas = useMemo(
    () => encontrarProblemas({ versao: 1, inicio, nos, arestas }),
    [inicio, nos, arestas],
  );

  // O contorno do nó inicial é aparência, não dado: entra como className na
  // hora de renderizar e não suja o `data` que vai para o JSON.
  const nosParaRender = useMemo(
    () =>
      nos.map((no) =>
        no.id === inicio ? { ...no, className: "no-inicial" } : no,
      ),
    [nos, inicio],
  );

  const noSelecionado = nos.find((no) => no.selected);

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
      <div style={{ display: "flex", flexDirection: "column", width: 200 }}>
        <Sidebar />
        <PainelProblemas problemas={problemas} aoSelecionar={aoSelecionarNo} />
      </div>

      <div style={{ flex: 1 }} onDragOver={aoArrastarSobre} onDrop={aoSoltar}>
        <ReactFlow
          nodes={nosParaRender}
          edges={arestas}
          onNodesChange={aoMudarNos}
          onEdgesChange={aoMudarArestas}
          onConnect={aoConectar}
          isValidConnection={conexaoValida}
          fitView
          nodeTypes={nodeTypes}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      <PainelEdicao
        no={noSelecionado}
        ehInicio={noSelecionado?.id === inicio}
        aoAtualizar={aoAtualizarNo}
        aoDefinirInicio={setInicio}
      />
    </div>
  );
}

/**
 * `useReactFlow` (de onde vem `screenToFlowPosition`) só funciona dentro do
 * provider, por isso o editor virou um componente separado.
 */
export default function Page() {
  return (
    <ReactFlowProvider>
      <Editor />
    </ReactFlowProvider>
  );
}
