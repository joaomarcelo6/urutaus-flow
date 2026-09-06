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

### Nomes de domínio no type, sem registro ainda

_O que decidi:_ Usar nomes do domínio (mensagem, pergunta, condicional, llm, fim) no type, em vez dos tipos embutidos default, input, output, do React Flow.

_Por quê:_ O type já é o discriminante da união; usar os embutidos exigiria guardar o tipo real em outro lugar, criando duas fontes de verdade.

_Fronteira que isso cria:_ Enquanto nodeType não estiver registrado o ReactFlow avisa o console que não reconheceu o tipo e desenha a caixa padrão para isso ele usa data.label e como em todos os meus nós data tem label então a tela funciona no intervalo. Isso some amanhã quando nodeType for registrado.

### Estado dos nós via useNodesState, com o genérico NoDoFluxo

_O que decidi:_ useNodesState<NoDoFluxo> em vez de useState puro.

_Por quê:_ o React Flow não escreve no meu estado. Ele emite mudanças (posição, seleção, dimensão) e espera que eu as aplique. useNodesState já entrega o mecanismo que faz isso; sem ele, nó não arrasta.

_Fronteira que isso cria:_ setNos para mudanças que partem do meu código (drop, import, edição no painel); onNodesChange para mudanças que partem do usuário na tela, arrastar o bloco.
