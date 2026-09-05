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

- Nó de fim não lê nem escreve no contexto, data vazio, existe para as validações ("nó final não pode ter saída").
