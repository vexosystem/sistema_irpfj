# CORRECAO HEADER MOBILE AUTOOCULTAVEL IRPFJ

## Causa raiz do header atrapalhar no mobile

O header estava ocupando espaco demais no mobile porque:

- ficava sempre visivel no topo
- usava estrutura alta com titulo, subtitulo, navegacao e acoes
- permanecia em `sticky`, sem liberar area util quando o usuario descia a pagina

Na pratica, a barra superior continuava consumindo altura valiosa em telas pequenas e reduzia a area disponivel para o conteudo principal.

## Estrategia adotada

Foi mantida a arquitetura atual baseada em `AppShell`, mas o comportamento do header foi ajustado especificamente para mobile:

- no mobile, o header passou a funcionar como barra fixa superior
- um listener de scroll detecta direcao da rolagem
- ao rolar para baixo, o header se recolhe com transicao suave
- ao rolar para cima, o header reaparece
- no topo da pagina, o header volta a ficar sempre visivel
- um espaco dinamico acompanha a altura real do header
- quando o header se oculta, esse espaco colapsa para `0`

Isso faz com que o conteudo realmente suba e aproveite a area liberada, sem deixar espaco morto.

## Arquivos alterados

- `src/components/layout/AppShell.tsx`
- `CORRECAO_HEADER_MOBILE_AUTOOCULTAVEL_IRPFJ.md`

## Como o comportamento funciona

### Mobile

1. ao abrir a tela, o header aparece no topo
2. a altura real do header e medida dinamicamente
3. ao rolar para baixo com deslocamento suficiente, o header sai da viewport com `translateY`
4. ao mesmo tempo, o espaco reservado para ele reduz para `0`
5. o conteudo principal sobe e ganha area visivel
6. ao rolar para cima, o header reaparece
7. ao voltar para perto do topo, ele permanece visivel

### Desktop

- o comportamento continua essencialmente o mesmo
- o header permanece em `sticky`
- nao ha auto-ocultacao no desktop

## Impactos no layout

- o header continua no topo em todas as telas
- o mobile agora ganha area util durante a leitura e uso
- o desktop nao foi alterado de forma estrutural
- a navegacao, os botoes e as acoes continuam acessiveis
- o recolhimento nao deixa espaco vazio permanente
- a transicao foi configurada para evitar flicker e instabilidade no scroll

## Telas impactadas e validadas por layout global

Como a mudanca foi feita no `AppShell`, ela se aplica de forma consistente a:

- dashboard
- lista de clientes
- detalhe do cliente
- novo exercicio
- detalhe do exercicio
- edicao

## Checklist de validacao

- header aparece no topo ao abrir a tela no mobile
- ao rolar para baixo, o header se recolhe
- o conteudo sobe e aproveita a area liberada
- ao rolar para cima, o header reaparece
- nao existe espaco morto permanente quando o header esta oculto
- nao ha sobreposicao quebrando conteudo ou botoes
- nao ha flicker perceptivel no scroll
- desktop continua funcional e sem regressao de comportamento

## Validacao executada

```bash
npm run build
npm run typecheck
```
