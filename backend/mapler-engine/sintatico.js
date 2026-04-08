// sintatico.js
import * as Decl from './declaracao.js';
import * as Expr from './expressao.js';
import { TiposToken } from './tiposToken.js';

export class AnalisadorSintatico {
  constructor(eventosService) {
    this.eventosService = eventosService;
    this.tokens = [];
    this.index = 0;
  }

  // ==========================================================
  // 1. MÉTODO PRINCIPAL: PARSE (ESTRUTURA RÍGIDA DO MAPLER JAVA)
  // Ordem: Variaveis -> Inicio -> Corpo -> Fim -> Modulos
  // ==========================================================
  parse(tokens) {
    this.tokens = tokens;
    this.index = 0;

    const variaveis = [];
    const corpo = [];
    const modulos = [];
    let fimNode = null;

    try {
      // 1. SEÇÃO DE VARIÁVEIS (Global - Opcional)
      if (this.checar(TiposToken.VARIAVEIS)) {
        this.avancar(); // Consome 'variaveis'
        
        // Enquanto não encontrar 'inicio', continua lendo declarações
        while (!this.isFim() && !this.checar(TiposToken.INICIO)) {
          // Usa a sua lógica de declaração de variáveis (vetores/matrizes)
          const decl = this.declaracaoVariaveis(); 
          if (decl) variaveis.push(decl); 
        }
      }

      // 2. SEÇÃO INICIO (Obrigatória)
      this.consumirToken(TiposToken.INICIO, "Esperado 'inicio' após declaração de variáveis.");

      // 3. CORPO DO PROGRAMA
      // Lê declarações até encontrar 'fim'
      while (!this.isFim() && !this.checar(TiposToken.FIM)) {
        const decl = this.declaracao();
        if (decl) corpo.push(decl);
      }

      // 4. FIM DO PROGRAMA (Obrigatório)
      const tokenFim = this.consumirToken(TiposToken.FIM, "Esperado 'fim' ao final do bloco principal.");
      
      // Consome ponto final opcional (compatibilidade com Pascal/Mapler)
      if (this.checar(TiposToken.PONTO)) {
          this.avancar(); 
      } else if (this.checar(TiposToken.PONTO_VIRGULA)) {
          // Algumas versões antigas usavam ; no final
          this.avancar();
      }
      
      fimNode = new Decl.Fim(tokenFim.linha, tokenFim);

      // 5. MÓDULOS (Apenas após o fim do programa principal)
      while (!this.isFim()) {
        if (this.checar(TiposToken.TIPO_MODULO)) {
            // Se encontrar 'modulo', processa a definição
            modulos.push(this.declaracaoModulo());
        } else {
            // Se encontrar lixo (que não seja EOF), é erro.
            if (this.espiar().tipo === TiposToken.EOF) break;
            
            // Ignora quebras de linha/espaços residuais se o tokenizer gerar tokens vazios
            // Mas se for token real, é erro de sintaxe.
             this.erro(this.espiar(), "Código inesperado após o 'fim'. Apenas definições de 'modulo' são permitidas aqui.");
        }
      }

      // Retorna a AST completa
      return new Decl.Programa(0, variaveis, corpo, modulos, fimNode);

    } catch (erro) {
      // Se ocorrer erro fatal, notifica e retorna null
      if (this.eventosService) {
         // O erro já foi notificado dentro do método this.erro(), 
         // aqui só garantimos o retorno seguro.
      }
      return null;
    }
  }

  // ==========================================================
  // 2. MÉTODOS DE DECLARAÇÃO (Statements)
  // ==========================================================

