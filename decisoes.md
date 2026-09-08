# Decisões de modelagem

## 04/09

### Discriminante da união fica no `type` do nó

_O quê?:_ Discriminante mora no type de fora ja imposto pelo React Flow.

_Por quê?:_ Porque um motor que recebe um {type, data} e faz um switch no type é um caminho bem óbivio.

_Descartado:_ Discriminar por um campo dentro de data (data: { kind: 'mensagem', ... }). A informação existiria em dois lugares e nada impediria type: 'mensagem' com data.kind: 'fim' — estado inválido representável.

### Opção de pergunta é objeto, não string

_O quê?:_ Opção de pergunta usa um objeto.

_Por quê?:_ A aresta precisa referenciar algo estável dentro da opção. Uma string que o usuário edita não é estável.

_Descartado:_ String.

### Aresta referencia a opção por `sourceHandle`

_O quê?:_ Cada opção de um nó de pergunta tem seu próprio handle de saída, e a aresta que sai dali carrega o id desse handle em sourceHandle.

_Por quê?:_ O React Flow preenche sourceHandle sozinho quando o usuário arrasta a conexão. Não há passo manual, então não há como dessincronizar.

_Descartado:_ Guardar o id da opção em data da aresta. Funcionaria, mas exigiria preencher à mão em todo onConnect — um lugar a mais para errar, e informação duplicada com o handle.

### Existe um contexto de execução

_O quê?:_ Contexto é um objeto que o motor carrega durante a execução, com chaves que os nós escrevem e leem.

_Por quê?:_
"bot: Qual seu nome?
usuário: João
bot: Você quer 1) orçamento 2) suporte
usuário: 2
bot: Certo, João, vou te passar pro suporte."

-> O nome digitado no primeiro nó ainda esta disponível no último. Sem contexto, cada nó é surdo para o que veio antes.

_Descartado:_ Passar o dado direto de nó para nó, empurrado pela aresta. Se o nó 5 precisa de algo que o nó 1 coletou, o dado teria que atravessar os nós 2, 3 e 4 que não usam ele para nada.

### Operadores do condicional são um conjunto fechado

_O quê?:_ São um conjunto fechado composto por: igual, diferente, maior, contém, existe.
_Por quê?:_ União de literais em vez de string solto faz o compilador recusar "maiorr". Sem isso, o erro só aparece em runtime, no meio de uma conversa com cliente.
_Descartado:_ String livre

### Fora de escopo por ora

- Interpolação de variáveis no texto do nó de mensagem — interpolação exige um parser, e o prazo é 10/09. Se sobrar tempo, entra.

- Nó de fim não lê nem escreve no contexto, data somente com um label que indica o rótulo na tela, existe para as validações ("nó final não pode ter saída").

## 05/09

### Contexto é `string → string`

_O quê?:_ `type Contexto = { [chave: string]: string }`. Chaves de nome livre, valores sempre string.

_Por quê?:_ Rastreando a origem de tudo que entra no contexto: nó de pergunta recebe texto digitado no WhatsApp; nó de LLM recebe texto do modelo. Não existe nó que produza número ou booleano. Nome de chave é escolhido por quem monta o fluxo, então não dá para listar as chaves no tipo — só a forma delas.

_Descartado:_ Valores `any`. Cobriria casos hipotéticos e desligaria o compilador exatamente onde o condicional compara valores.

_Consequência:_ conversão de tipo é responsabilidade de quem consome o contexto, não do contexto.

### Regra do condicional é objeto aninhado

_O quê?:_ `chave`, `operador` e `valor` vivem dentro de `regra`, não soltos no `data`.

_Por quê?:_ Os três só têm significado juntos — nenhum vale nada sozinho. `label` é de outra natureza (rótulo na tela) e fica fora. Se surgir necessidade de múltiplas regras com E/OU, `regra` vira `regras: Regra[]` sem reorganizar o `data` nem quebrar JSON já exportado.

### Validação de tipo do condicional não acontece no editor

_O quê?:_ O editor não impede um fluxo que compare `nome` com `maior 18`. O erro é tratado em execução, pelo motor.

_Por quê?:_ Em tempo de edição existe só metade da comparação. O `18` está no `data` do nó; o valor de `nome` só passa a existir quando alguém conversa com o bot. A validação não tem o que checar — é impossibilidade, não falta de tempo.

_Descartado:_ (a) tratar como falso e seguir — o cliente descobre em produção, silenciosamente. (b) erro em execução — escolhido, e documentado no README para o motor deles.

