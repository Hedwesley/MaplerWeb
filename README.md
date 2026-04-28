# 🧠 Mapler Web 

Este projeto consiste na implementação de um interpretador de código em Portugol (Mapler) para execução via web.

O sistema recebe um código, realiza análise léxica, sintática, gera uma AST e executa o programa, retornando saída, erros e estado das variáveis.

---

## 🚀 Tecnologias utilizadas

- Node.js
- JavaScript (ES6+)
- API REST
- Estrutura baseada em compiladores (Lexer, Parser, AST, Interpretador)

---

## 🧩 Fluxo de funcionamento


Código → Tokens → AST → Execução → Saída


---

## 📡 Endpoint principal

### ▶️ Executar código

```http
POST /executar
📥 Body da requisição
{
  "codigo": "variaveis x: inteiro; inicio x <- 10; escrever(x); fim",
  "entradas": []
}
📌 Parâmetros
Campo	Tipo	Obrigatório	Descrição
codigo	string	✔	Código Mapler a ser executado
entradas	array	❌	Valores usados pelo comando ler
📤 Resposta da API
{
  "sucesso": true,
  "tokens": [],
  "ast": {},
  "saida": [],
  "errosExecucao": [],
  "variaveis": {}
}
📊 Campos da resposta
Campo	Descrição
sucesso	Indica sucesso da execução
tokens	Lista de tokens gerados
ast	Estrutura sintática do código
saida	Valores impressos (escrever)
errosExecucao	Lista de erros durante execução
variaveis	Estado final das variáveis
🧪 Exemplos de uso
➤ Exemplo 1 — Operações matemáticas
{
  "codigo": "variaveis x: inteiro; inicio x <- 2 + 3 * 4; escrever(x); fim"
}
✔ Saída esperada
"saida": ["14"]
➤ Exemplo 2 — Entrada com ler
{
  "codigo": "variaveis x: inteiro; inicio ler(x); escrever(x); fim",
  "entradas": ["7"]
}
✔ Saída esperada
"saida": ["7"]
➤ Exemplo 3 — Estrutura de repetição
{
  "codigo": "variaveis x: inteiro; inicio x <- 1; enquanto x <= 5 faca escrever(x); x <- x + 1; fim enquanto; fim"
}
✔ Saída esperada
"saida": ["1", "2", "3", "4", "5"]
➤ Exemplo 4 — Condicional
{
  "codigo": "variaveis x: inteiro; inicio x <- 10; se x > 5 entao escrever(x); senao escrever(0); fim se; fim"
}
⚠️ Observações importantes

Estruturas devem ser fechadas com:

fim se;
fim enquanto;
fim para;
O comando ler utiliza o campo entradas do JSON
Comentários com // devem ter quebra de linha (\n)
🧱 Estrutura do projeto
backend/
 ├── controllers/
 ├── mapler-engine/
 │   ├── lexico.js
 │   ├── sintatico.js
 │   ├── Interpretador.js
 │   ├── ambiente.js
 │   └── ...
 └── server.js
▶️ Como rodar o projeto
npm install
npm start
🎯 Objetivo do projeto

Recriar o Mapler Desktop em versão web, permitindo execução de algoritmos diretamente no navegador.