  declaracao() {
    try {
      if (this.isTokenTypeIgualA(TiposToken.ESCREVER)) return this.escreverDeclaracao();
      if (this.isTokenTypeIgualA(TiposToken.LER)) return this.lerDeclaracao();
      if (this.isTokenTypeIgualA(TiposToken.SE)) return this.seDeclaracao();
      if (this.isTokenTypeIgualA(TiposToken.ENQUANTO)) return this.enquantoDeclaracao();
      if (this.isTokenTypeIgualA(TiposToken.PARA)) return this.paraDeclaracao();
      if (this.isTokenTypeIgualA(TiposToken.REPITA)) return this.repitaDeclaracao();
      if (this.isTokenTypeIgualA(TiposToken.RETORNE)) return this.retorneDeclaracao();
      
      // Se encontrar 'inicio' dentro do corpo, é um bloco aninhado
      if (this.checar(TiposToken.INICIO)) {
          const tokenInicio = this.consumirToken(TiposToken.INICIO, "Esperado 'inicio'");
          return new Decl.Bloco(tokenInicio.linha, this.bloco());
      }

      // Se não for palavra-chave, deve ser uma Expressão ou Chamada
      return this.expressaoDeclaracao();

    } catch (erro) {
      this.sincronizar();
      return null;
    }
  }

  // Bloco genérico (usado dentro de SE, ENQUANTO, etc)
  bloco() {
    const declaracoes = [];
    while (
      !this.checar(TiposToken.FIM) &&
      !this.checar(TiposToken.SENAO) &&
      !this.checar(TiposToken.ATE) &&
      !this.isFim()
    ) {
       // Permite variáveis locais em blocos (Evolução do seu projeto)
       if (this.checar(TiposToken.VARIAVEIS)) {
         this.avancar(); 
         while (this.checar(TiposToken.IDENTIFICADOR)) {
           declaracoes.push(this.declaracaoVariaveis());
         }
         continue;
       } 

       const decl = this.declaracao();
       if (decl !== null) declaracoes.push(decl);
    }
    return declaracoes;
  }

  // --- Declarações Específicas ---

  declaracaoVariaveis() {
    const nomes = [];
    do {
        nomes.push(this.consumirToken(TiposToken.IDENTIFICADOR, 'Esperado nome da variavel.'));
    } while (this.isTokenTypeIgualA(TiposToken.VIRGULA));

    this.consumirToken(TiposToken.DOIS_PONTOS, 'Esperado ":" apos nomes.');

    const variaveisDeclaradas = [];

    // Lógica para Vetor
    if (this.isTokenTypeIgualA(TiposToken.TIPO_VETOR)) {
        this.consumirToken(TiposToken.ESQ_COLCHETE, 'Esperado "[" apos "vetor".');
        const dimensoes = [];
        do { 
            const valor = this.consumirToken(TiposToken.INTEIRO, 'Esperado tamanho da dimensao.');
            dimensoes.push(valor.literal);
        } while(this.isTokenTypeIgualA(TiposToken.VIRGULA));
        
        this.consumirToken(TiposToken.DIR_COLCHETE, 'Esperado "]".');
        this.consumirToken(TiposToken.DE, 'Esperado "de".');
        
        const tipoDoVetor = this.tipoDado();
        for (const nome of nomes) {
            variaveisDeclaradas.push(new Decl.Var(nome.linha, nome, tipoDoVetor, dimensoes));
        }
    } else { 
        // Tipo Simples
        const tipo = this.tipoDado();
        for (const nome of nomes) {
            variaveisDeclaradas.push(new Decl.Var(nome.linha, nome, tipo, []));
        }
    }
    this.consumirToken(TiposToken.PONTO_VIRGULA, 'Esperado ";"');
    return new Decl.VarDeclaracoes(nomes[0].linha, variaveisDeclaradas);
  }

