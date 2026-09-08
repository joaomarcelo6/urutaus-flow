import type { NoDoFluxo, TipoDeNo } from "@/modelo/tipos";
import { nuncaAcontece } from "@/lib/exaustividade";

type Posicao = { x: number; y: number };

/**
 * Os tipos que existem, em forma de valor — o `TipoDeNo` some na compilação e
 * o drop precisa checar uma string qualquer vinda do dataTransfer. O tipo
 * `Record<TipoDeNo, true>` é o que mantém as duas listas juntas: um tipo novo
 * na união quebra o build aqui até ganhar entrada.
 */
const RECONHECIDOS: Record<TipoDeNo, true> = {
  mensagem: true,
  pergunta: true,
  condicional: true,
  llm: true,
  fim: true,
};

export function ehTipoDeNo(valor: string): valor is TipoDeNo {
  return Object.hasOwn(RECONHECIDOS, valor);
}

function id(): string {
  return crypto.randomUUID();
}

/**
 * Nó novo, com o `data` mínimo que o tipo exige. Campos de texto nascem
 * vazios de propósito: o painel de edição é onde eles se preenchem, e um
 * placeholder gravado como conteúdo real acabaria exportado no JSON.
 */
export function criarNo(tipo: TipoDeNo, position: Posicao): NoDoFluxo {
  switch (tipo) {
    case "mensagem":
      return {
        id: id(),
        type: tipo,
        position,
        data: { label: "Mensagem", texto: "" },
      };

    case "pergunta":
      return {
        id: id(),
        type: tipo,
        position,
        data: {
          label: "Pergunta",
          opcoes: [
            { id: id(), rotulo: "Opção 1" },
            { id: id(), rotulo: "Opção 2" },
          ],
          salvarEm: "",
        },
      };

    case "condicional":
      return {
        id: id(),
        type: tipo,
        position,
        data: { label: "Condição", regra: { chave: "", operador: "existe" } },
      };

    case "llm":
      return {
        id: id(),
        type: tipo,
        position,
        data: { label: "IA", prompt: "", salvarEm: "" },
      };

    case "fim":
      return { id: id(), type: tipo, position, data: { label: "Fim" } };
  }

  return nuncaAcontece(tipo);
}
