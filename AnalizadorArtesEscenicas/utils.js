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

