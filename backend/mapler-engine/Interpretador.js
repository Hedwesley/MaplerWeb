// interpretador.js
import { Vetor } from '../vetor.js';
import { Ambiente } from '../ambiente.js';
import { obterTipoDoValor, converterInputString } from '../checadorTipos.js';

// Classe auxiliar para guardar a definição de um módulo e torná-lo "chamável"
class ModuloChamavel {
    constructor(declaracao) {
      this.declaracao = declaracao; // nó Decl.Modulo
    }
  
    async chamar(interpretador, argumentos) {
      // Guarda o ambiente atual
      const ambienteAnterior = interpretador.ambiente;
  
      // Cria um novo ambiente local, encadeado
      const ambienteLocal = new Ambiente(ambienteAnterior);
      interpretador.ambiente = ambienteLocal;
  
      try {
        // Liga parâmetros formais aos argumentos recebidos
        const params = this.declaracao.parametros || [];
        for (let i = 0; i < params.length; i++) {
          const param = params[i];
          const valorArg = i < argumentos.length ? argumentos[i] : null;
  
          // O tipo está em param.tipo (token de tipo), o nome em param.nome (token IDENTIFICADOR)
          ambienteLocal.definir(param.nome.lexema, param.tipo.tipo, valorArg);
        }
  
        // Executa o corpo do módulo no ambiente local
        await interpretador.executarBloco(this.declaracao.corpo, ambienteLocal);
      } catch (erro) {
        // Se for o nosso “retorne”
        if (erro.tipo === 'RETORNO_FUNCAO') {
          interpretador.ambiente = ambienteAnterior; // restaura antes de retornar
          return erro.valor;
        }
        // Erros reais sobem
        interpretador.ambiente = ambienteAnterior;
        throw erro;
      }
  
      // Se terminou sem 'retorne', restaura e devolve null
      interpretador.ambiente = ambienteAnterior;
      return null;
    }
  }
  

export class Interpretador {
    constructor(eventosService) {
        this.eventosService = eventosService;
        this.ambiente = new Ambiente(); // O ambiente é criado junto com o interpretador
        this.resolverInput = null;
    }

    async interpretar(ast) {
      if (!ast) {
          this.erro("Erro de sintaxe impediu a execucao.");
          return;
      }
      
      this.ambiente = new Ambiente();

      try {
          const corpoPrincipal = ast.corpo.declaracoes;
          const definicoesModulos = ast.modulos;

          // --- O NOVO SISTEMA DE TRÊS PASSOS ---

          // 1º PASSO: Declarar todas as variáveis e módulos primeiro.
          for (const comando of corpoPrincipal) {
              if (comando.tipo === 'VarDeclaracoes') {
                  await this.visitarVarDeclaracoes(comando);
              }
          }

          // 2º PASSO: Registrar as definições dos módulos.
          if (definicoesModulos && definicoesModulos.length > 0) {
              for (const modulo of definicoesModulos) {
                  await this.visitarModulo(modulo);
              }
          }

          // 3º PASSO: Executar o resto do código (atribuições, chamadas, etc.).
          for (const comando of corpoPrincipal) {
              if (comando.tipo !== 'VarDeclaracoes') {
                  await this.executarDeclaracao(comando);
              }
          }

      } catch (erro) {
        if(erro.tipo === 'RETORNO_FUNCAO') {
          return;
      }
      this.erro(erro.message || erro);
  }
}
    async executarBloco(bloco, ambiente) {
        for (const declaracao of bloco.declaracoes) {
            await this.executarDeclaracao(declaracao);
        }
    }

    async executarDeclaracao(declaracao) {
        if (!declaracao) return;
        try {
             return await declaracao.aceitar(this);
        } catch (e) {
             // Fallback caso você tenha esquecido de colocar 'aceitar' em alguma classe nova
             if (e.message.includes("aceitar is not a function")) {
                 const nomeMetodo = `visitar${declaracao.tipo}`;
                 if (this[nomeMetodo]) return await this[nomeMetodo](declaracao);
             }
             throw e;
        }
    }
    // --- MÉTODOS DE VISITAÇÃO PARA DECLARAÇÕES ---

