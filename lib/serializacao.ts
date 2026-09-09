import type {
  Aresta,
  Fluxo,
  NoDoFluxo,
  Opcao,
  Regra,
  TipoDeNo,
} from "@/modelo/tipos";
import { motivoParaRecusar } from "@/lib/validacao";
import { derivarInicio } from "@/lib/percurso";

export const VERSAO_DO_SCHEMA = 1;

function objeto(json: unknown, onde: string): Record<string, unknown> {
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    throw new Error(`${onde}: esperava um objeto`);
  }
  return json as Record<string, unknown>;
}

function texto(valor: unknown, onde: string): string {
  if (typeof valor !== "string") {
    throw new Error(`${onde}: esperava texto, recebeu ${typeof valor}`);
  }
  return valor;
}

export function validarRegra(json: unknown): Regra {
  const { chave, operador, valor } = objeto(json, "Regra inválida");
  const nomeDaChave = texto(chave, "Regra inválida: chave");

  if (operador === "existe") {
    return { chave: nomeDaChave, operador };
  }

  if (operador === "maior") {
    if (typeof valor !== "number") {
      throw new Error(
        `Regra inválida: operador "maior" exige valor numérico, recebeu ${typeof valor}`,
      );
    }
    return { chave: nomeDaChave, operador, valor };
  }

  if (
    operador === "igual" ||
    operador === "diferente" ||
    operador === "contem"
  ) {
    return {
      chave: nomeDaChave,
      operador,
      valor: texto(valor, `Regra inválida: valor de "${operador}"`),
    };
  }

  throw new Error(
    `Regra inválida: operador desconhecido "${String(operador)}"`,
  );
}

function validarOpcao(json: unknown): Opcao {
  const { id, rotulo } = objeto(json, "Opção inválida");
  return {
    id: texto(id, "Opção inválida: id"),
    rotulo: texto(rotulo, "Opção inválida: rótulo"),
  };
}

function validarPosicao(json: unknown): { x: number; y: number } {
  const { x, y } = objeto(json, "Posição inválida");
  if (typeof x !== "number" || typeof y !== "number") {
    throw new Error("Posição inválida: x e y devem ser números");
  }
  return { x, y };
}

export function validarNo(json: unknown): NoDoFluxo {
  const bruto = objeto(json, "Nó inválido");
  const id = texto(bruto.id, "Nó inválido: id");
  const position = validarPosicao(bruto.position);
  const dados = objeto(bruto.data, `Nó "${id}": data`);
  const label = texto(dados.label, `Nó "${id}": label`);
  const tipo = bruto.type as TipoDeNo;

  switch (tipo) {
    case "mensagem":
      return {
        id,
        type: tipo,
        position,
        data: { label, texto: texto(dados.texto, `Nó "${id}": texto`) },
      };

    case "pergunta": {
      if (!Array.isArray(dados.opcoes)) {
        throw new Error(`Nó "${id}": opcoes deve ser uma lista`);
      }
      return {
        id,
        type: tipo,
        position,
        data: {
          label,
          opcoes: dados.opcoes.map(validarOpcao),
          salvarEm: texto(dados.salvarEm, `Nó "${id}": salvarEm`),
        },
      };
    }

    case "condicional":
      return {
        id,
        type: tipo,
        position,
        data: { label, regra: validarRegra(dados.regra) },
      };

    case "llm":
      return {
        id,
        type: tipo,
        position,
        data: {
          label,
          prompt: texto(dados.prompt, `Nó "${id}": prompt`),
          salvarEm: texto(dados.salvarEm, `Nó "${id}": salvarEm`),
        },
      };

    case "fim":
      return { id, type: tipo, position, data: { label } };
  }

  throw new Error(`Nó "${id}": tipo desconhecido "${String(bruto.type)}"`);
}

export function validarAresta(json: unknown): Aresta {
  const bruto = objeto(json, "Aresta inválida");
  const aresta: Aresta = {
    id: texto(bruto.id, "Aresta inválida: id"),
    source: texto(bruto.source, "Aresta inválida: source"),
    target: texto(bruto.target, "Aresta inválida: target"),
  };

  if (bruto.sourceHandle !== undefined && bruto.sourceHandle !== null) {
    aresta.sourceHandle = texto(
      bruto.sourceHandle,
      `Aresta "${aresta.id}": sourceHandle`,
    );
  }

  return aresta;
}

/**
 * Fronteira de import: transforma o resultado cru de um `JSON.parse` em um
 * `Fluxo` de verdade, ou explica por que não dá.
 *
 * Tipo não existe em tempo de execução, então nada aqui pode ser `as Fluxo` —
 * é campo por campo mesmo. As arestas passam pela mesma `motivoParaRecusar`
 * que o canvas usa no arrasto, acumuladas uma a uma para que a regra de "uma
 * aresta por saída" enxergue as anteriores.
 */
export function validarFluxo(json: unknown): Fluxo {
  const bruto = objeto(json, "Fluxo inválido");

  if (bruto.versao !== VERSAO_DO_SCHEMA) {
    throw new Error(
      `Fluxo inválido: versão ${String(bruto.versao)}, esperava ${VERSAO_DO_SCHEMA}`,
    );
  }

  if (!Array.isArray(bruto.nos) || !Array.isArray(bruto.arestas)) {
    throw new Error("Fluxo inválido: nos e arestas devem ser listas");
  }

  const nos = bruto.nos.map(validarNo);

  const idsRepetidos = nos.length !== new Set(nos.map((no) => no.id)).size;
  if (idsRepetidos) {
    throw new Error("Fluxo inválido: existem nós com o mesmo id");
  }

  const arestas: Aresta[] = [];
  for (const cru of bruto.arestas) {
    const aresta = validarAresta(cru);
    const motivo = motivoParaRecusar(nos, arestas, aresta);
    if (motivo) {
      throw new Error(`Aresta "${aresta.id}" inválida: ${motivo}`);
    }
    arestas.push(aresta);
  }

  // `inicio` ausente é aceito e derivado: um JSON gerado antes desse campo
  // existir continua importável. Ambíguo demais para derivar vira `null`, que
  // a travessia reporta como problema em vez de escolher um nó no escuro.
  const inicio =
    bruto.inicio === undefined || bruto.inicio === null
      ? derivarInicio(nos, arestas)
      : texto(bruto.inicio, "Fluxo inválido: inicio");

  if (inicio !== null && !nos.some((no) => no.id === inicio)) {
    throw new Error(`Fluxo inválido: nó inicial "${inicio}" não existe`);
  }

  return { versao: VERSAO_DO_SCHEMA, inicio, nos, arestas };
}

function noParaExportar(no: NoDoFluxo): NoDoFluxo {
  const { measured, selected, dragging, ...limpo } = no;
  return limpo;
}

export function serializarFluxo(fluxo: Fluxo): string {
  const limpo: Fluxo = { ...fluxo, nos: fluxo.nos.map(noParaExportar) };
  return JSON.stringify(limpo, null, 2);
}
