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

### 06/09

_O que decidi:_ Um Handle por opção, id = opcao.id. A aresta grava sourceHandle, então o motor de execução sabe qual ramo seguir sem estrutura paralela. Saída compartilhada perderia essa informação. Ids de handle do condicional são literais (verdadeiro/falso) porque a quantidade é estrutural do tipo, não dos dados.

_O que decidi:_ Interface esconde, validação proíbe. O nó de fim não tem handle de saída, o que impede o arrasto na UI. Isso não impede uma aresta com source no fim vinda de JSON importado. A garantia é podeConectar, a ser plugado via isValidConnection.

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

### `Number("")` é `0`, não erro — campo Valor numérico ganhou guarda

_O quê?:_ `onChange` do `<input type="number">` do Valor não usa mais `Number(e.target.value)`. Usa `e.target.valueAsNumber` e ignora a mudança (`return`, sem chamar `aoAtualizar`) se o resultado for `NaN`.

_Por quê?:_ `Number("")` avalia para `0`, não para `NaN` — string vazia não é "ausência de número" pro construtor `Number`, é convertida como se fosse zero. Apagar o campo Valor de uma regra "maior que 18" gravava `valor: 0` sem nenhum aviso, e "maior que 0" é verdadeiro pra qualquer contexto não-vazio — a regra vira efetivamente sempre-verdadeira, silenciosamente. `valueAsNumber` do próprio input não tem essa armadilha: campo vazio (ou conteúdo que o browser não aceita como número) dá `NaN`, que `Number.isNaN` pega antes de gravar.

_Descartado:_ Deixar `valor: number` aceitar o `0` da string vazia e confiar que "ninguém vai apagar o campo sem digitar outra coisa". É exatamente o tipo de estado que a UI permite e o tipo não impede — o problema que a união inteira foi feita pra evitar, só que um campo abaixo.

_Consequência:_ enquanto o campo estiver vazio ou inválido, `aoAtualizar` não é chamado — o input controlado volta a mostrar o último valor válido no próximo render. O campo não aceita ficar "em branco" como estado intermediário; ou tem um número, ou volta pro que tinha antes.

### Construção de `Regra` no painel usa `switch` exaustivo, não `if/ternário` em cadeia

_O quê?:_ O `onChange` do seletor de operador em `PainelEdicao` monta a nova `Regra` num `switch (operador)` com um `case` por literal de `Operador`, terminando em `default: return nuncaAcontece(operador)`.

_Por quê?:_ A versão anterior era uma cadeia de ternários (`operador === "existe" ? ... : operador === "maior" ? ... : { ... }`) — o último ramo era um "resto", não uma checagem explícita. Isso já é o padrão que motivou `nuncaAcontece` em `lib/exaustividade.ts`, usado no fim de `PainelEdicao` para o `switch (no.type)`; a mesma proteção estava faltando no `switch` de dentro do `switch`. Com o `switch (operador)` e `default: nuncaAcontece(operador)`, o compilador só aceita o `default` se `operador` já tiver sido esgotado por todos os `case` anteriores — TypeScript estreita o tipo pra `never` ali. Adicionar um operador novo em `Operador` sem adicionar o `case` correspondente quebra o build nesse ponto exato, em vez de cair silenciosamente no último ramo da cadeia.

_Descartado:_ Manter a cadeia de ternários e confiar que trocar o tipo de `valor` numa variante nova já geraria erro de atribuição a `Regra`. Verdade em vários casos, mas não em todos — se o operador novo tiver o mesmo formato de `valor` (`string`) de um dos ramos já existentes, a atribuição compila e o operador novo silenciosamente segue a lógica de outro operador, sem relação nenhuma com o que ele deveria fazer.

## 06/09

### Validação de `Regra` na fronteira de import: `lib/serializacao.ts`

_O quê?:_ `validarRegra(json: unknown): Regra` — recebe um valor de tipo `unknown` (o resultado de um `JSON.parse` em um arquivo importado, por exemplo) e devolve uma `Regra` válida ou lança um erro descrevendo o que está errado.