    async visitarVarDeclaracoes(declaracao) {
        for (const variavel of declaracao.variaveis) {
            if (variavel.tipoDado.tipo === 'TIPO_MODULO') {
                this.ambiente.definir(variavel.nome.lexema, variavel.tipoDado.tipo, null);
                continue;
            }
            let valorInicial = null;
            if (variavel.dimensoes && variavel.dimensoes.length > 0) {
                valorInicial = new Vetor(variavel.tipoDado.tipo, variavel.dimensoes);
            }
            this.ambiente.definir(variavel.nome.lexema, variavel.tipoDado.tipo, valorInicial);
        }
    }

    async visitarExpressao(declaracao) {
        await this.avaliarExpressao(declaracao.expressao);
    }

    async visitarEscreva(declaracao) {
        const valores = [];
        for (const expr of declaracao.expressoes) {
          const val = await this.avaliarExpressao(expr);
          if (typeof val === 'boolean') valores.push(val ? 'verdadeiro' : 'falso');
          else valores.push(val !== null && val !== undefined ? val.toString() : 'nulo');
        }
        this.eventosService.notificar("ESCREVER", valores.join(""));
      }
      
    async visitarSe(declaracao) {
        const condicaoSe = await  this.avaliarExpressao(declaracao.condicao);
        if (condicaoSe) {
            await this.executarBloco(declaracao.entao, this.ambiente);
        } else if (declaracao.senao) {
            await this.executarBloco(declaracao.senao, this.ambiente);
        }
    }

    async visitarEnquanto(declaracao) {
        while (await this.avaliarExpressao(declaracao.condicao)) {
            await this.executarBloco(declaracao.corpo, this.ambiente);
        }
    }
    
    async visitarRepita(declaracao) {
        do {
            await this.executarBloco(declaracao.corpo, this.ambiente);
        } while (!await this.avaliarExpressao(declaracao.condicao));
    }

    async visitarPara(declaracao) {
        await this.avaliarExpressao(declaracao.inicializacao);
        while (await this.avaliarExpressao(declaracao.condicao)) {
            await this.executarBloco(declaracao.corpo, this.ambiente);
            await this.avaliarExpressao(declaracao.incremento);
        }
    }

    async visitarLer(declaracao) {
        const promiseDoInput = new Promise((resolve) => { this.resolverInput = resolve; });
        this.eventosService.notificar("INPUT_SOLICITADO");
        const valorLido = await promiseDoInput;
        const tipoVariavel = this.ambiente.tipos.get(declaracao.variavel.lexema);
        const valorConvertido = converterInputString(valorLido, tipoVariavel);
        this.ambiente.atribuir(declaracao.variavel, valorConvertido);
    }
    
    async visitarModulo(declaracao) {
        const modulo = new ModuloChamavel(declaracao);
        // ATRIBUI a definição do módulo à variável já declarada.
       this.ambiente.definir(declaracao.nome.lexema, 'TIPO_MODULO', modulo);
    }

    async visitarChamadaModulo(declaracao) {
        const moduloChamavel = this.ambiente.obter(declaracao.nome);
        if (moduloChamavel && moduloChamavel instanceof ModuloChamavel) {
            await moduloChamavel.chamar(this);
        } else {
            throw new Error(`Erro: '${declaracao.nome.lexema}' nao e um modulo chamavel ou nao foi definido.`);
        }
    }

    // --- MÉTODOS DE VISITAÇÃO PARA EXPRESSÕES ---