  declaracaoModulo() {
      // modulo nome (params...)
      // variaveis ...
      // inicio ... fim modulo;
      
      const tokenModulo = this.consumirToken(TiposToken.TIPO_MODULO, "Esperado 'modulo'.");
      const nome = this.consumirToken(TiposToken.IDENTIFICADOR, 'Esperado nome do módulo.');

      const parametros = [];
      const declaracoes = [];

      // 1. Parâmetros (Opcionais)
      if (this.isTokenTypeIgualA(TiposToken.ESQ_PARENTESES)) {
        if (!this.checar(TiposToken.DIR_PARENTESES)) {
            do {
                const nomeParam = this.consumirToken(TiposToken.IDENTIFICADOR, 'Nome do parâmetro.');
                this.consumirToken(TiposToken.DOIS_PONTOS, 'Esperado ":"');
                const tipoParam = this.tipoDado();
                parametros.push({ nome: nomeParam, tipo: tipoParam });
            } while (this.isTokenTypeIgualA(TiposToken.VIRGULA));
        }
        this.consumirToken(TiposToken.DIR_PARENTESES, 'Esperado ")"');
      }

      // 2. Variáveis Locais do Módulo
      if (this.checar(TiposToken.VARIAVEIS)) {
        this.avancar();
        while (!this.isFim() && !this.checar(TiposToken.INICIO)) {
          const declVars = this.declaracaoVariaveis();
          if (declVars) declaracoes.push(declVars);
        }
      }

      // 3. Corpo do Módulo
      this.consumirToken(TiposToken.INICIO, 'Esperado "inicio" no módulo.');
      
      while (!this.isFim() && !this.checar(TiposToken.FIM)) {
        const decl = this.declaracao();
        if (decl) declaracoes.push(decl);
      }

      this.consumirToken(TiposToken.FIM, 'Esperado "fim"');
      this.consumirToken(TiposToken.TIPO_MODULO, 'Esperado "modulo" após "fim".');
      
      if(this.checar(TiposToken.PONTO_VIRGULA)) this.avancar();

      return new Decl.Modulo(nome.linha, nome, parametros, new Decl.Bloco(nome.linha, declaracoes));
  }

  escreverDeclaracao() {
    const expressoes = [];
    do {
      expressoes.push(this.expressao());
    } while (this.isTokenTypeIgualA(TiposToken.VIRGULA));
    this.consumirToken(TiposToken.PONTO_VIRGULA, 'Esperado ";"');
    return new Decl.Escreva(this.anterior().linha, expressoes);
  }

  lerDeclaracao() {
    const linha = this.anterior().linha;
    const variavel = this.consumirToken(TiposToken.IDENTIFICADOR, "Nome da variavel.");
    
    // Suporte a leitura de vetor: ler v[0];
    let varNode;
    if (this.isTokenTypeIgualA(TiposToken.ESQ_COLCHETE)) {
         const indices = [];
         do { indices.push(this.expressao()); } while(this.isTokenTypeIgualA(TiposToken.VIRGULA));
         this.consumirToken(TiposToken.DIR_COLCHETE, "Esperado ']'");
         varNode = new Expr.VariavelArray(linha, variavel, indices);
    } else {
         varNode = new Expr.Variavel(linha, variavel);
    }

    this.consumirToken(TiposToken.PONTO_VIRGULA, "Esperado ';'");
    return new Decl.Ler(linha, varNode);
  }

  retorneDeclaracao() {
    const palavraChave = this.anterior(); 
    let valor = null;
    if (!this.checar(TiposToken.PONTO_VIRGULA)) {
        valor = this.expressao();
    }
    this.consumirToken(TiposToken.PONTO_VIRGULA, "Esperado ';'");
    return new Decl.Retorne(palavraChave.linha, valor);
  }

  seDeclaracao() {
    const condicao = this.ou(); // Expressão lógica
    const inicio = this.consumirToken(TiposToken.ENTAO, 'Esperado "entao"');
    
    // Bloco Entao
    const entaoDeclaracoes = this.bloco();
    const entaoBloco = new Decl.Bloco(inicio.linha, entaoDeclaracoes);
  
    let senaoBloco = null;
    if (this.isTokenTypeIgualA(TiposToken.SENAO)) {
      const senaoDeclaracoes = this.bloco();
      senaoBloco = new Decl.Bloco(this.anterior().linha, senaoDeclaracoes);
    }
  
    this.consumirToken(TiposToken.FIM, 'Esperado "fim se"');
    this.consumirToken(TiposToken.SE, 'Esperado "fim se"');
    this.consumirToken(TiposToken.PONTO_VIRGULA, 'Esperado ";"');
  
    return new Decl.Se(inicio.linha, condicao, entaoBloco, senaoBloco);
  }

