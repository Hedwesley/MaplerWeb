// lexico.js
import { TiposToken } from "./tiposToken.js"
import Token from "./token.js"

export default class AnalisadorLexico {

  constructor(eventosService) {
    this.eventosService = eventosService;
    this.source = '';
    this.tokens = [];
    this.comeco = 0;
    this.atual = 0;
    this.linha = 1;

    this.keywords = {
      e: TiposToken.E,
      ou: TiposToken.OU,
      nao: TiposToken.NAO,
      verdadeiro: TiposToken.VERDADEIRO,
      falso: TiposToken.FALSO,
      se: TiposToken.SE,
      entao: TiposToken.ENTAO,
      caso: TiposToken.CASO,
      senao: TiposToken.SENAO,
      faca: TiposToken.FACA,
      enquanto: TiposToken.ENQUANTO,
      repita: TiposToken.REPITA,
      para: TiposToken.PARA,
      de: TiposToken.DE,
      ate: TiposToken.ATE,
      passo: TiposToken.PASSO,
      escrever: TiposToken.ESCREVER,
      ler: TiposToken.LER,
      retorne: TiposToken.RETORNE,
      variaveis: TiposToken.VARIAVEIS,
      inicio: TiposToken.INICIO,
      fim: TiposToken.FIM,
      inteiro: TiposToken.TIPO_INTEIRO,
      real: TiposToken.TIPO_REAL,
      logico: TiposToken.TIPO_LOGICO,
      cadeia: TiposToken.TIPO_CADEIA,
      caractere: TiposToken.TIPO_CARACTERE,
      '..': TiposToken.INTERVALO,
      modulo: TiposToken.TIPO_MODULO,
      vetor: TiposToken.TIPO_VETOR
    };
  }

  scanTokens(source) {
    this.source = source.trim();
    this.comeco = 0;
    this.atual = 0;
    this.linha = 1;
    this.tokens = [];

    while (!this.isFinal()) {
      this.comeco = this.atual;
      this.scanToken();
    }

    this.tokens.push(new Token(TiposToken.EOF, '', null, this.linha));
    // Logs removidos para limpar saída dos testes
    return this.tokens;
  }

  isFinal() {
    return this.atual >= this.source.length;
  }

  scanToken() {
    const c = this.avancar();
    switch (c) {
      case '(': return this.addToken(TiposToken.ESQ_PARENTESES);
      case ')': return this.addToken(TiposToken.DIR_PARENTESES);
      case '[': return this.addToken(TiposToken.ESQ_COLCHETE);
      case ']': return this.addToken(TiposToken.DIR_COLCHETE);
      case '{': return this.addToken(TiposToken.ESQ_CHAVES);
      case '}': return this.addToken(TiposToken.DIR_CHAVES);
      case ',': return this.addToken(TiposToken.VIRGULA);
      case '.': return this.comparar('.') ? this.addToken(TiposToken.INTERVALO) : this.addToken(TiposToken.PONTO);
      case '-': return this.addToken(TiposToken.MENOS);
      case '+': return this.addToken(TiposToken.MAIS);
      case '%': return this.addToken(TiposToken.RESTO);
      case '^': return this.addToken(TiposToken.POTENCIA);
      case ';': return this.addToken(TiposToken.PONTO_VIRGULA);
      case '*': return this.addToken(TiposToken.ASTERISCO);
      case ':': return this.addToken(TiposToken.DOIS_PONTOS);
      case '=': return this.addToken(TiposToken.IGUAL);
      case '<':
        if (this.comparar('=')) return this.addToken(TiposToken.MENOR_IGUAL);
        if (this.comparar('-')) return this.addToken(TiposToken.ATRIBUICAO);
        if (this.comparar('>')) return this.addToken(TiposToken.DIFERENTE);
        return this.addToken(TiposToken.MENOR_QUE);
      case '>':
        return this.addToken(this.comparar('=') ? TiposToken.MAIOR_IGUAL : TiposToken.MAIOR_QUE);
      case '/':
        if (this.comparar('/')) {
          while (this.checar() !== '\n' && !this.isFinal()) this.avancar();
        } else {
          this.addToken(TiposToken.BARRA);
        }
        break;
      case ' ':
      case '\r':
      case '\t':
        break; // ignora
      case '\n':
        this.linha++;
        break;
      case '"':
        this.cadeia();
        break;
      default:
        if (this.isNumerico(c)) {
          this.numero();
        } else if (this.isLetra(c)) {
          this.identificador();
        } else {
          this.eventosService.notificar('ERRO', {
            linha: this.linha,
            mensagem: `Caractere '${c}' não identificado.`,
          });
        }
        break;
    }
  }

  avancar() {
    return this.source[this.atual++];
  }

  checar() {
    return this.isFinal() ? '\0' : this.source[this.atual];
  }

  comparar(esperado) {
    if (this.isFinal() || this.source[this.atual] !== esperado) return false;
    this.atual++;
    return true;
  }

  checkProximo() {
    return this.atual + 1 >= this.source.length ? '\0' : this.source[this.atual + 1];
  }

  isNumerico(c) {
    return c >= '0' && c <= '9';
  }

  isLetra(c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
  }

  isLetraOuNumero(c) {
    return this.isLetra(c) || this.isNumerico(c);
  }

  identificador() {
    while (this.isLetraOuNumero(this.checar())) this.avancar();
    const texto = this.source.substring(this.comeco, this.atual);
    const tipo = this.keywords[texto] || TiposToken.IDENTIFICADOR;
    this.addToken(tipo);
  }

  numero() {
    while (this.isNumerico(this.checar())) this.avancar();
    if (this.checar() === '.' && this.isNumerico(this.checkProximo())) {
      this.avancar();
      while (this.isNumerico(this.checar())) this.avancar();
    }
    const texto = this.source.substring(this.comeco, this.atual);
    const valor = texto.includes('.') ? parseFloat(texto) : parseInt(texto);
    this.addToken(texto.includes('.') ? TiposToken.REAL : TiposToken.INTEIRO, valor);
  }

  cadeia() {
    while (this.checar() !== '"' && !this.isFinal()) {
      if (this.checar() === '\n') this.linha++;
      this.avancar();
    }

    if (this.isFinal()) {
      this.eventosService.notificar('ERRO', {
        linha: this.linha,
        mensagem: 'Cadeia não determinada.',
      });
      return;
    }

    this.avancar(); // fecha aspas
    const valor = this.source.substring(this.comeco + 1, this.atual - 1);
    if (valor.length === 1) {
      this.addToken(TiposToken.CARACTERE, valor);
    } else {
      this.addToken(TiposToken.CADEIA, valor);
    }
  }

  addToken(tipo, literal = null) {
    const texto = this.source.substring(this.comeco, this.atual);
    this.tokens.push(new Token(tipo, texto, literal, this.linha));
  }
}