_Por quê?:_ A união discriminada em `modelo/tipos.ts` — e a divisão de `RegraComparacao` em `RegraTexto`/`RegraNumerica` — só protegem quem escreve `Regra` passando pelo TypeScript, ou seja, o painel de edição. Tipo não existe em tempo de execução: um arquivo JSON importado com `{"operador": "maior", "valor": "18"}` (valor como texto, não número) passa despercebido por qualquer `as Regra` ou anotação de tipo — o `as` não checa nada, só promete pro compilador. Se esse objeto chegar a uma comparação `contexto[chave] > regra.valor`, "18" (string) volta a fazer o `>` virar lexicográfico, exatamente o bug que `RegraNumerica` fechou do lado do editor. `validarRegra` é o ponto que checa a forma de verdade — campo por campo, com `typeof` — antes de qualquer `Regra` vinda de fora do painel entrar no resto do app.

_Descartado:_ Confiar em `as Regra` no ponto de import, ou documentar no README que arquivos importados devem respeitar o formato. Ambos dependem de quem gera o arquivo externo fazer certo; a validação em runtime não depende de ninguém fazer certo, ela recusa o que está errado.

_Fronteira que isso cria:_ Hoje o app não tem nenhum caminho de import de JSON implementado — `validarRegra` existe pronta pro dia em que esse caminho for escrito, e não é chamada em lugar nenhum ainda. Quando o import existir, cada `Regra` que vier de fora do estado do React precisa passar por ela antes de entrar em `nos`/`setNos`.

### `Operador` derivado de `Regra`, não mais uma lista solta

_O quê?:_ `export type Operador = Regra["operador"];`, declarado depois de `Regra`. A lista `"igual" | "diferente" | "maior" | "contem" | "existe"` escrita à mão saiu do arquivo.

_Por quê?:_ Antes, `Operador` era uma união de literais independente, e cada variante de `Regra` repetia um subconjunto desses literais no próprio campo `operador`. As duas listas não tinham nenhuma relação pro compilador — eram coincidência de texto, não estrutura. Adicionar um operador novo em `Operador` sem cobri-lo em nenhuma variante de `Regra` compilava normalmente; o operador ficava "listado" mas nenhuma regra conseguia representá-lo. `Regra["operador"]` é indexed access type: lê o tipo do campo `operador` em cada membro da união `Regra` (`"existe"`, `"igual" | "diferente" | "contem"`, `"maior"`) e junta os três num só. Agora só existe uma lista — a que está dentro de `Regra` — e `Operador` é sempre um reflexo exato dela.

_Descartado:_ Manter as duas declarações e confiar em revisão manual pra mantê-las em sincronia. É o tipo de sincronização que o TypeScript existe pra eliminar; description em código gasta atenção que devia ir pra lógica.

_Fronteira que isso cria:_ pra adicionar um operador agora, a única entrada é criar (ou estender) uma variante de `Regra` — não dá mais pra "adicionar em `Operador`" como passo isolado, porque `Operador` não existe independente de `Regra`. `OPERADORES` (o array que popula o `<select>` em `PainelEdicao`) continua `Operador[]`, sem mudança — ele lê da mesma fonte, só que agora essa fonte é honesta.

### `maior` sem `menor`: assimetria proposital

_O quê?:_ O conjunto de operadores segue sem `menor`. `Regra` tem `igual`, `diferente`, `contem`, `existe` e `maior` — não `menor`.

_Por quê?:_ Nenhum dos fluxos do domínio (classificação de intenção por LLM, idade/tempo de espera coletados por pergunta) precisou até agora de "menor que". Adicionar um operador que nenhum fluxo real usa é modelar pra um caso hipotético — a mesma razão pela qual `Contexto` não aceita `any` (decisão de 05/09). Se aparecer um fluxo que precise de "menor", ele entra do mesmo jeito que `maior` entrou: como variante de `Regra` com `valor: number`, e `Operador` se atualiza sozinho por causa da derivação acima — não é uma mudança estrutural, é adicionar uma linha.

