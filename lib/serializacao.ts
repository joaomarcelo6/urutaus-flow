import type { Regra } from "@/modelo/tipos";

export function validarRegra(json: unknown): Regra {
  if (typeof json !== "object" || json === null) {
    throw new Error("Regra inválida: esperava um objeto");
  }

  const { chave, operador, valor } = json as Record<string, unknown>;

  if (typeof chave !== "string") {
    throw new Error("Regra inválida: campo chave deve ser string");
  }

  if (operador === "existe") {
    return { chave, operador };
  }

  if (operador === "maior") {
    if (typeof valor !== "number") {
      throw new Error(
        `Regra inválida: operador "maior" exige valor numérico, recebeu ${typeof valor}`,
      );
    }
    return { chave, operador, valor };
  }

  if (operador === "igual" || operador === "diferente" || operador === "contem") {
    if (typeof valor !== "string") {
      throw new Error(
        `Regra inválida: operador "${operador}" exige valor em texto, recebeu ${typeof valor}`,
      );
    }
    return { chave, operador, valor };
  }

  throw new Error(`Regra inválida: operador desconhecido "${String(operador)}"`);
}
