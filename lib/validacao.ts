import type { Aresta, Conexao, NoDoFluxo } from "@/modelo/tipos";
import { handlesDeSaida, nomeDaSaida } from "@/lib/handles";

/**
 * Normaliza o handle de saída. O React Flow usa `null` quando o nó tem uma
 * saída só, mas uma aresta vinda de JSON pode simplesmente não trazer o campo.
 * Sem isso, `undefined` e `null` contariam como handles diferentes e o mesmo
 * handle aceitaria duas arestas.
 */
function saidaDe(conexao: Conexao): string | null {
  return conexao.sourceHandle ?? null;
}

/**
 * Por que essa conexão não pode existir, ou `null` se ela pode.
 *
 * Pura sobre `(nos, arestas, conexao)`: não lê estado do React. Tem dois
 * chamadores — `isValidConnection` no canvas, que previne o arrasto, e a
 * validação de import, que recusa JSON de fora. Escrever acoplada ao React
 * obrigaria a duplicar a regra no import, que é onde a garantia importa.
 */
export function motivoParaRecusar(
  nos: NoDoFluxo[],
  arestas: Aresta[],
  conexao: Conexao,
): string | null {
  const origem = nos.find((no) => no.id === conexao.source);
  const destino = nos.find((no) => no.id === conexao.target);

  if (!origem) {
    return `Nó de origem "${conexao.source}" não existe`;
  }

  if (!destino) {
    return `Nó de destino "${conexao.target}" não existe`;
  }

  if (conexao.source === conexao.target) {
    return "Um nó não pode conectar nele mesmo";
  }

  const saida = saidaDe(conexao);
  const saidasDoNo = handlesDeSaida(origem);

  if (saidasDoNo.length === 0) {
    return `Nó "${origem.data.label}" é um fim de conversa e não tem saída`;
  }

  if (!saidasDoNo.includes(saida)) {
    return `Nó "${origem.data.label}" não tem a saída "${saida}"`;
  }

  // A partir daqui o handle existe, então dá para nomeá-lo de forma legível.

  const jaOcupada = arestas.some(
    (aresta) => aresta.source === conexao.source && saidaDe(aresta) === saida,
  );

  if (jaOcupada) {
    return `A ${nomeDaSaida(origem, saida)} de "${origem.data.label}" já leva a outro nó`;
  }

  return null;
}

/** `motivoParaRecusar` como booleano, que é o que `isValidConnection` espera. */
export function podeConectar(
  nos: NoDoFluxo[],
  arestas: Aresta[],
  conexao: Conexao,
): boolean {
  return motivoParaRecusar(nos, arestas, conexao) === null;
}