_Descartado:_ Adicionar `menor` agora "por simetria". Simetria não é requisito do domínio; é estética, e o objetivo aqui é o conjunto fechado cobrir exatamente o que o fluxo precisa, nem mais nem menos.

## 07/09

### O início do fluxo é propriedade do fluxo, não de um nó: tipo `Fluxo`

_O quê?:_ `Fluxo = { versao: 1; inicio: string | null; nos: NoDoFluxo[]; arestas: Aresta[] }`. O ponto de entrada mora em `inicio`, um id de nó, e não como tipo de nó nem como flag dentro de `data`.

_Por quê?:_ Um grafo tem um ponto de entrada — isso é metadado do grafo inteiro, não característica de um nó. Modelar como tipo `inicio` colocaria no lugar errado uma informação que é do todo, e custaria mexer em `NoDoFluxo`, em `nodeTypes` e no switch exaustivo do `PainelEdicao`. Além disso o envelope era necessário de qualquer forma: sem ele, o export seria `{nodes, edges}` cru do React Flow, um dump do canvas. Com `versao` e `inicio`, o JSON se apresenta como fluxo executável — que é o que o motor da outra equipe precisa ler.

_Descartado:_ (a) Novo tipo `inicio` no `NoDoFluxo` — explícito, mas informação no lugar errado e caro em código. (b) Derivar o início por "nó sem aresta de entrada" — vira falso assim que um menu volta para o primeiro nó, que passa a ter entrada. (c) Primeiro nó do array — a ordem do array é acidente de implementação, não modelagem.

_Consequência:_ `derivarInicio` (em `lib/percurso.ts`) sobrevive como heurística de conveniência, não como modelo: preenche `inicio` para JSON antigo que não tem o campo, e só responde quando o candidato é único. Zero ou vários candidatos viram `null`, que a travessia reporta como problema em vez de escolher um nó no escuro.

### `podeConectar` é pura sobre `(nos, arestas, conexao)`

_O quê?:_ `motivoParaRecusar(nos, arestas, conexao)` em `lib/validacao.ts` devolve o texto do motivo ou `null`; `podeConectar` é o mesmo como booleano. Nenhuma das duas lê estado do React.

_Por quê?:_ A função tem dois chamadores, não um: `isValidConnection` no canvas, que previne o arrasto, e a validação de import, que recusa JSON de fora. Escrita acoplada ao React, a regra teria que ser duplicada no import — que é justamente onde a garantia importa, porque na UI o handle proibido muitas vezes nem existe para ser arrastado.

_Consequência:_ o caso "nó de fim não tem saída" é quase decorativo no canvas (o nó de fim não desenha handle de saída) e essencial no import. É a mesma assimetria já registrada em 06/09 sobre `podeConectar`, agora com o código no lugar.

### As três regras de conexão, e a quarta que é consequência

_O quê?:_ `motivoParaRecusar` recusa: (1) origem ou destino que não existem, (2) nó ligando nele mesmo, (3) saída de nó de fim, (4) `sourceHandle` que não existe naquele nó, (5) par (nó, handle de saída) que já tem destino.

_Por quê?:_ A regra (5) é a que torna o motor determinístico, e a formulação correta dela é sobre o par (nó, handle) — não sobre "cada opção de pergunta". Ela vale uniformemente, inclusive para `mensagem` e `llm`, que têm handle único (`sourceHandle` nulo): nó de mensagem com duas saídas é o mesmo bug que opção de pergunta com duas saídas.

_Descartado:_ "sem aresta duplicada" como regra própria. Não é necessária — duas arestas com o mesmo `source` + `sourceHandle` + `target` já são recusadas pela regra (5), que é mais forte: recusa o segundo destino mesmo quando ele é diferente. Escrever as duas seria checar a mesma coisa em dois lugares.

