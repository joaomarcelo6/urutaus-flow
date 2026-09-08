import type { CSSProperties, ReactNode } from "react";
import type { NoDoFluxo, Operador, Regra } from "@/modelo/tipos";
import { nuncaAcontece } from "@/lib/exaustividade";

const OPERADORES: Operador[] = [
  "igual",
  "diferente",
  "maior",
  "contem",
  "existe",
];

type Props = {
  no: NoDoFluxo | undefined;
  aoAtualizar: (no: NoDoFluxo) => void;
};

const estiloPainel: CSSProperties = {
  width: 280,
  height: "100%",
  borderLeft: "1px solid #e2e2e2",
  background: "#fafafa",
  padding: 16,
  boxSizing: "border-box",
  overflowY: "auto",
  fontFamily: "system-ui, sans-serif",
};

const estiloInput: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "6px 8px",
  borderRadius: 6,
  border: "1px solid #ccc",
  fontSize: 13,
  fontFamily: "inherit",
};

function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        marginBottom: 12,
        fontSize: 12,
        color: "#444",
      }}
    >
      <span style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>
        {rotulo}
      </span>
      {children}
    </label>
  );
}

export default function PainelEdicao({ no, aoAtualizar }: Props) {
  if (!no) {
    return (
      <aside style={estiloPainel}>
        <p style={{ color: "#999", fontStyle: "italic", fontSize: 13 }}>
          Selecione um nó no canvas para editar.
        </p>
      </aside>
    );
  }

  switch (no.type) {
    case "mensagem":
      return (
        <aside style={estiloPainel}>
          <Campo rotulo="Rótulo">
            <input
              style={estiloInput}
              value={no.data.label}
              onChange={(e) =>
                aoAtualizar({
                  ...no,
                  data: { ...no.data, label: e.target.value },
                })
              }
            />
          </Campo>
          <Campo rotulo="Texto da mensagem">
            <textarea
              style={{ ...estiloInput, minHeight: 80, resize: "vertical" }}
              value={no.data.texto}
              onChange={(e) =>
                aoAtualizar({
                  ...no,
                  data: { ...no.data, texto: e.target.value },
                })
              }
            />
          </Campo>
        </aside>
      );

    case "pergunta":
      return (
        <aside style={estiloPainel}>
          <Campo rotulo="Rótulo">
            <input
              style={estiloInput}
              value={no.data.label}
              onChange={(e) =>
                aoAtualizar({
                  ...no,
                  data: { ...no.data, label: e.target.value },
                })
              }
            />
          </Campo>
          <Campo rotulo="Salvar resposta em">
            <input
              style={estiloInput}
              value={no.data.salvarEm}
              onChange={(e) =>
                aoAtualizar({
                  ...no,
                  data: { ...no.data, salvarEm: e.target.value },
                })
              }
            />
          </Campo>
          <Campo rotulo="Opções">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {no.data.opcoes.map((opcao, indice) => (
                <input
                  key={opcao.id}
                  style={estiloInput}
                  value={opcao.rotulo}
                  onChange={(e) => {
                    const opcoes = [...no.data.opcoes];
                    opcoes[indice] = { ...opcao, rotulo: e.target.value };
                    aoAtualizar({ ...no, data: { ...no.data, opcoes } });
                  }}
                />
              ))}
            </div>
          </Campo>
        </aside>
      );

    case "condicional": {
      const regra = no.data.regra;
      return (
        <aside style={estiloPainel}>
          <Campo rotulo="Rótulo">
            <input
              style={estiloInput}
              value={no.data.label}
              onChange={(e) =>
                aoAtualizar({
                  ...no,
                  data: { ...no.data, label: e.target.value },
                })
              }
            />
          </Campo>
          <Campo rotulo="Chave do contexto">
            <input
              style={estiloInput}
              value={regra.chave}
              onChange={(e) =>
                aoAtualizar({
                  ...no,
                  data: {
                    ...no.data,
                    regra: { ...regra, chave: e.target.value },
                  },
                })
              }
            />
          </Campo>
          <Campo rotulo="Operador">
            <select
              style={estiloInput}
              value={regra.operador}
              onChange={(e) => {
                const operador = e.target.value as Operador;
                let novaRegra: Regra;
                switch (operador) {
                  case "existe":
                    novaRegra = { chave: regra.chave, operador };
                    break;
                  case "maior":
                    novaRegra = {
                      chave: regra.chave,
                      operador,
                      valor: regra.operador === "maior" ? regra.valor : 0,
                    };
                    break;
                  case "igual":
                  case "diferente":
                  case "contem":
                    novaRegra = {
                      chave: regra.chave,
                      operador,
                      valor:
                        regra.operador !== "existe" &&
                        regra.operador !== "maior"
                          ? regra.valor
                          : "",
                    };
                    break;
                  default:
                    return nuncaAcontece(operador);
                }
                aoAtualizar({ ...no, data: { ...no.data, regra: novaRegra } });
              }}
            >
              {OPERADORES.map((operador) => (
                <option key={operador} value={operador}>
                  {operador}
                </option>
              ))}
            </select>
          </Campo>
          {regra.operador !== "existe" &&
            (regra.operador === "maior" ? (
              <Campo rotulo="Valor">
                <input
                  type="number"
                  style={estiloInput}
                  value={regra.valor}
                  onChange={(e) => {
                    const numero = e.target.valueAsNumber;
                    if (Number.isNaN(numero)) return;
                    aoAtualizar({
                      ...no,
                      data: {
                        ...no.data,
                        regra: { ...regra, valor: numero },
                      },
                    });
                  }}
                />
              </Campo>
            ) : (
              <Campo rotulo="Valor">
                <input
                  style={estiloInput}
                  value={regra.valor}
                  onChange={(e) =>
                    aoAtualizar({
                      ...no,
                      data: {
                        ...no.data,
                        regra: { ...regra, valor: e.target.value },
                      },
                    })
                  }
                />
              </Campo>
            ))}
        </aside>
      );
    }

    case "llm":
      return (
        <aside style={estiloPainel}>
          <Campo rotulo="Rótulo">
            <input
              style={estiloInput}
              value={no.data.label}
              onChange={(e) =>
                aoAtualizar({
                  ...no,
                  data: { ...no.data, label: e.target.value },
                })
              }
            />
          </Campo>
          <Campo rotulo="Prompt">
            <textarea
              style={{ ...estiloInput, minHeight: 80, resize: "vertical" }}
              value={no.data.prompt}
              onChange={(e) =>
                aoAtualizar({
                  ...no,
                  data: { ...no.data, prompt: e.target.value },
                })
              }
            />
          </Campo>
          <Campo rotulo="Salvar resposta em">
            <input
              style={estiloInput}
              value={no.data.salvarEm}
              onChange={(e) =>
                aoAtualizar({
                  ...no,
                  data: { ...no.data, salvarEm: e.target.value },
                })
              }
            />
          </Campo>
        </aside>
      );

    case "fim":
      return (
        <aside style={estiloPainel}>
          <Campo rotulo="Rótulo">
            <input
              style={estiloInput}
              value={no.data.label}
              onChange={(e) =>
                aoAtualizar({
                  ...no,
                  data: { ...no.data, label: e.target.value },
                })
              }
            />
          </Campo>
        </aside>
      );
  }

  return nuncaAcontece(no);
  return null;
}
