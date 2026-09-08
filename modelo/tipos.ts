import type { Node } from "@xyflow/react";

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
