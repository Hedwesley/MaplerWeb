// token.js
export default class Token {
    constructor(tipo, lexema, literal, linha) {
      this.tipo = tipo;
      this.lexema = lexema;
      this.literal = literal;
      this.linha = linha;
    }
  
    toString() {
      return `[${this.tipo}] '${this.lexema}' (${this.literal ?? 'null'}) linha: ${this.linha}`;
    }
  }
  