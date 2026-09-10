# urutaus-flow

Construtor visual de fluxo de chatbot para WhatsApp.
Next.js (App Router) + TypeScript + [`@xyflow/react`](https://reactflow.dev) v12.

Este editor **não executa** o chatbot. Ele produz um arquivo JSON que **descreve**
um fluxo de conversa. Quem conversa com o usuário final é um motor de execução
separado, que lê esse arquivo. Este README especifica o formato desse arquivo,
campo por campo, para quem for escrever esse motor.

## Como rodar

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # testes (vitest)
npx tsc --noEmit # checagem de tipos — o dev server NÃO checa tipos
```

Arraste um bloco da barra lateral para o canvas, ligue as saídas, edite no painel
da direita e clique em **Exportar JSON**.

## Estrutura

| Caminho              | O que é |
|----------------------|---------|
| `modelo/tipos.ts`    | O modelo do domínio. União discriminada de nós, regras do condicional, envelope `Fluxo`. |
| `lib/validacao.ts`   | Se uma conexão pode existir, e por quê. Puro. |
| `lib/percurso.ts`    | Problemas do grafo inteiro: inalcançáveis, saídas vazias, sem fim, ciclos. |
| `lib/handles.ts`     | As saídas que cada tipo de nó tem. Fonte única. |
| `lib/serializacao.ts`| A fronteira do formato: exportação e validação de entrada. |
| `lib/criarNo.ts`     | Nó novo com o `data` mínimo do tipo. |
| `componentes/`       | Os cinco nós, painéis e barra lateral. |
| `decisoes.md`        | Toda decisão de modelagem, com a justificativa. |

---

# Formato do JSON exportado

Toda referência entre elementos é feita por `id` (string), nunca por posição no
array nem por texto visível. Renomear um rótulo na tela não muda a estrutura do
fluxo.

## O envelope

| Campo     | Tipo             | Obrigatório | Descrição |
|-----------|------------------|-------------|-----------|
| `versao`  | `1`              | sim | Versão do schema. Hoje sempre `1`. Arquivo com outra versão é recusado na importação. |
| `inicio`  | `string \| null` | sim | `id` do nó por onde a conversa começa. `null` significa que o fluxo não tem entrada definida — o motor deve recusar executá-lo. |
| `nos`     | `No[]`           | sim | Todos os nós, em ordem arbitrária. A ordem do array não tem significado. |
| `arestas` | `Aresta[]`       | sim | Todas as ligações entre nós. |

O ponto de entrada é propriedade do fluxo, não de um nó: não existe tipo de nó
"início" nem sinalizador dentro de `data`. Um grafo tem um ponto de entrada, e
isso é metadado do grafo inteiro.

## Campos comuns de um nó

| Campo      | Tipo | Obrigatório | Descrição |
|------------|------|-------------|-----------|
| `id`       | `string` | sim | Único dentro do fluxo. Formato não especificado: pode ser um UUID ou um nome legível. Não presuma formato. |
| `type`     | `"mensagem" \| "pergunta" \| "condicional" \| "llm" \| "fim"` | sim | Discriminante. Determina a forma de `data` e quantas saídas o nó tem. |
| `position` | `{ x: number, y: number }` | sim | Coordenada no canvas do editor. **Irrelevante para a execução** — existe para que o editor reabra o arquivo com o desenho preservado. |
| `data`     | objeto | sim | Conteúdo do nó. A forma depende de `type`. |

Nós exportados contêm **apenas** esses quatro campos. Campos internos da
biblioteca de canvas (dimensões medidas, seleção, arrasto) são removidos na
exportação e nunca aparecem no arquivo.

## O `data` de cada tipo

Todo `data` tem `label: string`: o nome do nó na tela do editor. É apenas
apresentação — **o motor deve ignorá-lo**. Quem determina o comportamento do nó é
o campo `type`.

### `mensagem`

Envia um texto ao usuário e segue adiante.

| Campo   | Tipo | Descrição |
|---------|------|-----------|
| `label` | `string` | Apresentação. Ignorado na execução. |
| `texto` | `string` | Conteúdo literal a ser enviado ao usuário. Não há interpolação de variáveis — o texto sai exatamente como está. |

### `pergunta`

Apresenta um menu fechado e aguarda a escolha do usuário.

| Campo      | Tipo | Descrição |
|------------|------|-----------|
| `label`    | `string`  | Apresentação. Ignorado na execução. |
| `opcoes`   | `Opcao[]` | As opções oferecidas, na ordem em que devem ser exibidas. |
| `salvarEm` | `string`  | Nome da chave onde o motor deve gravar a escolha no contexto. Grava o `rotulo` da opção escolhida, não o `id`. |

`Opcao` é `{ id: string, rotulo: string }`.

- `rotulo` — o texto exibido ao usuário, e o valor gravado no contexto.
- `id` — a identidade da opção. **É por ele que o roteamento acontece:** a aresta
  que sai dessa opção traz esse valor em `sourceHandle`. Renomear o `rotulo` não
  afeta o roteamento; o `id` é estável exatamente por isso.

### `condicional`

Desvia o fluxo conforme uma regra avaliada contra o contexto.

| Campo   | Tipo | Descrição |
|---------|------|-----------|
| `label` | `string` | Apresentação. Ignorado na execução. |
| `regra` | `Regra`  | A condição a avaliar. Ver "A regra do condicional". |

### `llm`

Envia uma instrução a um modelo de linguagem e guarda a resposta.

| Campo      | Tipo | Descrição |
|------------|------|-----------|
| `label`    | `string` | Apresentação. Ignorado na execução. |
| `prompt`   | `string` | Instrução literal a ser enviada ao modelo. |
| `salvarEm` | `string` | Nome da chave onde o motor deve gravar a resposta do modelo no contexto. |

### `fim`

Encerra a conversa. Não lê nem escreve no contexto e não tem saída.

| Campo   | Tipo | Descrição |
|---------|------|-----------|
| `label` | `string` | Apresentação. Ignorado na execução. |

## A aresta

| Campo          | Tipo | Obrigatório | Descrição |
|----------------|------|-------------|-----------|
| `id`           | `string` | sim | Único dentro do fluxo. Sem significado semântico. |
| `source`       | `string` | sim | `id` do nó de origem. |
| `target`       | `string` | sim | `id` do nó de destino. |
| `sourceHandle` | `string` | não | Por qual saída do nó de origem a aresta sai. Ver a seção seguinte. |

Não existe `targetHandle` no formato: um nó tem uma única entrada, e qualquer
número de arestas pode chegar nela.

## As saídas de cada tipo de nó

Uma aresta sai de um nó por uma **saída**, identificada em `sourceHandle`. Cada
tipo tem um conjunto fixo de saídas:

| `type`        | Saídas        | `sourceHandle` |
|---------------|---------------|----------------|
| `mensagem`    | 1             | ausente (saída única) |
| `llm`         | 1             | ausente (saída única) |
| `pergunta`    | uma por opção | o `id` da opção correspondente |
| `condicional` | 2             | `"verdadeiro"` e `"falso"` |
| `fim`         | 0             | — |

**Saída única: campo ausente ou `null`.** Em nós com uma saída só, o arquivo
exportado omite `sourceHandle`. Um arquivo gerado por outra ferramenta pode
trazer `null` explícito. As duas formas significam a mesma coisa, e o motor deve
tratá-las como equivalentes — caso contrário o mesmo nó pareceria ter duas saídas
distintas.

**Cada saída leva a no máximo um destino.** O editor recusa uma segunda aresta
saindo do mesmo par (nó, saída), mesmo que aponte para um nó diferente. É o que
torna a execução determinística: dado um nó e uma escolha, o próximo nó é único e
o motor nunca precisa desempatar.

**Uma saída pode não levar a lugar nenhum.** O editor sinaliza isso como problema
no painel, mas não impede a exportação. Ver "Garantias e não-garantias".

## O contexto de execução

O motor mantém um **contexto** durante a conversa: um mapa de chaves para valores
que os nós escrevem e leem. Ele não aparece no JSON — nasce vazio no início da
conversa e é preenchido em execução.

```ts
type Contexto = { [chave: string]: string };
```

Todo valor é string porque os únicos nós que escrevem no contexto gravam texto: a
escolha do usuário no WhatsApp e a resposta do modelo de linguagem. Nenhum nó
produz número ou booleano. As chaves não podem ser listadas no tipo porque são
inventadas por quem monta o fluxo, no campo `salvarEm`.

- **Quem escreve:** o nó `pergunta` grava o `rotulo` da opção escolhida; o nó
  `llm` grava a resposta do modelo. Ambos na chave indicada por `salvarEm`.
- **Quem lê:** o nó `condicional`, na chave indicada por `regra.chave`.

**Conversão de tipo.** O contexto guarda string, mas a regra `maior` traz `valor`
como número. A comparação é `contexto[chave] > regra.valor` — string de um lado,
número do outro. O JavaScript converte a string para número nesse caso, e a
comparação é numérica de verdade. O motor não precisa converter nada.

Isso é proposital. Se `valor` fosse string, `>` entre duas strings compara
alfabeticamente, caractere a caractere: `"9" > "10"` é `true`. Qualquer
comparação com dois ou mais dígitos mentiria em silêncio.

**Sem garantia.** Se a chave apontar para um valor que não é numérico
(`"dezesseis"`, ou vazio), a conversão resulta em `NaN`, e toda comparação com
`NaN` é `false` — a regra fica permanentemente falsa, sem erro. O editor não tem
como detectar isso: em tempo de edição existe apenas metade da comparação, porque
o valor da chave só passa a existir quando alguém conversa com o bot. Cabe ao
motor decidir o que fazer (falhar, registrar, ou seguir pelo ramo falso).

## A regra do condicional

`regra` tem três formas, distinguidas pelo campo `operador`. O campo `valor`
**só existe em duas delas**, e com tipos diferentes.

| `operador` | `chave` | `valor` | O que o motor faz |
|------------|---------|---------|-------------------|
| `"existe"` | `string` | ausente | Verdadeiro se a chave está presente no contexto com valor não vazio. |
| `"igual"` | `string` | `string` | Verdadeiro se o valor da chave é exatamente igual a `valor`. |
| `"diferente"` | `string` | `string` | Verdadeiro se o valor da chave difere de `valor`. |
| `"contem"` | `string` | `string` | Verdadeiro se o valor da chave contém `valor` como trecho. Diferencia maiúsculas de minúsculas. |
| `"maior"` | `string` | `number` | Verdadeiro se o valor da chave, interpretado como número, é maior que `valor`. Ver "Conversão de tipo". |

**`valor` ausente não é `valor: null` nem `valor: ""`.** Quando o operador é
`existe`, a chave `valor` simplesmente não está no objeto. Isso é deliberado: com
`valor` opcional, uma regra `existe` carregando um `valor` esquecido de uma edição
anterior seria um estado válido e silencioso. Ao ler `regra.valor`, **verifique
`regra.operador` antes** — em TypeScript a união discriminada obriga a isso.

**`maior` com `valor` em formato de texto é inválido.** Um JSON com
`{"operador": "maior", "valor": "17"}` reintroduz a comparação alfabética
descrita acima. A validação de importação recusa esse arquivo em tempo de
execução, com `typeof`, e não por anotação de tipo — anotação de tipo desaparece
na compilação e não protege dado vindo de fora.

**Não existem `menor` nem `maiorOuIgual`.** O conjunto de operadores é fechado e
cobre o que os fluxos precisaram até aqui. A consequência prática: "18 anos ou
mais" precisa ser escrito como `maior` com `valor: 17`, e o número no JSON deixa
de coincidir com o número da regra de negócio. É uma limitação conhecida, e o
`label` do nó é o que preserva a intenção original.

## Garantias e não-garantias

Esta seção existe para que o motor saiba o que pode presumir e o que precisa
tratar. **Presumir garantia que não existe é a forma mais provável de quebrar.**

### O editor garante

Estas condições são impostas na hora de ligar dois nós no canvas e revalidadas na
importação de um arquivo:

- `versao` é `1`.
- Todos os `id` de nó são únicos no fluxo.
- Toda aresta referencia um `source` e um `target` que existem em `nos`.
- Nenhum nó liga em si mesmo.
- Nenhuma aresta sai de um nó `fim`.
- Todo `sourceHandle` existe no nó de origem.
- Cada par (nó, saída) tem no máximo um destino.
- Se `inicio` não é `null`, aponta para um nó que existe.
- Todo `data` tem a forma exigida pelo `type` do nó, campo por campo.
- O arquivo exportado não contém campos internos da biblioteca de canvas.

### O editor NÃO garante

Estas condições são reportadas no painel de problemas, mas **não impedem a
exportação**. Um arquivo válido pode conter qualquer uma delas:

- **Saídas sem destino.** Uma opção de menu ou um ramo do condicional pode não
  levar a nada.
- **Nós inalcançáveis** a partir de `inicio`.
- **Nós sem caminho até um `fim`** — a conversa pode nunca se despedir.
- **Ciclos.** São permitidos de propósito: um menu que volta ao início é fluxo
  legítimo. O motor precisa evitar laço infinito por conta própria.
- **`inicio: null`**, quando o editor não conseguiu determinar o nó inicial.
- **Campos de texto vazios.** `texto`, `prompt`, `salvarEm` e `chave` podem ser
  strings vazias.
- **Coerência semântica da regra.** Comparar uma chave textual com `maior`
  compila, exporta e importa — falha apenas em execução, silenciosamente.

### Limitações conhecidas desta versão

- **Não há caminho de importação implementado.** As funções de validação de
  entrada (`validarFluxo`, `validarNo`, `validarRegra`) existem e estão testadas
  contra o formato descrito aqui, mas nenhuma tela do editor as chama ainda. As
  garantias da seção "O editor garante" valem hoje para fluxos construídos no
  canvas; passam a valer para arquivos externos quando a importação for ligada.
- **A limpeza do nó exportado é lista de exclusão.** Remove os campos internos
  conhecidos da biblioteca de canvas. Uma versão futura da biblioteca poderia
  introduzir um campo novo, que vazaria para o JSON. A alternativa — reconstruir
  o nó campo a campo — está registrada em `decisoes.md`.
- **Sem interpolação de variáveis** no texto do nó de mensagem. O contexto só é
  lido pelo condicional.

## Exemplo completo

Fluxo de atendimento de uma escola de teatro. A conversa que ele descreve:

```
bot:     Olá! Aqui é o assistente da Escola de Teatro Bastidores.
bot:     O que você procura?
         1) Matrícula em turma
         2) Ingressos do espetáculo
         3) Falar com a secretaria