  enquantoDeclaracao() {
    const condicao = this.ou();
    const faca = this.consumirToken(TiposToken.FACA, 'Esperado "faca"');
    const corpo = new Decl.Bloco(faca.linha, this.bloco());
  
    this.consumirToken(TiposToken.FIM, 'Esperado "fim enquanto"');
    this.consumirToken(TiposToken.ENQUANTO, 'Esperado "fim enquanto"');
    this.consumirToken(TiposToken.PONTO_VIRGULA, 'Esperado ";"');
  
    return new Decl.Enquanto(faca.linha, condicao, corpo);
  }

  paraDeclaracao() {
      // Mantive a sua lógica inteligente de detecção de passo regressivo
      const identificador = this.consumirToken(TiposToken.IDENTIFICADOR, 'Nome da variável de controle.');
      this.consumirToken(TiposToken.DE, 'Esperado "de".');
      const de = this.adicao(); // valor inicial

      const linha = this.consumirToken(TiposToken.ATE, 'Esperado "ate".').linha;
      const ate = this.adicao(); // valor final

      let passo;
      let ehRegressivo = false;

      if (this.isTokenTypeIgualA(TiposToken.PASSO)) {
        passo = this.adicao();
        // Heurística para detectar passo negativo
        if (passo.tipo === 'Unario' && passo.operador.tipo === 'MENOS') {
          ehRegressivo = true;
        }
        if (passo.tipo === 'Literal' && passo.valor < 0) {
          ehRegressivo = true;
        }
      } else {
        // Passo padrão = 1
        passo = new Expr.Literal(linha, 1, { tipo: TiposToken.INTEIRO, literal: 1, linha });
        // Heurística de loop implícito regressivo
        if (de.tipo === 'Literal' && ate.tipo === 'Literal' && de.valor > ate.valor) {
          ehRegressivo = true;
        }
      }

      this.consumirToken(TiposToken.FACA, 'Esperado "faca"');
      const corpo = new Decl.Bloco(identificador.linha, this.bloco());

      // Transformação Sintática (Desugar) para AST
      const varRef = new Expr.Variavel(identificador.linha, identificador);
      const inicial = new Expr.Atribuicao(identificador.linha, identificador, de);
      
      const operadorCondicao = ehRegressivo 
          ? { tipo: TiposToken.MAIOR_IGUAL, lexema: '>=' } 
          : { tipo: TiposToken.MENOR_IGUAL, lexema: '<=' };

      const condicao = new Expr.Binario(identificador.linha, varRef, operadorCondicao, ate);

      const incremento = new Expr.Atribuicao(
        identificador.linha,
        identificador,
        new Expr.Binario(identificador.linha, varRef, {
          tipo: TiposToken.MAIS,
          lexema: '+',
        }, passo)
      );

      this.consumirToken(TiposToken.FIM, 'Esperado "fim para"');
      this.consumirToken(TiposToken.PARA, 'Esperado "fim para"');
      this.consumirToken(TiposToken.PONTO_VIRGULA, 'Esperado ";"');

      return new Decl.Para(identificador.linha, inicial, condicao, incremento, corpo);
  }

  repitaDeclaracao() {
    const inicio = this.anterior();
    const corpo = new Decl.Bloco(inicio.linha, this.bloco());
  
    this.consumirToken(TiposToken.ATE, 'Esperado "ate"');
    const condicao = this.ou();
    this.consumirToken(TiposToken.PONTO_VIRGULA, 'Esperado ";"');
  
    return new Decl.Repita(inicio.linha, corpo, condicao);
  }

  expressaoDeclaracao() {
    const expr = this.expressao();
    this.consumirToken(TiposToken.PONTO_VIRGULA, 'Esperado ";" após expressão.');

    // Se a expressão for apenas uma variável ("minhaFuncao;"), 
    // converte para Chamada de Procedimento sem argumentos.
    if (expr.tipo === 'Variavel') {
      const chamada = new Decl.ChamadaModulo(expr.linha, expr.nome); // Usando nó específico de Declaração
      return chamada;
    }
    
    // Se for Chamada (Expressão), envelopa numa declaração
    if (expr.tipo === 'Chamada') {
        // Isso acontece se o parser de expressão detectou parenteses: minhaFuncao();
        // Precisamos converter ou aceitar. Como já é uma expressão válida, ok.
        // Mas idealmente, se for void, deveria ser Decl.ChamadaModulo.
        // Por hora, tratamos como expressão solta.
    }

    return expr; // Retorna como expressão (ex: atribuição)
  }

