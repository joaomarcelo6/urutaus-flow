@AGENTS.md

# urutaus-flow

Construtor visual de fluxo de chatbot para WhatsApp.
Next.js (App Router) + TypeScript + `@xyflow/react` v12.

## Regra única

Não commitar código que eu não consiga explicar linha a linha.
Prefira explicação a solução pronta. Se a explicação ficar longa, simplifique
o código até caber numa explicação curta.

Este projeto tem defesa oral. Justificativa importa tanto quanto código.

## Convenções

- Domínio em português: `NoDoFluxo`, `nos`, `setNos`, `arestas`
- `interface`/`type` para formato. Sem classes, sem `this`
- `npx tsc --noEmit` antes de cada commit
- Commits atômicos, mensagem no imperativo

## Armadilhas

- A lib é `@xyflow/react` v12. Tutorial que importa de `reactflow` é
  anterior a jul/2024, API mudou. Não seguir.
- `npm run dev` não checa tipos. Nó inválido renderiza normalmente.
- O discriminante da união vive no campo `type` do React Flow, não em `data`.

## Decisões

Toda escolha de modelagem entra em `decisoes.md` com uma linha de porquê.
Se você propuser uma alternativa a algo que já está lá, cite a decisão.
