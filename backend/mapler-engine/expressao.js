// Arquivo: expressao.js - COMPLETO COM CLASSE CHAMADA

export class Literal {
  constructor(linha, valor, token) {
    this.tipo = 'Literal';
    this.linha = linha;
    this.valor = valor;
    this.token = token;
  }
  aceitar(visitante) {
    return visitante.visitarLiteral(this);
  }
}

export class Binario {
  constructor(linha, esquerda, operador, direita) {
    this.tipo = 'Binario';
    this.linha = linha;
    this.esquerda = esquerda;
    this.operador = operador;
    this.direita = direita;
  }
  aceitar(visitante) {
    return visitante.visitarBinario(this);
  }
}

export class Unario {
  constructor(linha, operador, direita) {
    this.tipo = 'Unario';
    this.linha = linha;
    this.operador = operador;
    this.direita = direita;
  }
  aceitar(visitante) {
    return visitante.visitarUnario(this);
  }
}

export class Logico {
    constructor(linha, esquerda, operador, direita) {
      this.tipo = 'Logico';
      this.linha = linha;
      this.esquerda = esquerda;
      this.operador = operador;
      this.direita = direita;
    }
    aceitar(visitante) {
      return visitante.visitarLogico(this);
    }
  }

export class Variavel {
  constructor(linha, nome) {
    this.tipo = 'Variavel';
    this.linha = linha;
    this.nome = nome;
  }
  aceitar(visitante) {
    return visitante.visitarVariavel(this);
  }
}

export class VariavelArray {
  constructor(linha, nome, indices) { 
    this.tipo = 'VariavelArray';
    this.linha = linha;
    this.nome = nome;
    this.indices = indices; 
  }
  aceitar(visitante) {
    return visitante.visitarVariavelArray(this);
  }
}

export class Atribuicao {
  constructor(linha, nome, valor) {
    this.tipo = 'Atribuicao';
    this.linha = linha;
    this.nome = nome;
    this.valor = valor;
  }
  aceitar(visitante) {
    return visitante.visitarAtribuicao(this);
  }
}

export class AtribuicaoArray {
  constructor(linha, nome, indices, valor) {
    this.tipo = 'AtribuicaoArray';
    this.linha = linha;
    this.nome = nome;
    this.indices = indices; 
    this.valor = valor;
  }
  aceitar(visitante) {
    return visitante.visitarAtribuicaoArray(this);
  }
}

// --- CLASSE NOVA ADICIONADA ---
export class Chamada {
  constructor(linha, callee, argumentos) {
    this.tipo = 'Chamada';
    this.linha = linha;
    this.callee = callee; // A expressão sendo chamada (geralmente uma Variavel)
    this.argumentos = argumentos; // Array de expressões
  }
  aceitar(visitante) {
    return visitante.visitarChamada(this);
  }
}
// ------------------------------

export class Grupo {
  constructor(linha, expressao) {
    this.tipo = 'Grupo';
    this.linha = linha;
    this.expressao = expressao;
  }
  aceitar(visitante) {
    return visitante.visitarGrupo(this);
  }
}

export class ExpParentizada {
  constructor(linha, grupo) {
    this.tipo = 'ExpParentizada';
    this.linha = linha;
    this.grupo = grupo;
  }
  aceitar(visitante) {
    return visitante.visitarExpParentizada(this);
  }
}