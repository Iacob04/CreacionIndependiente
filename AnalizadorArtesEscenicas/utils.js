/**
 * Lee un archivo Excel (.xlsx / .xls) y devuelve un array de objetos.
 * Cada elemento representa una fila; las claves son los nombres de columna
 * tomados de la primera fila del archivo.
 *
  @param {File} file 
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
// Analiza una columna del Excel y devuelve cuántas veces aparece
// cada valor y qué porcentaje representa sobre el total.
// Ejemplo: contarPorCampo(datos, 'Genero') → [{nombre:'Danza', cantidad:45, porcentaje:'32.1'}, ...]
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


// Extrae el año de un campo de fecha del Excel.
// Funciona tanto si el valor es "2018" como "01/03/2018" o "2018-03-01".
// Devuelve null si no encuentra ningún año válido.
function extraerAnio(valor) {
  if (!valor) return null
  const texto = String(valor).trim()

  if (/^\d{4}$/.test(texto)) return parseInt(texto)

  const coincidencia = texto.match(/\d{4}/)
  if (coincidencia) return parseInt(coincidencia[0])

  return null
}


// Calcula la mediana de un array de números.
// La mediana es el valor central cuando los números están ordenados.
// Si hay cantidad par de elementos, devuelve la media de los dos centrales.
function calcularMediana(array) {
  const ordenado = [...array].sort(function(a, b) { return a - b })
  const mitad    = Math.floor(ordenado.length / 2)

  if (ordenado.length % 2 === 0) {
    return (ordenado[mitad - 1] + ordenado[mitad]) / 2
  } else {
    return ordenado[mitad]
  }
}


// Analiza una columna numérica del Excel agrupando los valores en rangos.
// fnRango es la función que decide en qué rango cae cada número
// (rangoInterpretes, rangoDuracion, rangoCoste o rangoCache).
// Ejemplo: contarPorRango(datos, 'Duracion', rangoDuracion)
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


// Devuelve el rango de tamaño del elenco según el número de intérpretes.
function rangoInterpretes(n) {
  if (n === 1)  return 'Solo (1)'
  if (n === 2)  return 'Duo (2)'
  if (n <= 5)   return 'Pequeno (3-5)'
  if (n <= 10)  return 'Mediano (6-10)'
  if (n <= 20)  return 'Grande (11-20)'
  return 'Muy grande (+20)'
}

// Devuelve el rango de duración en minutos de un espectáculo.
function rangoDuracion(n) {
  if (n <= 30)  return 'Menos de 30 min'
  if (n <= 45)  return '31 a 45 min'
  if (n <= 60)  return '46 a 60 min'
  return 'Mas de 60 min'
}

// Devuelve el rango del coste de producción en euros.
function rangoCoste(n) {
  if (n <= 5000)  return 'Menos de 5.000'
  if (n <= 10000) return '5.001 a 10.000'
  if (n <= 20000) return '10.001 a 20.000'
  if (n <= 30000) return '20.001 a 30.000'
  if (n <= 50000) return '30.001 a 50.000'
  if (n <= 75000) return '50.001 a 75.000'
  return 'Mas de 75.000'
}

// Devuelve el rango del caché del espectáculo (precio por función) en euros.
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
// Analiza las redes sociales de las compañías.
// Devuelve dos tablas: cuántas redes tiene cada compañía
// y cuántas compañías tienen cada red social.
function analizarRedes(datos) {
  const total     = datos.length
  const porRed    = {}  // cuántas empresas tienen cada red
  const porNumero = {}  // cuántas redes tiene cada empresa

  datos.forEach(function(fila) {
    let redesDeEstaEmpresa = 0

    for (let i = 1; i <= 6; i++) {
      const columna = 'Redes sociales ' + i + ' red'
      const valor   = String(fila[columna] || '').trim()

      if (valor && valor !== 'Sin datos') {
        redesDeEstaEmpresa++
        porRed[valor] = (porRed[valor] || 0) + 1
      }
    }

    porNumero[redesDeEstaEmpresa] = (porNumero[redesDeEstaEmpresa] || 0) + 1
  })

  const tablaPorRed = Object.entries(porRed)
    .map(function(e) {
      return {
        nombre:     e[0],
        cantidad:   e[1],
        porcentaje: ((e[1] / total) * 100).toFixed(1)
      }
    })
    .sort(function(a, b) { return b.cantidad - a.cantidad })

  const tablaPorNumero = Object.entries(porNumero)
    .map(function(e) {
      return {
        nombre:     e[0] + ' redes',
        cantidad:   e[1],
        porcentaje: ((e[1] / total) * 100).toFixed(1)
      }
    })
    .sort(function(a, b) { return parseInt(a.nombre) - parseInt(b.nombre) })

  return { tablaPorRed, tablaPorNumero }
}

// Analiza los espacios de las compañías.
// Devuelve dos tablas: distribución por tipo de espacio
// y distribución por régimen de tenencia.
function analizarEspacios(datos) {
  const total      = datos.length
  const porTipo    = {}
  const porRegimen = {}

  datos.forEach(function(fila) {
    for (let i = 1; i <= 6; i++) {
      const tipo    = String(fila['Espacios ' + i + ' tipo']    || '').trim()
      const regimen = String(fila['Espacios ' + i + ' regimen'] || '').trim()

      if (tipo) {
        porTipo[tipo] = (porTipo[tipo] || 0) + 1
      }
      if (regimen) {
        porRegimen[regimen] = (porRegimen[regimen] || 0) + 1
      }
    }
  })

  const tablaTipo = Object.entries(porTipo)
    .map(function(e) {
      return {
        nombre:     e[0],
        cantidad:   e[1],
        porcentaje: ((e[1] / total) * 100).toFixed(1)
      }
    })
    .sort(function(a, b) { return b.cantidad - a.cantidad })

  const tablaRegimen = Object.entries(porRegimen)
    .map(function(e) {
      return {
        nombre:     e[0],
        cantidad:   e[1],
        porcentaje: ((e[1] / total) * 100).toFixed(1)
      }
    })
    .sort(function(a, b) { return b.cantidad - a.cantidad })

  return { tablaTipo, tablaRegimen }
}

// Extrae el mes de un campo de fecha del Excel.
// Devuelve un número del 1 al 12, o null si no lo encuentra.
function extraerMes(valor) {
  if (!valor) return null
  const texto = String(valor).trim()

  // Si es formato DD/MM/YYYY
  const formato1 = texto.match(/^\d{1,2}\/(\d{1,2})\/\d{4}$/)
  if (formato1) return parseInt(formato1[1])

  // Si es formato YYYY-MM-DD
  const formato2 = texto.match(/^\d{4}-(\d{2})-\d{2}$/)
  if (formato2) return parseInt(formato2[1])

  return null
}

// Recibe el nombre de un país y devuelve si la función
// es de mercado Interior (España) o Exterior (cualquier otro país).
function calcularMercado(pais) {
  if (!pais) return 'Sin datos'
  const p = String(pais).trim().toLowerCase()
  if (p === 'españa' || p === 'spain' || p === 'es') return 'Interior'
  return 'Exterior'
}

function calcularRegion(pais) {
  if (!pais) return 'Sin datos'

  // Normalizamos: quitamos espacios, pasamos a minúsculas
  // y eliminamos tildes para que "España", "españa" y "ESPANA" funcionen igual
  function normalizar(texto) {
    return String(texto).trim().toLowerCase()
      .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
      .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ü/g, 'u')
      .replace(/ñ/g, 'n')
  }

  const REGIONES = {
    'espana': 'Interior',

    // EUROPA
    'alemania': 'Europa', 'austria': 'Europa', 'belgica': 'Europa',
    'bosnia': 'Europa', 'bulgaria': 'Europa', 'chipre': 'Europa',
    'croacia': 'Europa', 'dinamarca': 'Europa', 'eslovaquia': 'Europa',
    'eslovenia': 'Europa', 'estonia': 'Europa', 'finlandia': 'Europa',
    'francia': 'Europa', 'grecia': 'Europa', 'hungria': 'Europa',
    'irlanda': 'Europa', 'islandia': 'Europa', 'italia': 'Europa',
    'kosovo': 'Europa', 'letonia': 'Europa', 'liechtenstein': 'Europa',
    'lituania': 'Europa', 'luxemburgo': 'Europa', 'malta': 'Europa',
    'moldavia': 'Europa', 'monaco': 'Europa', 'montenegro': 'Europa',
    'noruega': 'Europa', 'paises bajos': 'Europa', 'holanda': 'Europa',
    'polonia': 'Europa', 'portugal': 'Europa', 'reino unido': 'Europa',
    'republica checa': 'Europa', 'rumania': 'Europa', 'rusia': 'Europa',
    'serbia': 'Europa', 'suecia': 'Europa', 'suiza': 'Europa',
    'ucrania': 'Europa', 'bielorrusia': 'Europa', 'andorra': 'Europa',
    'macedonia': 'Europa', 'albania': 'Europa',

    // MAGREB
    'marruecos': 'Magreb', 'argelia': 'Magreb', 'tunez': 'Magreb',
    'libia': 'Magreb', 'mauritania': 'Magreb',

    // ORIENTE MEDIO (incluye Turquía)
    'turquia': 'Oriente Medio', 'israel': 'Oriente Medio',
    'jordania': 'Oriente Medio', 'libano': 'Oriente Medio',
    'siria': 'Oriente Medio', 'irak': 'Oriente Medio',
    'iran': 'Oriente Medio', 'kuwait': 'Oriente Medio',
    'arabia saudi': 'Oriente Medio', 'emiratos': 'Oriente Medio',
    'emiratos arabes': 'Oriente Medio', 'qatar': 'Oriente Medio',
    'bahrein': 'Oriente Medio', 'oman': 'Oriente Medio',
    'yemen': 'Oriente Medio', 'palestina': 'Oriente Medio',
    'egipto': 'Oriente Medio',

    // ASIA (incluye Armenia, Australia, Nueva Zelanda)
    'armenia': 'Asia', 'australia': 'Asia', 'nueva zelanda': 'Asia',
    'china': 'Asia', 'japon': 'Asia', 'corea del sur': 'Asia',
    'corea del norte': 'Asia', 'india': 'Asia', 'indonesia': 'Asia',
    'tailandia': 'Asia', 'vietnam': 'Asia', 'filipinas': 'Asia',
    'malasia': 'Asia', 'singapur': 'Asia', 'taiwan': 'Asia',
    'hong kong': 'Asia', 'mongolia': 'Asia', 'nepal': 'Asia',
    'pakistan': 'Asia', 'bangladesh': 'Asia', 'sri lanka': 'Asia',
    'kazajistan': 'Asia', 'uzbekistan': 'Asia', 'georgia': 'Asia',
    'azerbaiyan': 'Asia', 'afganistan': 'Asia',

    // ÁFRICA
    'sudafrica': 'Africa', 'nigeria': 'Africa', 'kenia': 'Africa',
    'ghana': 'Africa', 'etiopia': 'Africa', 'tanzania': 'Africa',
    'uganda': 'Africa', 'camerun': 'Africa', 'senegal': 'Africa',
    'costa de marfil': 'Africa', 'angola': 'Africa', 'mozambique': 'Africa',
    'zimbabwe': 'Africa', 'zambia': 'Africa', 'ruanda': 'Africa',
    'mali': 'Africa', 'burkina faso': 'Africa', 'guinea': 'Africa',
    'benin': 'Africa', 'congo': 'Africa', 'sudan': 'Africa',

    // NORTEAMÉRICA
    'estados unidos': 'Norteamerica', 'ee.uu.': 'Norteamerica',
    'eeuu': 'Norteamerica', 'usa': 'Norteamerica', 'canada': 'Norteamerica',

    // LATINOAMÉRICA
    'mexico': 'Latinoamerica', 'argentina': 'Latinoamerica',
    'brasil': 'Latinoamerica', 'colombia': 'Latinoamerica',
    'chile': 'Latinoamerica', 'peru': 'Latinoamerica',
    'venezuela': 'Latinoamerica', 'ecuador': 'Latinoamerica',
    'bolivia': 'Latinoamerica', 'paraguay': 'Latinoamerica',
    'uruguay': 'Latinoamerica', 'cuba': 'Latinoamerica',
    'republica dominicana': 'Latinoamerica', 'puerto rico': 'Latinoamerica',
    'costa rica': 'Latinoamerica', 'panama': 'Latinoamerica',
    'guatemala': 'Latinoamerica', 'honduras': 'Latinoamerica',
    'el salvador': 'Latinoamerica', 'nicaragua': 'Latinoamerica',
  }

  const region = REGIONES[normalizar(pais)]
  return region || 'Otras regiones'
}