  // ==========================================================
  // 3. EXPRESSÕES (Matemática e Lógica)
  // ==========================================================

  expressao() {
    return this.atribuicao();
  }
  
  atribuicao() {
    const expr = this.ou();
  
    if (this.isTokenTypeIgualA(TiposToken.ATRIBUICAO)) {
      const operador = this.anterior();
      const valor = this.atribuicao();
  
      if (expr.tipo === 'Variavel') {
        return new Expr.Atribuicao(expr.linha, expr.nome, valor);
      }
  
      if (expr.tipo === 'VariavelArray') {
        return new Expr.AtribuicaoArray(expr.linha, expr.nome, expr.indices, valor);
      }
  
      this.erro(operador, 'Alvo de atribuição inválido.');
    }
    return expr;
  }

  ou() {
    let expr = this.e();
    while (this.isTokenTypeIgualA(TiposToken.OU)) {
      const operador = this.anterior();
      const direita = this.e();
      expr = new Expr.Logico(operador.linha, expr, operador, direita);
    }
    return expr;
  }
  
  e() {
    let expr = this.igualdade();
    while (this.isTokenTypeIgualA(TiposToken.E)) {
      const operador = this.anterior();
      const direita = this.igualdade();
      expr = new Expr.Logico(operador.linha, expr, operador, direita);
    }
    return expr;
  }
  
  igualdade() {
    let expr = this.comparacao();
    while (this.isTokenTypeIgualA(TiposToken.IGUAL, TiposToken.DIFERENTE)) {
      const operador = this.anterior();
      const direita = this.comparacao();
      expr = new Expr.Binario(operador.linha, expr, operador, direita);
    }
    return expr;
  }
  
  comparacao() {
    let expr = this.adicao();
    while (this.isTokenTypeIgualA(TiposToken.MAIOR_QUE, TiposToken.MAIOR_IGUAL, TiposToken.MENOR_QUE, TiposToken.MENOR_IGUAL)) {
      const operador = this.anterior();
      const direita = this.adicao();
      expr = new Expr.Binario(operador.linha, expr, operador, direita);
    }
    return expr;
  }
  
  adicao() {
    let expr = this.multiplicacao();
    while (this.isTokenTypeIgualA(TiposToken.MAIS, TiposToken.MENOS)) {
      const operador = this.anterior();
      const direita = this.multiplicacao();
      expr = new Expr.Binario(operador.linha, expr, operador, direita);
    }
    return expr;
  }
  
  multiplicacao() {
    let expr = this.unario();
    while (this.isTokenTypeIgualA(TiposToken.ASTERISCO, TiposToken.BARRA, TiposToken.RESTO, TiposToken.POTENCIA)) {
      const operador = this.anterior();
      const direita = this.unario();
      expr = new Expr.Binario(operador.linha, expr, operador, direita);
    }
    return expr;
  }
  
  unario() {
    if (this.isTokenTypeIgualA(TiposToken.NAO, TiposToken.MENOS)) {
      const operador = this.anterior();
      const direita = this.unario();
      return new Expr.Unario(operador.linha, operador, direita);
    }
    return this.primario();
  }
  
