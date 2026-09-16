"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  type Edge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { NoDoFluxo } from "@/modelo/tipos";
import { podeConectar } from "@/lib/validacao";
import { encontrarProblemas } from "@/lib/percurso";
import { criarNo, ehTipoDeNo } from "@/lib/criarNo";
import { serializarFluxo, validarFluxo } from "@/lib/serializacao";

import NoMensagemComponente from "@/componentes/NoMensagem";
import NoFimComponente from "@/componentes/NoFim";
import NoPerguntaComponente from "@/componentes/NoPergunta";
import NoLLMComponente from "@/componentes/NoLLM";
import NoCondicionalComponente from "@/componentes/NoCondicional";
import PainelEdicao from "@/componentes/PainelEdicao";
import PainelProblemas from "@/componentes/PainelProblemas";

/** Cor das arestas no canvas escuro. Aparência: não entra no JSON. */
const COR_ARESTA = "#9aa0b4";
import PainelRetratil from "@/componentes/PainelRetratil";
import Sidebar, { FORMATO_ARRASTO } from "@/componentes/Sidebar";
import { CASCA } from "@/componentes/casca";

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
    position: { x: 0, y: 200 },
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
    position: { x: 320, y: 420 },
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
    position: { x: 320, y: 620 },
    data: {
      label: "18 anos ou mais?",
      regra: { chave: "idade", operador: "maior", valor: 17 },
    },
  },
  {
    id: "turma-adulto",
    type: "mensagem",
    position: { x: 180, y: 840 },
    data: {
      label: "Turma adulta",
      texto:
        "A turma adulta tem aulas às terças e quintas, das 19h às 21h. Posso reservar sua vaga?",
    },
  },
  {
    id: "turma-juvenil",
    type: "mensagem",
    position: { x: 520, y: 840 },
    data: {
      label: "Turma juvenil",
      texto:
        "A turma juvenil tem aulas aos sábados, das 10h às 12h. A matrícula é feita por um responsável.",
    },
  },
  {
    id: "ingressos",
    type: "mensagem",
    position: { x: 860, y: 420 },
    data: {
      label: "Ingressos",
      texto:
        "Nosso espetáculo tem sessões sexta e sábado às 20h. Ingressos na bilheteria ou pelo site.",
    },
  },
  {
    id: "secretaria",
    type: "mensagem",
    position: { x: 1160, y: 420 },
    data: {
      label: "Transferir",
      texto: "Certo! Vou te transferir para a secretaria da escola.",
    },
  },
  {
    id: "fim",
    type: "fim",
    position: { x: 620, y: 1080 },
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
  const [erroImportacao, setErroImportacao] = useState<string | null>(null);
  const inputImportarRef = useRef<HTMLInputElement>(null);

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
   * `validarFluxo` é a única fronteira de import: ela já valida campo por
   * campo e recusa arestas inválidas, então aqui só se lê o arquivo, parseia
   * e aplica o `Fluxo` que ela devolve. Erro de JSON malformado ou de fluxo
   * inválido caem no mesmo catch — a mensagem que chega até a tela é a da
   * exceção, sem reescrever.
   */
  const aoImportar = useCallback(
    async (evento: ChangeEvent<HTMLInputElement>) => {
      const arquivo = evento.target.files?.[0];
      evento.target.value = "";
      if (!arquivo) return;

      try {
        const texto = await arquivo.text();
        const fluxo = validarFluxo(JSON.parse(texto));
        setNos(fluxo.nos);
        setArestas(fluxo.arestas);
        setInicio(fluxo.inicio);
        setErroImportacao(null);
      } catch (erro) {
        setErroImportacao(erro instanceof Error ? erro.message : String(erro));
      }
    },
    [setNos, setArestas, setInicio],
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

  // Curva da linha e número da opção são aparência, não dado: mesma lógica
  // do `nosParaRender` acima, para não sujar o `arestas` que vai para o JSON.
  const arestasParaRender = useMemo(
    () =>
      arestas.map((aresta) => {
        const comum = {
          ...aresta,
          type: "smoothstep",
          style: { stroke: COR_ARESTA, strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: COR_ARESTA,
            width: 18,
            height: 18,
          },
          labelStyle: { fill: CASCA.texto, fontSize: 11, fontWeight: 600 },
          labelBgStyle: { fill: CASCA.fundoElevado },
          labelBgPadding: [6, 3] as [number, number],
          labelBgBorderRadius: 4,
        };

        const noOrigem = nos.find((no) => no.id === aresta.source);
        if (noOrigem?.type === "pergunta") {
          const indice = noOrigem.data.opcoes.findIndex(
            (opcao) => opcao.id === aresta.sourceHandle,
          );
          if (indice !== -1) {
            return { ...comum, label: String(indice + 1) };
          }
        }
        return comum;
      }),
    [arestas, nos],
  );

  const noSelecionado = nos.find((no) => no.selected);

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        background: CASCA.fundo,
      }}
    >
      <PainelRetratil lado="esquerda" larguraAberta={200}>
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Sidebar />
          <PainelProblemas problemas={problemas} aoSelecionar={aoSelecionarNo} />

          <div style={{ display: "flex", gap: 8, margin: 8 }}>
            <button
              onClick={aoExportar}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                borderWidth: 0,
                background: CASCA.destaque,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "system-ui, sans-serif",
                cursor: "pointer",
              }}
            >
              Exportar JSON
            </button>

            <button
              onClick={() => inputImportarRef.current?.click()}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                border: `1px solid ${CASCA.destaque}`,
                background: `${CASCA.destaque}1a`,
                color: CASCA.destaque,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "system-ui, sans-serif",
                cursor: "pointer",
              }}
            >
              Importar JSON
            </button>
            <input
              ref={inputImportarRef}
              type="file"
              accept="application/json"
              onChange={aoImportar}
              style={{ display: "none" }}
            />
          </div>

          {erroImportacao && (
            <p
              role="alert"
              style={{
                margin: "0 8px 8px",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #e0637a",
                background: "#e0637a1a",
                color: "#e0637a",
                fontSize: 12,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {erroImportacao}
            </p>
          )}
        </div>
      </PainelRetratil>

      <div style={{ flex: 1 }} onDragOver={aoArrastarSobre} onDrop={aoSoltar}>
        <ReactFlow
          nodes={nosParaRender}
          edges={arestasParaRender}
          onNodesChange={aoMudarNos}
          onEdgesChange={aoMudarArestas}
          onConnect={aoConectar}
          isValidConnection={conexaoValida}
          fitView
          nodeTypes={nodeTypes}
          colorMode="dark"
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      <PainelRetratil lado="direita" larguraAberta={280}>
        <PainelEdicao
          no={noSelecionado}
          ehInicio={noSelecionado?.id === inicio}
          aoAtualizar={aoAtualizarNo}
          aoDefinirInicio={setInicio}
        />
      </PainelRetratil>
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