_Atualização (07/09):_ Uma fatia desse problema não era "metade da comparação inexistente em tempo de edição" — era tipo errado dentro do que o editor já sabia. `valor` do operador `maior` era `string`, igual aos demais. Em JS, `>` entre duas strings compara lexicograficamente: `"9" > "10"` é `true`, porque compara caractere a caractere, não como número. Como `Contexto` é `string → string` ([[Contexto é `string → string`]]), o valor de `chave` em execução sempre chega como string ao motor; se `regra.valor` também for string, a comparação inteira é lexicográfica e "maior" mente silenciosamente para qualquer comparação de dois ou mais dígitos. Isso fechou com a mudança em [[Regra é união discriminada por `operador`, não objeto único com `valor` opcional]]: `maior` virou uma variante própria com `valor: number`. `>` em JS entre string e number converte a string para number antes de comparar — então `contexto[chave] > regra.valor` passa a ser numérico de verdade. O que continua sem validação no editor, e é o resto do que esse item documenta, é `chave` apontar para um valor que não é numérico nenhum (ex.: "abc") — `Number("abc")` é `NaN`, e `NaN > 18` é sempre `false`, silenciosamente. Isso segue sendo impossibilidade de tempo de edição, não falta de tempo, e continua erro em execução, documentado para o motor deles.

### Nomes de domínio no type, sem registro ainda

_O que decidi:_ Usar nomes do domínio (mensagem, pergunta, condicional, llm, fim) no type, em vez dos tipos embutidos default, input, output, do React Flow.

_Por quê:_ O type já é o discriminante da união; usar os embutidos exigiria guardar o tipo real em outro lugar, criando duas fontes de verdade.

_Fronteira que isso cria:_ Enquanto nodeType não estiver registrado o ReactFlow avisa o console que não reconheceu o tipo e desenha a caixa padrão para isso ele usa data.label e como em todos os meus nós data tem label então a tela funciona no intervalo. Isso some amanhã quando nodeType for registrado.

### Estado dos nós via useNodesState, com o genérico NoDoFluxo

_O que decidi:_ useNodesState<NoDoFluxo> em vez de useState puro.

_Por quê:_ o React Flow não escreve no meu estado. Ele emite mudanças (posição, seleção, dimensão) e espera que eu as aplique. useNodesState já entrega o mecanismo que faz isso; sem ele, nó não arrasta.

_Fronteira que isso cria:_ setNos para mudanças que partem do meu código (drop, import, edição no painel); onNodesChange para mudanças que partem do usuário na tela, arrastar o bloco.

### Regra é união discriminada por `operador`, não objeto único com `valor` opcional

_O que decidi:_ `Regra = RegraExiste | RegraComparacao`. Só `RegraComparacao` tem o campo `valor`; a variante `existe` não tem esse campo — nem como `valor?: string`.

_Por quê:_ O JSON exportado desse editor é lido por um motor de execução de outra equipe. Se `valor` fosse opcional em vez de ausente, `regra.operador === "existe"` com `regra.valor` preenchido (por exemplo, de uma edição anterior que trocou o operador) seria um estado representável e o TypeScript deles não teria como recusar. Com a união, quem lê `regra.valor` sem antes checar `regra.operador` não compila — o erro migra de silencioso-em-produção para recusado-em-build, no mesmo mecanismo que `NoDoFluxo` já usa para impedir `type: "fim"` com `data` de LLM.

_Descartado:_ `{ chave, operador, valor?: string }`. Compila mais fácil dos dois lados, mas deixa `valor` presente e ignorado como estado válido — exatamente o bug que motivou a mudança.

_Consequência:_ o seletor de operador no painel de edição não pode só espalhar (`...regra`) ao trocar `operador`; precisa montar a variante certa (com ou sem `valor`) a cada troca.

_Atualização (07/09):_ `RegraComparacao` virou duas variantes, `RegraTexto` (`igual` | `diferente` | `contem`, `valor: string`) e `RegraNumerica` (`maior`, `valor: number`). Motivo em [[Regra "maior" ganha `valor: number`]]. A união agora é `Regra = RegraExiste | RegraTexto | RegraNumerica`.

### Regra "maior" ganha `valor: number`

_O que decidi:_ Separar `RegraComparacao` em `RegraTexto` (`valor: string`) e `RegraNumerica` (`operador: "maior"`, `valor: number`).

_Por quê:_ `Contexto` é `string → string` ([[Contexto é `string → string`]]) — o motor sempre lê `contexto[chave]` como string. Com `regra.valor` também string, `contexto[chave] > regra.valor` era comparação de string com string, e `>` em JS entre strings é lexicográfico: `"9" > "10"` dá `true`. Um fluxo comparando idade, tempo de espera, qualquer número de dois ou mais dígitos, mentia sem avisar. Uma vez que `Regra` já era união discriminada, criar uma terceira variante só para `maior` ficou barato — o compilador já forçava checar `operador` antes de ler `valor` em qualquer lugar do código, então trocar o tipo de `valor` numa das variantes não abriu nenhum buraco novo, só apareceu como erro de tipo nos dois lugares que escreviam `valor` (`PainelEdicao`) até eu ajustar. Com `regra.valor: number`, `contexto[chave] > regra.valor` vira string comparada com number, e aí o próprio JS converte a string para number antes de comparar — a comparação passa a ser numérica de verdade, sem o motor precisar fazer nada.

_Descartado:_ Manter `valor: string` em todas as variantes e documentar que o motor deve fazer `Number(regra.valor)` antes de comparar quando `operador === "maior"`. Funciona, mas devolve o problema pro README: um motor que lê `regra.valor` como veio do JSON sem essa conversão reproduz o bug, e nada no tipo avisa que "maior" é diferente dos outros operadores nesse ponto.