  primario() {
    // Identificador (Variavel, Vetor ou Chamada)
    if (this.isTokenTypeIgualA(TiposToken.IDENTIFICADOR)) {
      const nome = this.anterior();
  
      // Chamada de função: minhaFuncao(arg1)
      if (this.isTokenTypeIgualA(TiposToken.ESQ_PARENTESES)) {
        const argumentos = [];
        if (!this.checar(TiposToken.DIR_PARENTESES)) {
          do {
            argumentos.push(this.expressao());
          } while (this.isTokenTypeIgualA(TiposToken.VIRGULA));
        }
        this.consumirToken(TiposToken.DIR_PARENTESES, 'Esperado ")"');
        
        // Retorna Expressão de Chamada
        return new Expr.Chamada(nome.linha, new Expr.Variavel(nome.linha, nome), argumentos);
      }
  
      // Acesso a Array: vetor[i]
      if (this.isTokenTypeIgualA(TiposToken.ESQ_COLCHETE)) {
        const indices = [];
        do {
          indices.push(this.ou());
        } while (this.isTokenTypeIgualA(TiposToken.VIRGULA));
        this.consumirToken(TiposToken.DIR_COLCHETE, 'Esperado "]"');
        return new Expr.VariavelArray(nome.linha, nome, indices);
      }
  
      // Variavel Simples
      return new Expr.Variavel(nome.linha, nome);
    }
  
    // Literais
    if (this.isTokenTypeIgualA(TiposToken.VERDADEIRO)) return new Expr.Literal(this.anterior().linha, true, this.anterior());
    if (this.isTokenTypeIgualA(TiposToken.FALSO)) return new Expr.Literal(this.anterior().linha, false, this.anterior());
    if (this.isTokenTypeIgualA(TiposToken.INTEIRO, TiposToken.REAL, TiposToken.CADEIA, TiposToken.CARACTERE)) {
      const token = this.anterior();
      return new Expr.Literal(token.linha, token.literal, token);
    }
  
    // Agrupamento ( )
    if (this.isTokenTypeIgualA(TiposToken.ESQ_PARENTESES)) {
      const expr = this.expressao();
      this.consumirToken(TiposToken.DIR_PARENTESES, 'Esperado ")"');
      return new Expr.ExpParentizada(this.anterior().linha, new Expr.Grupo(this.anterior().linha, expr));
    }
  
    throw this.erro(this.espiar(), 'Esperado expressão.');
  }

  // ==========================================================
  // 4. HELPERS E UTILITÁRIOS
  // ==========================================================

  tipoDado() {
    if (this.isTokenTypeIgualA(
        TiposToken.TIPO_INTEIRO, TiposToken.TIPO_CADEIA, TiposToken.TIPO_CARACTERE,
        TiposToken.TIPO_LOGICO, TiposToken.TIPO_REAL, TiposToken.TIPO_MODULO, TiposToken.TIPO_VETOR
    )) {
      return this.anterior();
    }
    throw this.erro(this.espiar(), 'Tipo de dado inválido.');
  }

  // Helpers de Navegação
  isFim() { return this.espiar().tipo === TiposToken.EOF; }
  espiar() { return this.tokens[this.index]; }
  anterior() { return this.tokens[this.index - 1]; }
  
  avancar() {
    if (!this.isFim()) this.index++;
    return this.anterior();
  }

  checar(tipo) {
    if (this.isFim()) return false;
    return this.espiar().tipo === tipo;
  }

  isTokenTypeIgualA(...tipos) {
    for (const tipo of tipos) {
      if (this.checar(tipo)) {
        this.avancar();
        return true;
      }
    }
    return false;
  }

  consumirToken(tipo, mensagem) {
    if (this.checar(tipo)) return this.avancar();
    throw this.erro(this.espiar(), mensagem);
  }
// No final do arquivo sintatico.js
  erro(token, mensagem) {
    const erroObj = {
        linha: token.linha,
        mensagem: mensagem
    };
    
    // Agora enviamos o objeto completo, como o EventosService espera
    if (this.eventosService) {
      this.eventosService.notificar('ERRO', erroObj);
    }
    
    // Retornamos o erro para ser lançado no throw
    return new Error(`[Linha ${token.linha}] Erro de sintaxe: ${mensagem}`);
  }

  sincronizar() {
    this.avancar();
    while (!this.isFim()) {
      if (this.anterior().tipo === TiposToken.PONTO_VIRGULA) return;
      switch (this.espiar().tipo) {
        case TiposToken.VARIAVEIS:
        case TiposToken.INICIO:
        case TiposToken.FIM:
        case TiposToken.ENQUANTO:
        case TiposToken.PARA:
        case TiposToken.SE:
        case TiposToken.LER:
        case TiposToken.ESCREVER:
        case TiposToken.REPITA:
        case TiposToken.TIPO_MODULO:
          return;
      }
      this.avancar();
    }
  }
}