    async avaliarExpressao(expr) {
        if (!expr) return null;
        
        // CORREÇÃO: Mesmo princípio para expressões
        try {
            return await expr.aceitar(this);
        } catch (e) {
             if (e.message.includes("aceitar is not a function")) {
                 const nomeMetodo = `visitar${expr.tipo}`;
                 if (this[nomeMetodo]) return await this[nomeMetodo](expr);
             }
             throw e;
        }
    }
    async visitarAtribuicao(expr) {
        const valor = await this.avaliarExpressao(expr.valor);
        this.ambiente.atribuir(expr.nome, valor);
        return valor;
      }
      

      async visitarAtribuicaoArray(expr) {
        const valorAtribuir = await this.avaliarExpressao(expr.valor);
        const vetor = this.ambiente.obter(expr.nome);
        const indices = [];
        for (const idx of expr.indices) {
            indices.push(await this.avaliarExpressao(idx));
        }
        vetor.atribuir(indices, valorAtribuir);
        return valorAtribuir;
    }

    async visitarBinario(expr) {
        const esquerda = await this.avaliarExpressao(expr.esquerda);
        const direita = await this.avaliarExpressao(expr.direita);
        return this.avaliarOperacaoBinaria(expr.operador.tipo, esquerda, direita);
      }
      

    async visitarLogico(expr) {
        const esquerda = await this.avaliarExpressao(expr.esquerda);
        if (expr.operador.tipo === "OU") {
            if (esquerda) return true;
        } else { // E
            if (!esquerda) return false;
        }
        return await this.avaliarExpressao(expr.direita);
    }

    async visitarUnario(expr) {
        const direita = await this.avaliarExpressao(expr.direita);
        switch (expr.operador.tipo) {
            case "NAO": return !direita;
            case "MENOS": return -direita;
        }
        return null;
    }

    async visitarExpParentizada(expr) {
        return await this.avaliarExpressao(expr.grupo.expressao);
    }

    visitarVariavel(expr) {
        return this.ambiente.obter(expr.nome);
    }

    async visitarVariavelArray(expr) {
        const vetor = this.ambiente.obter(expr.nome);
        const indices = [];
        for (const idx of expr.indices) {
            indices.push(await this.avaliarExpressao(idx));
        }
        return vetor.obter(indices);
    }

    visitarLiteral(expr) {
        return expr.valor;
    }

    async visitarChamada(expr) {
        const calleeValor = await this.avaliarExpressao(expr.callee);
        const argumentos = [];
        for (const arg of expr.argumentos) {
          argumentos.push(await this.avaliarExpressao(arg));
        }
      
        if (calleeValor && calleeValor instanceof ModuloChamavel) {
          return await calleeValor.chamar(this, argumentos);
        }
      
        this.erro(`Tentativa de chamar algo que não é módulo/função: ${expr.callee.nome?.lexema || 'desconhecido'}`);
      }
      
      
    
    avaliarOperacaoBinaria(operadorTipo, esquerda, direita) {
        switch (operadorTipo) {
          case "MAIS": return esquerda + direita;
          case "MENOS": return esquerda - direita;
          case "ASTERISCO": return esquerda * direita;
          case "BARRA": return esquerda / direita;
          case "RESTO": return esquerda % direita;
          case "IGUAL": return esquerda === direita;
          case "DIFERENTE": return esquerda !== direita;
          case "MAIOR_QUE": return esquerda > direita;
          case "MENOR_QUE": return esquerda < direita;
          case "MAIOR_IGUAL": return esquerda >= direita;
          case "MENOR_IGUAL": return esquerda <= direita;
          default:
            this.erro(`Operador binário não implementado: ${operadorTipo}`);
        }
    }
    
    erro(mensagem) {
        console.error("Erro de execução:", mensagem);
        if (this.eventosService) {
          this.eventosService.notificar("ERRO", mensagem);
        }
        throw new Error(mensagem);
    }

    // Adicione isso junto com os outros métodos visitar...

    async visitarRetorne(declaracao) {
        let valor = null;
        if (declaracao.valor) {
          valor = await this.avaliarExpressao(declaracao.valor);
        }
        throw { tipo: 'RETORNO_FUNCAO', valor: valor };
      }
      
}