usuário: 1
bot:     (LLM pergunta a idade e guarda o número em "idade")
usuário: 16
         idade > 17 ? não  ->  turma juvenil
bot:     A turma juvenil tem aulas aos sábados, das 10h às 12h.
```

O trecho central, anotado — o nó de menu e as três arestas que saem dele. Os
comentários são explicativos e **não fazem parte do formato**:

```jsonc
{
  "id": "menu",
  "type": "pergunta",          // o discriminante: define a forma de data e as saídas
  "position": { "x": 0, "y": 140 },
  "data": {
    "label": "Menu principal", // só aparece na tela do editor
    "salvarEm": "intencao",    // contexto["intencao"] = rotulo da opção escolhida
    "opcoes": [
      { "id": "op-matricula",  "rotulo": "Matrícula em turma" },
      { "id": "op-ingresso",   "rotulo": "Ingressos do espetáculo" },
      { "id": "op-secretaria", "rotulo": "Falar com a secretaria" }
    ]
  }
}
```

```jsonc
// uma aresta por opção; sourceHandle é o id da opção, não o texto dela
{ "id": "a2", "source": "menu", "sourceHandle": "op-matricula",  "target": "coleta-idade" },
{ "id": "a3", "source": "menu", "sourceHandle": "op-ingresso",   "target": "ingressos" },
{ "id": "a4", "source": "menu", "sourceHandle": "op-secretaria", "target": "secretaria" },

