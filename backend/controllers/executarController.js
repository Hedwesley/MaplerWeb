import AnalisadorLexico from '../mapler-engine/lexico.js';
import { AnalisadorSintatico } from '../mapler-engine/sintatico.js';
import { Interpretador } from '../mapler-engine/Interpretador.js';
import { EventosService } from '../mapler-engine/EventosService.js';

const mapaVariaveisDetalhado = (ambiente) => {
  const objeto = {};

  for (const [nome, valor] of ambiente.valores.entries()) {
    objeto[nome] = {
      tipo: ambiente.tipos.get(nome) || null,
      valor: valor
    };
  }

  return objeto;
};

const executar = async (req, res) => {
  const codigo = req.body.codigo;
  const entradas = req.body.entradas || [];

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
    const interpretador = new Interpretador(eventosService, entradas);

    await interpretador.interpretar(ast);

    return res.json({
      sucesso: true,
      tokens,
      ast,
      saida: eventosService.saidas,
      errosExecucao: eventosService.erros,
      variaveis: mapaVariaveisDetalhado(interpretador.ambiente)
    });
  } catch (erro) {
    return res.status(400).json({
      sucesso: false,
      erro: erro.message
    });
  }
};

export default { executar };