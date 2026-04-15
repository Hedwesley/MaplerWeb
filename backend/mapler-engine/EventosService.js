export class EventosService {
  constructor() {
    this.saidas = [];
    this.erros = [];
    this.inputSolicitado = false;
  }

  notificar(tipo, payload = null) {
    if (tipo === 'ESCREVER') {
      this.saidas.push(String(payload));
      return;
    }

    if (tipo === 'ERRO') {
      this.erros.push(payload);
      return;
    }

    if (tipo === 'INPUT_SOLICITADO') {
      this.inputSolicitado = true;
    }
  }
}