// nó de saída única: sourceHandle ausente
{ "id": "a1", "source": "boas-vindas", "target": "menu" },

// condicional: os dois handles são literais fixos do tipo
{ "id": "a6", "source": "checa-idade", "sourceHandle": "verdadeiro", "target": "turma-adulto" },
{ "id": "a7", "source": "checa-idade", "sourceHandle": "falso",      "target": "turma-juvenil" }
```

<details>
<summary>Arquivo completo exportado pelo editor</summary>

```json
{
  "versao": 1,
  "inicio": "boas-vindas",
  "nos": [
    {
      "id": "boas-vindas",
      "type": "mensagem",
      "position": {
        "x": 0,
        "y": 0
      },
      "data": {
        "label": "Boas-vindas",
        "texto": "Olá! Aqui é o assistente da Escola de Teatro Bastidores. Posso ajudar com matrículas e espetáculos."
      }
    },
    {
      "id": "menu",
      "type": "pergunta",
      "position": {
        "x": 0,
        "y": 140
      },
      "data": {
        "label": "Menu principal",
        "salvarEm": "intencao",
        "opcoes": [
          {
            "id": "op-matricula",
            "rotulo": "Matrícula em turma"
          },
          {
            "id": "op-ingresso",
            "rotulo": "Ingressos do espetáculo"
          },
          {
            "id": "op-secretaria",
            "rotulo": "Falar com a secretaria"
          }
        ]
      }
    },
    {
      "id": "coleta-idade",
      "type": "llm",
      "position": {
        "x": -280,
        "y": 300
      },
      "data": {
        "label": "Coletar idade do aluno",
        "prompt": "Pergunte a idade de quem vai fazer as aulas e responda apenas com o número, sem texto.",
        "salvarEm": "idade"
      }
    },
    {
      "id": "checa-idade",
      "type": "condicional",
      "position": {
        "x": -280,
        "y": 440
      },
      "data": {
        "label": "18 anos ou mais?",
        "regra": {
          "chave": "idade",
          "operador": "maior",
          "valor": 17
        }
      }
    },
    {
      "id": "turma-adulto",
      "type": "mensagem",
      "position": {
        "x": -440,
        "y": 590
      },
      "data": {
        "label": "Turma adulta",
        "texto": "A turma adulta tem aulas às terças e quintas, das 19h às 21h. Posso reservar sua vaga?"
      }
    },
    {
      "id": "turma-juvenil",
      "type": "mensagem",
      "position": {
        "x": -160,
        "y": 590
      },
      "data": {
        "label": "Turma juvenil",
        "texto": "A turma juvenil tem aulas aos sábados, das 10h às 12h. A matrícula é feita por um responsável."
      }
    },
    {
      "id": "ingressos",
      "type": "mensagem",
      "position": {
        "x": 60,
        "y": 300
      },
      "data": {
        "label": "Ingressos",
        "texto": "Nosso espetáculo tem sessões sexta e sábado às 20h. Ingressos na bilheteria ou pelo site."
      }
    },
    {
      "id": "secretaria",
      "type": "mensagem",
      "position": {
        "x": 340,
        "y": 300
      },
      "data": {
        "label": "Transferir",
        "texto": "Certo! Vou te transferir para a secretaria da escola."
      }
    },
    {
      "id": "fim",
      "type": "fim",
      "position": {
        "x": 0,
        "y": 760
      },
      "data": {
        "label": "Fim da conversa"
      }
    }
  ],
  "arestas": [
    {
      "id": "a1",
      "source": "boas-vindas",
      "target": "menu"
    },
    {
      "id": "a2",
      "source": "menu",
      "sourceHandle": "op-matricula",
      "target": "coleta-idade"
    },
    {
      "id": "a3",
      "source": "menu",
      "sourceHandle": "op-ingresso",
      "target": "ingressos"
    },
    {
      "id": "a4",
      "source": "menu",
      "sourceHandle": "op-secretaria",
      "target": "secretaria"
    },
    {
      "id": "a5",
      "source": "coleta-idade",
      "target": "checa-idade"
    },
    {
      "id": "a6",
      "source": "checa-idade",
      "sourceHandle": "verdadeiro",
      "target": "turma-adulto"
    },
    {
      "id": "a7",
      "source": "checa-idade",
      "sourceHandle": "falso",
      "target": "turma-juvenil"
    },
    {
      "id": "a8",
      "source": "turma-adulto",
      "target": "fim"
    },
    {
      "id": "a9",
      "source": "turma-juvenil",
      "target": "fim"
    },
    {
      "id": "a10",
      "source": "ingressos",
      "target": "fim"
    },
    {
      "id": "a11",
      "source": "secretaria",
      "target": "fim"
    }
  ]
}
```

</details>

## Testes

```bash
npm test
```

Cobertura atual: uma regra de `motivoParaRecusar` ("nó de fim não tem saída"). As
demais regras de conexão e as funções de travessia de `lib/percurso.ts` ainda não
têm teste.

As funções de `lib/` são puras sobre seus argumentos e não leem estado do React —
é o que torna possível testá-las sem navegador e sem montar componente.

## Decisões de modelagem

Toda escolha de modelagem deste projeto está registrada em
[`decisoes.md`](./decisoes.md), com a justificativa e as alternativas
descartadas.
