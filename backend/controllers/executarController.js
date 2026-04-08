// executadorController.js
import AnalisadorLexico from "../mapler-engine/lexico.js"
import { AnalisadorSintatico } from "../mapler-engine/sintatico.js"

const executar = (req, res) => {
  const codigo = req.body.codigo

  try {
    const lexer = new AnalisadorLexico()
    const tokens = lexer.scanTokens(codigo)

    const parser = new AnalisadorSintatico()
    const ast = parser.parse(tokens)

    res.json({
      sucesso: true,
      tokens,
      ast
    })

  } catch (erro) {
    res.status(400).json({
      sucesso: false,
      erro: erro.message
    })
  }
}

export default { executar }