import type { Edge, Node } from "@xyflow/react";

export type Contexto = { [chave: string]: string };

export type DadosMensagem = {
  label: string;
  texto: string;
};

export type Opcao = { id: string; rotulo: string };
export type DadosPergunta = {
  label: string;
  opcoes: Opcao[];
  salvarEm: string;
};

export type RegraExiste = { chave: string; operador: "existe" };
export type RegraTexto = {
  chave: string;
  operador: "igual" | "diferente" | "contem";
  valor: string;
};
export type RegraNumerica = { chave: string; operador: "maior"; valor: number };
export type Regra = RegraExiste | RegraTexto | RegraNumerica;

export type Operador = Regra["operador"];

export type DadosCondicional = {
  label: string;
  regra: Regra;
};

export type DadosLLM = {
  label: string;
  prompt: string;
  salvarEm: string;
};

export type DadosFim = {
  label: string;
};

export type NoMensagem = Node<DadosMensagem, "mensagem">;

export type NoPergunta = Node<DadosPergunta, "pergunta">;

export type NoCondicional = Node<DadosCondicional, "condicional">;

export type NoLLM = Node<DadosLLM, "llm">;

export type NoFim = Node<DadosFim, "fim">;

export type NoDoFluxo = NoMensagem | NoPergunta | NoCondicional | NoLLM | NoFim;

export type TipoDeNo = NonNullable<NoDoFluxo["type"]>;

export type Aresta = Edge;

/**
 * Forma comum entre uma conexão sendo arrastada na tela (`Connection` do React
 * Flow) e uma aresta já existente (`Aresta`). É o que `podeConectar` recebe,
 * para valer nos dois chamadores sem duplicar regra.
 */
export type Conexao = {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

/**
 * O grafo inteiro, como sai no JSON exportado. O ponto de entrada é
 * propriedade do fluxo, não de um nó — por isso `inicio` mora aqui.
 */
export type Fluxo = {
  versao: 1;
  inicio: string | null;
  nos: NoDoFluxo[];
  arestas: Aresta[];
};
