import { describe, it, expect } from "vitest";
import { motivoParaRecusar } from "@/lib/validacao";
import type { NoDoFluxo } from "@/modelo/tipos";

describe("motivoParaRecusar", () => {
  it("recusa aresta que sai de um nó de fim", () => {
    const nos: NoDoFluxo[] = [
      {
        id: "1",
        type: "mensagem",
        position: { x: 0, y: 0 },
        data: { label: "Boas-vindas", texto: "Olá! Tudo bem?" },
      },
      {
        id: "2",
        type: "fim",
        position: { x: 0, y: 160 },
        data: { label: "fim de conversa" },
      },
    ];

    const motivo = motivoParaRecusar(nos, [], { source: "2", target: "1" });

    expect(motivo).toContain("não tem saída");
  });
});
