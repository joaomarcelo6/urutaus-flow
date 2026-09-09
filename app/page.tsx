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
import { serializarFluxo } from "@/lib/serializacao";

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
    id: "boas-vindas",
    type: "mensagem",
    position: { x: 0, y: 0 },
    data: {
      label: "Boas-vindas",
      texto:
        "Olá! Aqui é o assistente da Escola de Teatro Bastidores. Posso ajudar com matrículas e espetáculos.",
    },
  },
  {
    id: "menu",
    type: "pergunta",
    position: { x: 0, y: 140 },
    data: {
      label: "Menu principal",
      salvarEm: "intencao",
      opcoes: [
        { id: "op-matricula", rotulo: "Matrícula em turma" },
        { id: "op-ingresso", rotulo: "Ingressos do espetáculo" },
        { id: "op-secretaria", rotulo: "Falar com a secretaria" },
      ],
    },
  },
  {
    id: "coleta-idade",
    type: "llm",
    position: { x: -280, y: 300 },
    data: {
      label: "Coletar idade do aluno",
      prompt:
        "Pergunte a idade de quem vai fazer as aulas e responda apenas com o número, sem texto.",
      salvarEm: "idade",
    },
  },
  {
    id: "checa-idade",
    type: "condicional",
    position: { x: -280, y: 440 },
    data: {
      label: "18 anos ou mais?",
      regra: { chave: "idade", operador: "maior", valor: 17 },
    },
  },
  {
    id: "turma-adulto",
    type: "mensagem",
    position: { x: -440, y: 590 },
    data: {
      label: "Turma adulta",
      texto:
        "A turma adulta tem aulas às terças e quintas, das 19h às 21h. Posso reservar sua vaga?",
    },
  },
  {
    id: "turma-juvenil",
    type: "mensagem",
    position: { x: -160, y: 590 },
    data: {
      label: "Turma juvenil",
      texto:
        "A turma juvenil tem aulas aos sábados, das 10h às 12h. A matrícula é feita por um responsável.",
    },
  },
  {
    id: "ingressos",
    type: "mensagem",
    position: { x: 60, y: 300 },
    data: {
      label: "Ingressos",
      texto:
        "Nosso espetáculo tem sessões sexta e sábado às 20h. Ingressos na bilheteria ou pelo site.",
    },
  },
  {
    id: "secretaria",
    type: "mensagem",
    position: { x: 340, y: 300 },
    data: {
      label: "Transferir",
      texto: "Certo! Vou te transferir para a secretaria da escola.",
    },
  },
  {
    id: "fim",
    type: "fim",
    position: { x: 0, y: 760 },
    data: { label: "Fim da conversa" },
  },
];

const arestasIniciais: Edge[] = [
  { id: "a1", source: "boas-vindas", target: "menu" },
  {
    id: "a2",
    source: "menu",
    sourceHandle: "op-matricula",
    target: "coleta-idade",
  },
  {
    id: "a3",
    source: "menu",
    sourceHandle: "op-ingresso",
    target: "ingressos",
  },
  {
    id: "a4",
    source: "menu",
    sourceHandle: "op-secretaria",
    target: "secretaria",
  },
  { id: "a5", source: "coleta-idade", target: "checa-idade" },
  {
    id: "a6",
    source: "checa-idade",
    sourceHandle: "verdadeiro",
    target: "turma-adulto",
  },
  {
    id: "a7",
    source: "checa-idade",
    sourceHandle: "falso",
    target: "turma-juvenil",
  },
  { id: "a8", source: "turma-adulto", target: "fim" },
  { id: "a9", source: "turma-juvenil", target: "fim" },
  { id: "a10", source: "ingressos", target: "fim" },
  { id: "a11", source: "secretaria", target: "fim" },
];

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
  const [inicio, setInicio] = useState<string | null>("boas-vindas");

  const { screenToFlowPosition } = useReactFlow();

  const aoConectar = useCallback(
    (conexao: Connection) => setArestas((atuais) => addEdge(conexao, atuais)),
    [setArestas],
  );

  const aoExportar = useCallback(() => {
    const texto = serializarFluxo({ versao: 1, inicio, nos, arestas });

    const blob = new Blob([texto], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fluxo.json";
    link.click();
    URL.revokeObjectURL(url);
  }, [inicio, nos, arestas]);

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
        <button
          onClick={aoExportar}
          style={{
            margin: 8,
            padding: "8px 12px",
            borderRadius: 8,
            borderWidth: 0,
            background: "#25d366",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "system-ui, sans-serif",
            cursor: "pointer",
          }}
        >
          Exportar JSON
        </button>
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
