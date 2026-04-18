import AnalisadorLexico from '../mapler-engine/lexico.js';
import { AnalisadorSintatico } from '../mapler-engine/sintatico.js';
import { Interpretador } from '../mapler-engine/Interpretador.js';
import { EventosService } from '../mapler-engine/EventosService.js';

const mapaParaObjetoDetalhado = (mapa) => {
  const objeto = {};

  for (const [nome, registro] of mapa.entries()) {
    if (registro && typeof registro === 'object' && 'valor' in registro) {
      objeto[nome] = {
        tipo: registro.tipo,
        valor: registro.valor
      };
    } else {
      objeto[nome] = {
        tipo: null,
        valor: registro
      };
    }
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
      variaveis: mapaParaObjetoDetalhado(interpretador.ambiente.valores)
    });
  } catch (erro) {
    return res.status(400).json({
      sucesso: false,
      erro: erro.message
    });
  }
};

export default { executar };