### A travessia é separada da validação de conexão

_O quê?:_ `lib/percurso.ts` responde sobre o grafo inteiro: nós inalcançáveis a partir de `inicio`, saídas declaradas pelo tipo que não têm aresta, nós de onde não há caminho até um `fim`, e nós em ciclo.

_Por quê?:_ São perguntas de momentos diferentes. `podeConectar` é sobre uma aresta e pode recusar na hora do arrasto; a travessia é sobre o fluxo montado e só faz sentido depois. Um nó recém-solto na tela ainda não tem saída ligada — isso não é erro enquanto se está editando, é estado normal de trabalho. Por isso a travessia reporta problemas num painel, sem bloquear nada.

_Consequência:_ ciclo entra como `aviso`, não `erro` — menu que volta ao início é fluxo legítimo. E nó inalcançável suprime os outros relatos sobre ele: enquanto o nó não é alcançado, dizer que a opção 2 dele está vazia é ruído.

### Listas paralelas de tipos de nó, resolvidas como `Record<TipoDeNo, …>`

_O quê?:_ `TipoDeNo = NonNullable<NoDoFluxo["type"]>` deriva os tipos da união. Onde o runtime precisa de valor e não de tipo — a paleta da sidebar e o reconhecimento do que veio no `dataTransfer` — a lista é um `Record<TipoDeNo, …>`, não um array solto. O `TipoNo` do `NoBase`, que repetia os cinco literais à mão, virou alias de `TipoDeNo`.

_Por quê?:_ Mesma razão de `Operador = Regra["operador"]` (06/09): duas listas que só coincidem por texto se separam sem aviso. Onde a derivação não é possível — tipo some na compilação, e o drop precisa checar uma string qualquer — `Record<TipoDeNo, …>` recupera a garantia por outro caminho: adicionar um tipo à união quebra o build em cada `Record` até ele ganhar entrada.

### `screenToFlowPosition` no drop, não `clientX/clientY` crus

_O quê?:_ O `onDrop` do canvas converte a coordenada do ponteiro com `screenToFlowPosition` antes de gravar em `position`.

_Por quê?:_ `clientX/clientY` são pixels da janela; `position` do nó é coordenada do canvas, que tem zoom e pan próprios. Sem a conversão o nó cai no lugar certo só enquanto o canvas está em 100% e sem deslocamento — o erro aparece exatamente quando o usuário já mexeu na tela.

_Fronteira que isso cria:_ `screenToFlowPosition` vem de `useReactFlow`, que só funciona dentro de `ReactFlowProvider`. Por isso o editor virou um componente separado, com a página só montando o provider em volta.

_Consequência:_ o tipo do nó viaja no `dataTransfer` sob a constante `FORMATO_ARRASTO`, exportada pela sidebar e lida pelo drop — as duas pontas referenciam o mesmo símbolo, em vez de duas strings iguais por coincidência. E o valor lido passa por `ehTipoDeNo` antes de virar nó: é string vinda de fora, não dá para confiar nela só porque a sidebar é quem costuma escrever.

## 09/09

### Export e import moram no mesmo arquivo

_O quê?:_ `serializarFluxo(fluxo: Fluxo): string` entra em `lib/serializacao.ts`,
ao lado de `validarFluxo`. Devolve `JSON.stringify(fluxo, null, 2)`.

_Por quê?:_ Os dois lidam com o mesmo formato em sentidos opostos — um escreve, o
outro lê e recusa. Juntos, fica evidente que mudam juntos: campo novo no `Fluxo`
tem que aparecer nos dois lados. Separados, esquecer um deles é silencioso.

_Sobre a indentação:_ o `2` é para leitura humana. O consumidor imediato é o dev
que vai escrever o tradutor e vai abrir o arquivo para entender o formato.
Compacto seria menor e ilegível, e o custo em bytes não importa nessa escala.

### O JSON exportado carrega só os campos do contrato

