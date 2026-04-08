export function obterTipoDoValor(valor) {
    if (typeof valor === 'number') {
        return Number.isInteger(valor) ? 'TIPO_INTEIRO' : 'TIPO_REAL';
    }
    if (typeof valor === 'string') return 'TIPO_CADEIA';
    if (typeof valor === 'boolean') return 'TIPO_LOGICO';
    if (valor instanceof Object && valor.tipo === 'Vetor') return 'TIPO_VETOR'; // Para o futuro
    return null;
}

export function converterInputString(valorString, tipoEsperado) {
    let valorConvertido;
    try {
        switch (tipoEsperado) {
            case 'TIPO_INTEIRO':
                valorConvertido = parseInt(valorString, 10);
                if (isNaN(valorConvertido)) throw new Error();
                break;
            case 'TIPO_REAL':
                valorConvertido = parseFloat(valorString);
                if (isNaN(valorConvertido)) throw new Error();
                break;
            case 'TIPO_LOGICO':
                if (valorString.toLowerCase() === 'verdadeiro') valorConvertido = true;
                else if (valorString.toLowerCase() === 'falso') valorConvertido = false;
                else throw new Error();
                break;
            default: // TIPO_CADEIA
                valorConvertido = valorString;
        }
    } catch(e) {
        throw new Error(`Valor de entrada '${valorString}' é invalido para uma variavel do tipo ${tipoEsperado}.`);
    }
    return valorConvertido;
}