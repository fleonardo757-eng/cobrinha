# Cobrinha — Jogo Clássico com Níveis e Ranking

Jogo da Cobrinha desenvolvido com **HTML5 Canvas**, **CSS** e **JavaScript puro**, sem dependências externas ou backend. Inclui 5 níveis com dificuldade progressiva, obstáculos, controles por teclado e toque e ranking persistido no `localStorage`.

## Estrutura do Projeto

- `index.html` — Estrutura da página, tabuleiro `<canvas>`, telas de início/pausa/fim de jogo e ranking.
- `style.css` — Layout responsivo para computador e celular.
- `script.js` — Lógica do jogo, progressão dos 5 níveis, colisões, controles e persistência no `localStorage`.

> **Dica:** Antes de publicar, edite a linha `Criado por [Seu Nome]` no arquivo `index.html` com o seu nome.

## Como rodar localmente

Por utilizar módulos JavaScript nativos (`type="module"`), execute com um servidor estático simples na pasta do projeto:

```bash
npx serve .
```

Ou usando Python:

```bash
python3 -m http.server 8080
```

Depois acesse `http://localhost:8080` (ou a URL exibida no terminal). Também funciona com a extensão **Live Server** do VS Code.

## Como publicar na Vercel

1. Envie os arquivos (`index.html`, `style.css`, `script.js` e `README.md`) para um repositório no **GitHub**.
2. Acesse [vercel.com](https://vercel.com) e clique em **Add New Project**.
3. Importe o repositório do GitHub.
4. Em **Framework Preset**, selecione **Other** (sem comando de build e com diretório de saída `.`).
5. Clique em **Deploy**. O site ficará no ar em segundos.