_O quê?:_ Antes de serializar, cada nó passa por `noParaExportar`, que remove
`measured`, `selected` e `dragging`.

_Por quê?:_ Esses campos não são meus. O React Flow mede a caixa depois que ela é
desenhada e emite a mudança; o `onNodesChange` do `useNodesState` aplica ela no
meu estado ([[Estado dos nós via useNodesState, com o genérico NoDoFluxo]]). O
estado do React é, portanto, maior que o `Fluxo` que modelei, e serializar o
estado cru vaza detalhe de renderização para dentro do contrato.

Dois problemas concretos: (a) `measured` só existe em nó que já foi renderizado,
então aparece em uns e não em outros — quem escreve o tradutor não tem como saber
se o campo é obrigatório; (b) `selected` e `dragging` dependem de onde o mouse
estava no instante do clique, ou seja, o mesmo fluxo exporta arquivos diferentes.
Contrato entre duas equipes não pode depender do mouse.

_Consequência:_ é a mesma separação que já valia para o contorno do nó inicial —
aparência entra como `className` na hora de renderizar e não suja o `data`. Ali a
proteção era dentro do `data`; o `measured` entrava um nível acima.

### A limpeza é lista de exclusão, e isso tem custo

_O quê?:_ `noParaExportar` usa rest destructuring: nomeia os três campos a remover
e recolhe o resto. Não é uma lista dos campos que ficam.

_Por quê?:_ A lista de inclusão (`{ id: no.id, type: no.type, position:
no.position, data: no.data }`) não compila. Ao ler `type` e `data` separados, o
TypeScript perde a correlação entre eles e passa a ver "um dos cinco types" com
"um dos cinco datas" — o que permitiria `type: "fim"` com `data` de LLM, o estado
inválido que a união inteira existe para proibir ([[Discriminante da união fica no
`type` do nó]]). O compilador recusou por um motivo certo.

_Custo assumido:_ campo novo que o React Flow introduza numa versão futura vaza
para o JSON, porque não está na lista de exclusão. A alternativa é um `switch`
exaustivo com `nuncaAcontece`, no estilo de `criarNo.ts`, reconstruindo o nó
variante por variante — mantém a correlação, fecha o buraco, custa ~15 linhas.
Não entrou por causa do prazo de 10/09, e é a primeira coisa a fazer se esse
formato virar produto.

### `position` fica no JSON mesmo o motor não usando

_O quê?:_ Coordenada de tela continua no nó exportado, e `validarNo` a exige na
volta.

_Por quê?:_ O arquivo tem dois consumidores, não um. O motor da Urutaus executa a
conversa e ignora coordenada. O próprio editor reimporta pelo `validarFluxo`, e
sem `position` todo nó volta empilhado no mesmo canto — o desenho que a pessoa
organizou se perde.

_Consequência:_ os campos do JSON têm três naturezas, e o README precisa dizer
qual é qual: o fluxo (`id`, `type`, `data`, arestas), o desenho (`position`) e o
estado efêmero de renderização, que não sai.

### Falta `maiorOuIgual`, e o fluxo de exemplo mostrou onde dói

_O quê?:_ No fluxo de demonstração, a regra que separa turma adulta de juvenil é
`{ chave: "idade", operador: "maior", valor: 17 }`, com `label` "18 anos ou
mais?".

_Por quê é um problema:_ "≥ 18" só se escreve como "> 17", então o número no JSON
deixa de bater com o número do negócio. Quem ler o JSON sem o `label` não sabe se
17 é a regra ou um deslocamento para contornar a falta do operador.

_Relação:_ é a irmã de [[`maior` sem `menor`: assimetria proposital]]. Lá a
ausência era deliberada porque nenhum fluxo precisava; aqui o caso de uso
apareceu — maioridade é limite inclusivo por natureza.

_Consequência:_ entra como variante nova de `Regra` (`operador: "maiorOuIgual"`,
`valor: number`), e `Operador` se atualiza sozinho pela
