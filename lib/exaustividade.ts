export function nuncaAcontece(valor: never): never {
  throw new Error(`Caso não tratado: ${JSON.stringify(valor)}`);
}
