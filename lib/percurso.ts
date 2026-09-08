import type { Aresta, Fluxo, NoDoFluxo } from "@/modelo/tipos";
import { handlesDeSaida, nomeDaSaida } from "@/lib/handles";

export type Problema = {
  gravidade: "erro" | "aviso";
  tipo: "sem-inicio" | "inalcancavel" | "saida-vazia" | "sem-fim" | "ciclo";
  noId: string | null;
  mensagem: string;
};

/** Ids dos nós alcançáveis a partir de `origem`, seguindo as arestas. */
function alcancaveis(
  origem: string,
  vizinhos: Map<string, string[]>,
): Set<string> {
  const vistos = new Set<string>([origem]);
  const fila = [origem];

  while (fila.length > 0) {
    const atual = fila.shift() as string;
    for (const proximo of vizinhos.get(atual) ?? []) {
      if (!vistos.has(proximo)) {
        vistos.add(proximo);
        fila.push(proximo);
      }
    }
  }

  return vistos;
}

/** `destino -> origens`: as arestas ao contrário, para andar de trás pra frente. */
function inverter(arestas: Aresta[]): Map<string, string[]> {
  const mapa = new Map<string, string[]>();
  for (const aresta of arestas) {
    mapa.set(aresta.target, [...(mapa.get(aresta.target) ?? []), aresta.source]);
  }
  return mapa;
}

function adjacencia(arestas: Aresta[]): Map<string, string[]> {
  const mapa = new Map<string, string[]>();
  for (const aresta of arestas) {
    mapa.set(aresta.source, [...(mapa.get(aresta.source) ?? []), aresta.target]);
  }
  return mapa;
}

/**
 * Ids dos nós que participam de algum ciclo, por busca em profundidade: um nó
 * ainda na pilha da recursão que aparece de novo fecha um ciclo.
 */
function nosEmCiclo(
  nos: NoDoFluxo[],
  vizinhos: Map<string, string[]>,
): Set<string> {
  const emCiclo = new Set<string>();
  const encerrados = new Set<string>();
  const naPilha = new Set<string>();

  function visitar(id: string) {
    naPilha.add(id);

    for (const proximo of vizinhos.get(id) ?? []) {
      if (naPilha.has(proximo)) {
        emCiclo.add(proximo);
      } else if (!encerrados.has(proximo)) {
        visitar(proximo);
      }
    }

    naPilha.delete(id);
    encerrados.add(id);
  }

  for (const no of nos) {
    if (!encerrados.has(no.id)) {
      visitar(no.id);
    }
  }

  return emCiclo;
}

/**
 * Tudo que está errado no fluxo, do ponto de vista de quem vai executá-lo.
 *
 * Separado de `podeConectar` de propósito: aquilo é sobre uma aresta por vez e
 * pode recusar na hora do arrasto; isto é sobre o grafo inteiro e só faz
 * sentido depois que o fluxo está montado — um nó recém-solto na tela ainda
 * não tem saída ligada, e isso não é erro enquanto se está editando.
 */
export function encontrarProblemas(fluxo: Fluxo): Problema[] {
  const { nos, arestas, inicio } = fluxo;
  const problemas: Problema[] = [];

  if (nos.length === 0) {
    return problemas;
  }

  if (inicio === null) {
    problemas.push({
      gravidade: "erro",
      tipo: "sem-inicio",
      noId: null,
      mensagem: "O fluxo não tem nó inicial definido",
    });
    return problemas;
  }

  if (!nos.some((no) => no.id === inicio)) {
    problemas.push({
      gravidade: "erro",
      tipo: "sem-inicio",
      noId: null,
      mensagem: `O nó inicial "${inicio}" não existe no fluxo`,
    });
    return problemas;
  }

  const vizinhos = adjacencia(arestas);
  const doInicio = alcancaveis(inicio, vizinhos);

  for (const no of nos) {
    if (!doInicio.has(no.id)) {
      problemas.push({
        gravidade: "erro",
        tipo: "inalcancavel",
        noId: no.id,
        mensagem: `"${no.data.label}" nunca é alcançado a partir do início`,
      });
    }
  }

  // Saída declarada pelo tipo do nó que não tem aresta nenhuma saindo dela.
  for (const no of nos) {
    if (!doInicio.has(no.id)) continue;

    for (const handle of handlesDeSaida(no)) {
      const ligada = arestas.some(
        (aresta) =>
          aresta.source === no.id && (aresta.sourceHandle ?? null) === handle,
      );

      if (!ligada) {
        problemas.push({
          gravidade: "erro",
          tipo: "saida-vazia",
          noId: no.id,
          mensagem:
            handle === null
              ? `"${no.data.label}" não leva a lugar nenhum`
              : `A ${nomeDaSaida(no, handle)} de "${no.data.label}" não leva a lugar nenhum`,
        });
      }
    }
  }

  // Quem não consegue chegar a nenhum nó de fim: a conversa nunca se despede.
  const anteriores = inverter(arestas);
  const chegamAoFim = new Set<string>();
  for (const no of nos) {
    if (no.type === "fim") {
      for (const id of alcancaveis(no.id, anteriores)) {
        chegamAoFim.add(id);
      }
    }
  }

  for (const no of nos) {
    if (doInicio.has(no.id) && !chegamAoFim.has(no.id)) {
      problemas.push({
        gravidade: "erro",
        tipo: "sem-fim",
        noId: no.id,
        mensagem: `De "${no.data.label}" não há caminho até um nó de fim`,
      });
    }
  }

  // Ciclo é aviso, não erro: menu que volta ao início é fluxo legítimo.
  for (const id of nosEmCiclo(nos, vizinhos)) {
    const no = nos.find((candidato) => candidato.id === id);
    problemas.push({
      gravidade: "aviso",
      tipo: "ciclo",
      noId: id,
      mensagem: `"${no?.data.label ?? id}" faz parte de um ciclo`,
    });
  }

  return problemas;
}

/**
 * Chute de qual nó é o início, para fluxo que ainda não tem `inicio` gravado
 * (primeiro nó solto na tela, ou JSON antigo importado). Só responde quando a
 * resposta é única — zero ou vários candidatos viram erro de validação, não
 * uma escolha silenciosa.
 */
export function derivarInicio(nos: NoDoFluxo[], arestas: Aresta[]): string | null {
  const temEntrada = new Set(arestas.map((aresta) => aresta.target));
  const candidatos = nos.filter((no) => !temEntrada.has(no.id));

  return candidatos.length === 1 ? candidatos[0].id : null;
}
