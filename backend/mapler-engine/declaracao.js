// declaracao.js - Com suporte ao Padrão Visitor

export class Programa {
  constructor(linha, variaveis, corpo, modulos, fim) {
    this.tipo = 'Programa';
    this.linha = linha;
    this.variaveis = variaveis;
    this.corpo = corpo;
    this.modulos = modulos;
    this.fim = fim;
  }
  aceitar(visitante) {
    return visitante.visitarPrograma(this);
  }
}

export class Fim {
  constructor(linha, token) {
    this.tipo = 'Fim';
    this.linha = linha;
    this.token = token;
  }
  aceitar(visitante) {
    return visitante.visitarFim(this);
  }
}

export class Ler {
  constructor(linha, variavel) {
    this.tipo = 'Ler';
    this.linha = linha;
    this.variavel = variavel; 
  }
  aceitar(visitante) {
    return visitante.visitarLer(this);
  }
}

export class Escreva {
  constructor(linha, expressoes) {
    this.tipo = 'Escreva';
    this.linha = linha;
    this.expressoes = expressoes;
  }
  aceitar(visitante) {
    return visitante.visitarEscreva(this);
  }
}

export class Var {
  constructor(linha, nome, tipo, dimensoes = []) {
    this.tipo = 'Var';
    this.linha = linha;
    this.nome = nome;
    this.tipoDado = tipo;
    this.dimensoes = dimensoes;
  }
  aceitar(visitante) {
    return visitante.visitarVar(this);
  }
}

export class VarDeclaracoes {
  constructor(linha, variaveis) {
    this.tipo = 'VarDeclaracoes';
    this.linha = linha;
    this.variaveis = variaveis; 
  }
  aceitar(visitante) {
    return visitante.visitarVarDeclaracoes(this);
  }
}

export class Bloco {
  constructor(linha, declaracoes) {
    this.tipo = 'Bloco';
    this.linha = linha;
    this.declaracoes = declaracoes;
  }
  aceitar(visitante) {
    return visitante.visitarBloco(this);
  }
}

export class Se {
  constructor(linha, condicao, entaoBloco, senaoBloco) {
    this.tipo = 'Se';
    this.linha = linha;
    this.condicao = condicao;
    this.entaoBloco = entaoBloco;
    this.senaoBloco = senaoBloco;
  }
  aceitar(visitante) {
    return visitante.visitarSe(this);
  }
}

export class Enquanto {
  constructor(linha, condicao, corpo) {
    this.tipo = 'Enquanto';
    this.linha = linha;
    this.condicao = condicao;
    this.corpo = corpo;
  }
  aceitar(visitante) {
    return visitante.visitarEnquanto(this);
  }
}

export class Para {
  constructor(linha, inicializacao, condicao, incremento, corpo) {
    this.tipo = 'Para';
    this.linha = linha;
    this.inicializacao = inicializacao; // Geralmente uma Atribuicao
    this.condicao = condicao;
    this.incremento = incremento; // Geralmente uma Atribuicao
    this.corpo = corpo;
  }
  aceitar(visitante) {
    return visitante.visitarPara(this);
  }
}

export class Repita {
  constructor(linha, corpo, condicao) {
    this.tipo = 'Repita';
    this.linha = linha;
    this.corpo = corpo;
    this.condicao = condicao;
  }
  aceitar(visitante) {
    return visitante.visitarRepita(this);
  }
}

// Nota: No Java original, Modulo não tem parâmetros no parser.
// Mantive os parâmetros para suportar a tua evolução, mas o padrão Visitor chama 'visitarModulo'
export class Modulo {
  constructor(linha, nome, parametros, corpo) {
    this.tipo = 'Modulo';
    this.linha = linha;
    this.nome = nome;
    this.parametros = parametros; 
    this.corpo = corpo;
  }
  aceitar(visitante) {
    return visitante.visitarModulo(this);
  }
}

export class ChamadaModulo {
  constructor(linha, identificador) {
    this.tipo = 'ChamadaModulo';
    this.linha = linha;
    this.identificador = identificador; // Token
  }
  aceitar(visitante) {
    return visitante.visitarChamadaModulo(this);
  }
}

export class Retorne {
  constructor(linha, valor) {
    this.tipo = 'Retorne';
    this.linha = linha;
    this.valor = valor; 
  }
  aceitar(visitante) {
    return visitante.visitarRetorne(this);
  }
}