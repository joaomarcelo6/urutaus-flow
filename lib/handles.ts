import type { NoDoFluxo } from "@/modelo/tipos";
import { nuncaAcontece } from "@/lib/exaustividade";

/**
 * Os handles de saída que cada tipo de nó tem, na mesma ordem em que os
 * componentes os desenham. `null` é o handle sem id — o React Flow grava
 * `sourceHandle: null` na aresta quando o nó só tem uma saída.
 *
 * Fonte única para as duas perguntas que o resto do código faz sobre saídas:
 * "esse sourceHandle existe nesse nó?" (validação) e "esse handle está
 * ligado a alguma coisa?" (travessia).
 */
export function handlesDeSaida(no: NoDoFluxo): (string | null)[] {
  switch (no.type) {
    case "mensagem":
    case "llm":
      return [null];

    case "pergunta":
      return no.data.opcoes.map((opcao) => opcao.id);

    case "condicional":
      return ["verdadeiro", "falso"];

    case "fim":
      return [];
  }

  return nuncaAcontece(no);
}

/**
 * Como chamar uma saída numa mensagem para o usuário. O id do handle de uma
 * opção é um uuid — serve para a aresta apontar, não para alguém ler.
 */
export function nomeDaSaida(no: NoDoFluxo, handle: string | null): string {
  if (handle === null) {
    return "saída";
  }

  if (no.type === "pergunta") {
    const opcao = no.data.opcoes.find((candidata) => candidata.id === handle);
    return `opção "${opcao?.rotulo ?? handle}"`;
  }

  return `saída "${handle}"`;
}
