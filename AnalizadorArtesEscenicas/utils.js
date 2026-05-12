/**
 * Lee un archivo Excel (.xlsx / .xls) y devuelve un array de objetos.
 * Cada elemento representa una fila; las claves son los nombres de columna
 * tomados de la primera fila del archivo.
 *
 * @param {File} file  Objeto File obtenido de un <input type="file">
 * @returns {Promise<Object[]>}
 */
function leerExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // Primera hoja del libro
        const nombreHoja = workbook.SheetNames[0];
        const hoja = workbook.Sheets[nombreHoja];

        // header: 1 → primera fila como cabecera, defval: "" → celdas vacías como string vacío
        const filas = XLSX.utils.sheet_to_json(hoja, { defval: "" });

        resolve(filas);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function contarPorCampo(datos, columna) {
  const total   = datos.length
  const conteos = {}

  datos.forEach(function(fila) {
    const valor = fila[columna] || 'Sin datos'
    conteos[valor] = (conteos[valor] || 0) + 1
  })

  const resultado = Object.entries(conteos).map(function(entrada) {
    return {
      nombre:     entrada[0],
      cantidad:   entrada[1],
      porcentaje: ((entrada[1] / total) * 100).toFixed(1)
    }
  })

  return resultado.sort(function(a, b) {
    return b.cantidad - a.cantidad
  })
}
function extraerAnio(valor) {
  if (!valor) return null
  const texto = String(valor).trim()

  if (/^\d{4}$/.test(texto)) return parseInt(texto)

  const coincidencia = texto.match(/\d{4}/)
  if (coincidencia) return parseInt(coincidencia[0])

  return null
}
function calcularMediana(array) {
  const ordenado = [...array].sort(function(a, b) { return a - b })
  const mitad    = Math.floor(ordenado.length / 2)

  if (ordenado.length % 2 === 0) {
    return (ordenado[mitad - 1] + ordenado[mitad]) / 2
  } else {
    return ordenado[mitad]
  }
}

function contarPorRango(datos, columna, fnRango) {
  const total   = datos.length
  const conteos = {}

  datos.forEach(function(fila) {
    const numero = parseFloat(fila[columna])
    if (isNaN(numero)) {
      conteos['Sin datos'] = (conteos['Sin datos'] || 0) + 1
      return
    }
    const rango = fnRango(numero)
    conteos[rango] = (conteos[rango] || 0) + 1
  })

  return Object.entries(conteos).map(function(entrada) {
    return {
      nombre:     entrada[0],
      cantidad:   entrada[1],
      porcentaje: ((entrada[1] / total) * 100).toFixed(1)
    }
  })
}

function rangoInterpretes(n) {
  if (n === 1)  return 'Solo (1)'
  if (n === 2)  return 'Duo (2)'
  if (n <= 5)   return 'Pequeno (3-5)'
  if (n <= 10)  return 'Mediano (6-10)'
  if (n <= 20)  return 'Grande (11-20)'
  return 'Muy grande (+20)'
}

function rangoDuracion(n) {
  if (n <= 30)  return 'Menos de 30 min'
  if (n <= 45)  return '31 a 45 min'
  if (n <= 60)  return '46 a 60 min'
  return 'Mas de 60 min'
}

function rangoCoste(n) {
  if (n <= 5000)  return 'Menos de 5.000'
  if (n <= 10000) return '5.001 a 10.000'
  if (n <= 20000) return '10.001 a 20.000'
  if (n <= 30000) return '20.001 a 30.000'
  if (n <= 50000) return '30.001 a 50.000'
  if (n <= 75000) return '50.001 a 75.000'
  return 'Mas de 75.000'
}

function rangoCache(n) {
  if (n <= 500)   return 'Menos de 500'
  if (n <= 1500)  return '501 a 1.500'
  if (n <= 3000)  return '1.501 a 3.000'
  if (n <= 5000)  return '3.001 a 5.000'
  if (n <= 7500)  return '5.001 a 7.500'
  if (n <= 10000) return '7.501 a 10.000'
  if (n <= 15000) return '10.001 a 15.000'
  if (n <= 20000) return '15.001 a 20.000'
  return 'Mas de 20.000'
}