_Consequência:_ `PainelEdicao` renderiza `<input type="number">` para `maior` e grava o valor numérico; para os demais operadores continua `<input>` de texto gravando a string direto. Trocar o operador para ou de "maior" reseta `valor` (para `0` ou `""`) porque as duas formas não são compatíveis — não dá pra "converter" o texto antigo, só recomeçar.

### Validação de `Regra` na fronteira de import: `lib/serializacao.ts`

_O quê?:_ `validarRegra(json: unknown): Regra` — recebe um valor de tipo `unknown` (o resultado de um `JSON.parse` em um arquivo importado, por exemplo) e devolve uma `Regra` válida ou lança um erro descrevendo o que está errado.

_Por quê?:_ A união discriminada em `modelo/tipos.ts` — e a divisão de `RegraComparacao` em `RegraTexto`/`RegraNumerica` — só protegem quem escreve `Regra` passando pelo TypeScript, ou seja, o painel de edição. Tipo não existe em tempo de execução: um arquivo JSON importado com `{"operador": "maior", "valor": "18"}` (valor como texto, não número) passa despercebido por qualquer `as Regra` ou anotação de tipo — o `as` não checa nada, só promete pro compilador. Se esse objeto chegar a uma comparação `contexto[chave] > regra.valor`, "18" (string) volta a fazer o `>` virar lexicográfico, exatamente o bug que `RegraNumerica` fechou do lado do editor. `validarRegra` é o ponto que checa a forma de verdade — campo por campo, com `typeof` — antes de qualquer `Regra` vinda de fora do painel entrar no resto do app.

_Descartado:_ Confiar em `as Regra` no ponto de import, ou documentar no README que arquivos importados devem respeitar o formato. Ambos dependem de quem gera o arquivo externo fazer certo; a validação em runtime não depende de ninguém fazer certo, ela recusa o que está errado.

_Fronteira que isso cria:_ Hoje o app não tem nenhum caminho de import de JSON implementado — `validarRegra` existe pronta pro dia em que esse caminho for escrito, e não é chamada em lugar nenhum ainda. Quando o import existir, cada `Regra` que vier de fora do estado do React precisa passar por ela antes de entrar em `nos`/`setNos`.

### `Operador` derivado de `Regra`, não mais uma lista solta

_O quê?:_ `export type Operador = Regra["operador"];`, declarado depois de `Regra`. A lista `"igual" | "diferente" | "maior" | "contem" | "existe"` escrita à mão saiu do arquivo.

_Por quê?:_ Antes, `Operador` era uma união de literais independente, e cada variante de `Regra` repetia um subconjunto desses literais no próprio campo `operador`. As duas listas não tinham nenhuma relação pro compilador — eram coincidência de texto, não estrutura. Adicionar um operador novo em `Operador` sem cobri-lo em nenhuma variante de `Regra` compilava normalmente; o operador ficava "listado" mas nenhuma regra conseguia representá-lo. `Regra["operador"]` é indexed access type: lê o tipo do campo `operador` em cada membro da união `Regra` (`"existe"`, `"igual" | "diferente" | "contem"`, `"maior"`) e junta os três num só. Agora só existe uma lista — a que está dentro de `Regra` — e `Operador` é sempre um reflexo exato dela.

_Descartado:_ Manter as duas declarações e confiar em revisão manual pra mantê-las em sincronia. É o tipo de sincronização que o TypeScript existe pra eliminar; descrição em código gasta atenção que devia ir pra lógica.

_Fronteira que isso cria:_ pra adicionar um operador agora, a única entrada é criar (ou estender) uma variante de `Regra` — não dá mais pra "adicionar em `Operador`" como passo isolado, porque `Operador` não existe independente de `Regra`. `OPERADORES` (o array que popula o `<select>` em `PainelEdicao`) continua `Operador[]`, sem mudança — ele lê da mesma fonte, só que agora essa fonte é honesta.

### `maior` sem `menor`: assimetria proposital

_O quê?:_ O conjunto de operadores segue sem `menor`. `Regra` tem `igual`, `diferente`, `contem`, `existe` e `maior` — não `menor`.

_Por quê?:_ Nenhum dos fluxos do domínio (classificação de intenção por LLM, idade/tempo de espera coletados por pergunta) precisou até agora de "menor que". Adicionar um operador que nenhum fluxo real usa é modelar pra um caso hipotético — a mesma razão pela qual `Contexto` não aceita `any` (decisão de 05/09). Se aparecer um fluxo que precise de "menor", ele entra do mesmo jeito que `maior` entrou: como variante de `Regra` com `valor: number`, e `Operador` se atualiza sozinho por causa da derivação acima — não é uma mudança estrutural, é adicionar uma linha.

_Descartado:_ Adicionar `menor` agora "por simetria". Simetria não é requisito do domínio; é estética, e o objetivo aqui é o conjunto fechado cobrir exatamente o que o fluxo precisa, nem mais nem menos.
