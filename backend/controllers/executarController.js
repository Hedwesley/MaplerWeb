// executadorController.js
import AnalisadorLexico from '../mapler-engine/lexico.js';
import { AnalisadorSintatico } from '../mapler-engine/sintatico.js';
import { Interpretador } from '../mapler-engine/Interpretador.js';
import { EventosService } from '../mapler-engine/EventosService.js';

const mapaParaObjeto = (mapa) => Object.fromEntries(mapa.entries());

const executar = async (req, res) => {
  const codigo = req.body.codigo;

  try {
    const lexer = new AnalisadorLexico();
    const tokens = lexer.scanTokens(codigo);

    const parser = new AnalisadorSintatico();
    const ast = parser.parse(tokens);

    if (!ast) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Não foi possível gerar a AST do código informado.'
      });
    }

    const eventosService = new EventosService();
    const interpretador = new Interpretador(eventosService);

    await interpretador.interpretar(ast);

    return res.json({
      sucesso: true,
      tokens,
      ast,
      saida: eventosService.saidas,
      errosExecucao: eventosService.erros,
      variaveis: mapaParaObjeto(interpretador.ambiente.valores)
    });
  } catch (erro) {
    return res.status(400).json({
      sucesso: false,
      erro: erro.message
    });
  }
};

export default { executar };