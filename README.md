# Arquivo de Springfield

Projeto acadêmico de front-end sobre personagens de **Os Simpsons**, desenho que marcou a cultura pop dos anos 1990. A interface consulta a [The Simpsons API](https://thesimpsonsapi.com/) e monta os cartões automaticamente com JavaScript.

## Como executar

1. Descompacte a pasta do projeto.
2. Abra a pasta no VS Code e inicie um servidor local, como a extensão Live Server; ou rode `python -m http.server 5500` no terminal dentro desta pasta.
3. Acesse `http://localhost:5500` no navegador.

O projeto usa HTML, CSS e JavaScript puro. A conexão exige internet porque os dados e os retratos vêm da API pública.

## O que a página faz

- Busca personagens com `fetch` em `https://thesimpsonsapi.com/api/characters?page=N`.
- Lê os metadados de paginação e até 20 personagens da resposta.
- Cria os cartões com `document.createElement`, `textContent` e `appendChild`.
- Permite paginar e filtrar os 20 personagens carregados por nome, ocupação e status.
- Mostra estados de carregamento, lista vazia e falha de conexão.

Busca e status são filtros locais da página atual. A documentação consultada da API informa a paginação, mas não documenta filtros de nome.

## Estrutura

```text
index.html
styles.css
script.js
assets/
  portrait-placeholder.svg
```

## API e atribuição

The Simpsons API: [thesimpsonsapi.com](https://thesimpsonsapi.com/). Os dados de personagens são provenientes da The Simpsons Wiki; consulte a licença e os créditos indicados pelo serviço.

