const { useState, useEffect, useRef } = React;

// --- COMPONENTES BASE ---

function EstadisticasBar({ datos, promedioCustom, medianaCustom, etiquetaCustom = "N" }) {
  if (!datos || datos.length === 0) return null;

  const promedio = promedioCustom !== undefined
    ? promedioCustom
    : (datos.map(d => d.n).reduce((a, b) => a + b, 0) / datos.length).toFixed(1);
  const mediana = medianaCustom !== undefined
    ? medianaCustom
    : (typeof window.calcularMediana === 'function' ? window.calcularMediana(datos.map(d => d.n)) : 0);

  return (
    <div className="estadisticas-bar">
      <div className="stat-item"><span className="stat-valor">{promedio}</span><span className="stat-etiqueta">Promedio ({etiquetaCustom})</span></div>
      <div className="stat-item"><span className="stat-valor">{mediana}</span><span className="stat-etiqueta">Mediana ({etiquetaCustom})</span></div>
      <div className="stat-item"><span className="stat-valor">{datos.length}</span><span className="stat-etiqueta">Categorías</span></div>
    </div>
  );
}

function GraficoBarras({ datos }) {
  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } = window.Recharts;
  const LIMA = "#C9E02A", NEGRO = "#0D0D0D";
  const datosGrafico = datos.slice(0, 15);
  const alturaContenedor = Math.max(350, datosGrafico.length * 50);
  const truncarTexto = (t) => (t.length > 22 ? t.substring(0, 20) + "..." : t);

  return (
    <div style={{ width: '100%', height: alturaContenedor, marginTop: '20px' }}>
      <ResponsiveContainer>
        <BarChart layout="vertical" data={datosGrafico} margin={{ left: 10, right: 60, top: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
          <XAxis type="number" hide domain={[0, 'dataMax + 10']} />
          <YAxis dataKey="categoria" type="category" width={150} tickFormatter={truncarTexto} tick={{ fontSize: 12, fill: NEGRO, fontWeight: 500 }} axisLine={false} />
          <Tooltip cursor={{ fill: 'rgba(201,224,42,0.1)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
          <Bar dataKey="porcentaje" fill={NEGRO} radius={[0, 6, 6, 0]} barSize={28}>
            {datosGrafico.map((_, i) => <Cell key={i} fill={i === 0 ? LIMA : NEGRO} />)}
            <LabelList dataKey="porcentaje" position="right" formatter={v => `${v}%`} style={{ fontSize: 12, fontWeight: '700', fill: NEGRO }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SeccionAnalisis({ titulo, datos, promedioCustom, medianaCustom, etiquetaCustom }) {
  const [vista, setVista] = useState("tabla");
  const chartRef = useRef(null);

  if (!datos || datos.length === 0) return null;

  const descargarExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datos.map(d => ({
      'Categoría': d.categoria,
      'N':         d.n,
      '%':         d.porcentaje
    })));
    XLSX.utils.book_append_sheet(wb, ws, titulo.substring(0, 31));
    XLSX.writeFile(wb, `${titulo}.xlsx`);
  };

  const descargarPNG = () => {
    if (!chartRef.current) return;
    const svg = chartRef.current.querySelector('svg');
    if (!svg) return;

    const { width, height } = svg.getBoundingClientRect();
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = width  || 800;
      canvas.height = height || 400;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const link = document.createElement('a');
      link.download = `${titulo}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="seccion-analisis">
      <div className="seccion-header">
        <h2>{titulo}</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="toggle-grupo">
            <button className={`toggle-btn ${vista === 'tabla'   ? 'activo' : ''}`} onClick={() => setVista("tabla")}>Tabla</button>
            <button className={`toggle-btn ${vista === 'grafico' ? 'activo' : ''}`} onClick={() => setVista("grafico")}>Gráfico</button>
          </div>
          {vista === 'tabla' && (
            <button className="btn-descargar" onClick={descargarExcel} title="Descargar como Excel">⬇ Excel</button>
          )}
          {vista === 'grafico' && (
            <button className="btn-descargar" onClick={descargarPNG} title="Descargar como imagen PNG">⬇ PNG</button>
          )}
        </div>
      </div>
      <EstadisticasBar datos={datos} promedioCustom={promedioCustom} medianaCustom={medianaCustom} etiquetaCustom={etiquetaCustom} />
      {vista === "tabla" ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="tabla-analisis">
            <thead><tr><th>Categoría</th><th>N</th><th>%</th></tr></thead>
            <tbody>
              {datos.map((d, i) => (
                <tr key={i}><td style={{ fontWeight: 600 }}>{d.categoria}</td><td>{d.n}</td><td style={{ fontWeight: 700 }}>{d.porcentaje}%</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={chartRef}>
          <GraficoBarras datos={datos} />
        </div>
      )}
    </div>
  );
}

// --- LÓGICA DE PROCESAMIENTO ---

const procesarFrecuencias = (data, palabrasClave, extractor = null) => {
  if (!data || !data.length) return [];
  const conteos = {};
  let total = 0;

  data.forEach(fila => {
    const claveCol = Object.keys(fila).find(k => palabrasClave.some(p => k.toLowerCase().includes(p.toLowerCase())));
    let valor = "Sin especificar";

    if (claveCol && (fila[claveCol] !== undefined && fila[claveCol] !== "")) {
      valor = extractor ? extractor(fila[claveCol]) : String(fila[claveCol]).trim();
    }

    if (valor) {
      conteos[valor] = (conteos[valor] || 0) + 1;
      total++;
    }
  });

  return Object.keys(conteos).map(cat => ({
    categoria: cat,
    n: conteos[cat],
    porcentaje: parseFloat(((conteos[cat] / total) * 100).toFixed(1))
  })).sort((a, b) => b.n - a.n);
};

function adaptar(resultado) {
  if (!resultado) return [];
  return resultado.map(function(item) {
    return {
      categoria:  item.nombre,
      n:          item.cantidad,
      porcentaje: parseFloat(item.porcentaje)
    };
  });
}

// --- PESTAÑA ORGANIZACIONES ---

function OrgTab({ filas, setFilas }) {
  const [cargando, setCargando] = useState(false);

  const handleCarga = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCargando(true);
    try {
      const data = await window.leerExcel(file);
      setFilas(data);
    } catch (err) {
      console.error(err);
    }
    setCargando(false);
  };

  // Calcula la distribución de edades (antigüedad) de las compañías
  const calcularDistribucionEdades = (filas) => {
    if (!filas || !filas.length) return [];
    const colFecha = Object.keys(filas[0]).find(k =>
      k.toLowerCase().includes('fecha') && k.toLowerCase().includes('registro')
    ) || Object.keys(filas[0]).find(k =>
      k.toLowerCase().includes('fecha') && k.toLowerCase().includes('juridic')
    );
    if (!colFecha) return [];

    const conteos = {};
    let total = 0;
    filas.forEach(fila => {
      const edad = window.calcularEdad(fila[colFecha]);
      if (edad === null) return;
      const rango = edad <= 5  ? '0-5 años'
                  : edad <= 10 ? '6-10 años'
                  : edad <= 20 ? '11-20 años'
                  : edad <= 30 ? '21-30 años'
                  : 'Más de 30 años';
      conteos[rango] = (conteos[rango] || 0) + 1;
      total++;
    });

    const orden = ['0-5 años', '6-10 años', '11-20 años', '21-30 años', 'Más de 30 años'];
    return orden
      .filter(r => conteos[r])
      .map(r => ({
        categoria:  r,
        n:          conteos[r],
        porcentaje: parseFloat(((conteos[r] / total) * 100).toFixed(1))
      }));
  };

  // Calcula la edad promedio y mediana de las compañías
  const calcularStatsEdad = (filas) => {
    if (!filas || !filas.length) return [undefined, undefined];
    const colFecha = Object.keys(filas[0]).find(k =>
      k.toLowerCase().includes('fecha') && k.toLowerCase().includes('registro')
    ) || Object.keys(filas[0]).find(k =>
      k.toLowerCase().includes('fecha') && k.toLowerCase().includes('juridic')
    );
    if (!colFecha) return [undefined, undefined];

    const edades = filas.map(f => window.calcularEdad(f[colFecha])).filter(e => e !== null);
    if (!edades.length) return [undefined, undefined];
    const promedio = (edades.reduce((a, b) => a + b, 0) / edades.length).toFixed(1);
    const mediana  = window.calcularMediana(edades).toFixed(1);
    return [promedio, mediana];
  };

  const [promedioEdad, medianaEdad] = filas ? calcularStatsEdad(filas) : [undefined, undefined];

  return (
    <div>
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <label className="label-archivo">
          {filas ? 'Cambiar' : 'Cargar'} Excel Organizaciones
          <input type="file" accept=".xlsx,.xls" onChange={handleCarga} style={{ display: 'none' }} />
        </label>
      </div>
      {cargando && <p className="estado">Cargando datos...</p>}
      {filas && (
        <div className="resultado">
          <SeccionAnalisis titulo="Asociaciones" datos={procesarFrecuencias(filas, ["asociacion", "asoc"])} />
          <SeccionAnalisis titulo="Formas Jurídicas" datos={procesarFrecuencias(filas, ["forma", "juridica"])} />
          <SeccionAnalisis titulo="Comunidades Autónomas" datos={procesarFrecuencias(filas, ["ccaa", "comunidad"])} />
          <SeccionAnalisis titulo="Provincias" datos={procesarFrecuencias(filas, ["provincia"])} />
          <SeccionAnalisis titulo="Género artístico" datos={procesarFrecuencias(filas, ["genero", "género"])} />
          <SeccionAnalisis titulo="Subgénero artístico" datos={procesarFrecuencias(filas, ["subgenero", "subgénero"])} />
          <SeccionAnalisis titulo="Compañías inclusivas" datos={procesarFrecuencias(filas, ["inclusiva", "inclusivo"])} />
          <SeccionAnalisis titulo="Antigüedad de las compañías"
            datos={calcularDistribucionEdades(filas)}
            promedioCustom={promedioEdad} medianaCustom={medianaEdad} etiquetaCustom="años" />
          <SeccionAnalisis titulo="Redes sociales — por plataforma" datos={adaptar(window.analizarRedes(filas).tablaPorRed)} />
          <SeccionAnalisis titulo="Redes sociales — nº de redes por compañía" datos={adaptar(window.analizarRedes(filas).tablaPorNumero)} />
          <SeccionAnalisis titulo="Espacios — tipo" datos={adaptar(window.analizarEspacios(filas).tablaTipo)} />
          <SeccionAnalisis titulo="Espacios — régimen de tenencia" datos={adaptar(window.analizarEspacios(filas).tablaRegimen)} />
        </div>
      )}
    </div>
  );
}

// --- PESTAÑA PRODUCCIONES ---

function ProdTab({ filas, setFilas }) {
  const [cargando, setCargando] = useState(false);

  const handleCarga = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCargando(true);
    try {
      const data = await window.leerExcel(file);
      setFilas(data);
    } catch (err) {
      console.error(err);
    }
    setCargando(false);
  };

  let promedioInterpretes = undefined, medianaInterpretes = undefined;
  let promedioCoste       = undefined, medianaCoste       = undefined;
  let promedioCache       = undefined, medianaCache       = undefined;
  let promedioDuracion    = undefined, medianaDuracion    = undefined;

  if (filas && filas.length > 0) {
    [promedioInterpretes, medianaInterpretes] = window.calcularStats(filas, 'Numero de interpretes');
    [promedioCoste,       medianaCoste]       = window.calcularStats(filas, 'Coste total');
    [promedioCache,       medianaCache]       = window.calcularStats(filas, 'Cache medio');
    [promedioDuracion,    medianaDuracion]    = window.calcularStats(filas, 'Duracion');
  }

  return (
    <div>
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <label className="label-archivo">
          {filas ? 'Cambiar' : 'Cargar'} Excel Producciones
          <input type="file" accept=".xlsx,.xls" onChange={handleCarga} style={{ display: 'none' }} />
        </label>
      </div>
      {cargando && <p className="estado">Cargando datos...</p>}
      {filas && (
        <div className="resultado">
          <SeccionAnalisis titulo="Producciones por año"
            datos={procesarFrecuencias(filas, ['fecha', 'estreno', 'anio', 'año'], typeof window.extraerAnio === 'function' ? window.extraerAnio : null)} />
          <SeccionAnalisis titulo="Por Comunidad Autónoma"
            datos={procesarFrecuencias(filas, ['comunidad', 'ccaa'])} />
          <SeccionAnalisis titulo="Por Provincia"
            datos={procesarFrecuencias(filas, ['provincia'])} />
          <SeccionAnalisis titulo="Por Género artístico"
            datos={procesarFrecuencias(filas, ['genero', 'género'])} />
          <SeccionAnalisis titulo="Por Subgénero artístico"
            datos={procesarFrecuencias(filas, ['subgenero', 'subgénero'])} />
          <SeccionAnalisis titulo="Número de intérpretes"
            datos={adaptar(window.contarPorRango(filas, 'Numero de interpretes', window.rangoInterpretes))}
            promedioCustom={promedioInterpretes} medianaCustom={medianaInterpretes} etiquetaCustom="intérp." />
          <SeccionAnalisis titulo="Duración del espectáculo"
            datos={adaptar(window.contarPorRango(filas, 'Duracion', window.rangoDuracion))}
            promedioCustom={promedioDuracion} medianaCustom={medianaDuracion} etiquetaCustom="min" />
          <SeccionAnalisis titulo="Coste de producción"
            datos={adaptar(window.contarPorRango(filas, 'Coste total', window.rangoCoste))}
            promedioCustom={promedioCoste} medianaCustom={medianaCoste} etiquetaCustom="€" />
          <SeccionAnalisis titulo="Caché por función"
            datos={adaptar(window.contarPorRango(filas, 'Cache medio', window.rangoCache))}
            promedioCustom={promedioCache} medianaCustom={medianaCache} etiquetaCustom="€" />
        </div>
      )}
    </div>
  );
}

// --- PESTAÑA FUNCIONES ---

function FuncionesTab({ filas, setFilas }) {
  const [cargando,  setCargando]  = useState(false);
  const [anioFiltro, setAnioFiltro] = useState("todos");

  const handleCarga = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCargando(true);
    try {
      const data = await window.leerExcel(file);
      setFilas(data);
      setAnioFiltro("todos");
    } catch (err) {
      console.error(err);
    }
    setCargando(false);
  };

  const obtenerNombreMes = (valor) => {
    if (!valor) return "Sin datos";
    const nombresMeses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    const numMes = typeof window.extraerMes === 'function' ? window.extraerMes(valor) : null;
    if (numMes && numMes >= 1 && numMes <= 12) return nombresMeses[numMes - 1];
    const fecha = new Date(valor);
    if (!isNaN(fecha)) return fecha.toLocaleString('es-ES', { month: 'long' }).toUpperCase();
    return "Sin datos";
  };

  // Detecta la columna con la fecha de la primera función. El orden de prioridad
  // evita confundirla con fechas administrativas (creación/actualización del registro):
  //   1) patrón "Fechas 1 fecha" (primera fecha de la gira en este fichero)
  //   2) columna que combine 'fecha' con 'primera' o 'funcion'
  //   3) cualquier 'fecha' que NO sea de creación/actualización
  //   4) como último recurso, la primera columna con 'fecha'
  const detectarColFecha = (filas) => {
    if (!filas || !filas.length) return null;
    const claves = Object.keys(filas[0] || {});
    const lower  = (k) => k.toLowerCase();

    return claves.find(k => lower(k).includes('fechas 1 fecha'))
        || claves.find(k => lower(k).includes('fecha') && (lower(k).includes('primera') || lower(k).includes('funcion')))
        || claves.find(k => lower(k).includes('fecha') && !lower(k).includes('creacion') && !lower(k).includes('actualizacion'))
        || claves.find(k => lower(k).includes('fecha'))
        || null;
  };

  // Obtiene todos los años presentes en el fichero para el selector de filtro
  const obtenerAnios = (filas) => {
    if (!filas) return [];
    const colFecha = detectarColFecha(filas);
    if (!colFecha) return [];

    const anios = new Set();
    filas.forEach(f => {
      const a = window.extraerAnio(f[colFecha]);
      if (a) anios.add(a);
    });
    return [...anios].sort((a, b) => a - b);
  };

  // Filtra las filas según el año seleccionado
  const obtenerFilasFiltradas = (filas, anio) => {
    if (!filas || anio === "todos") return filas;
    const colFecha = detectarColFecha(filas);
    if (!colFecha) return filas;
    return filas.filter(f => String(window.extraerAnio(f[colFecha])) === String(anio));
  };

  const aniosDisponibles = filas ? obtenerAnios(filas) : [];
  const filasFiltradas   = filas ? obtenerFilasFiltradas(filas, anioFiltro) : null;

  // Calcula promedio y mediana de caché y taquilla por separado
  const calcularStatsFunciones = (filas) => {
    if (!filas || !filas.length) return {};
    const colCache    = Object.keys(filas[0]).find(k => k.toLowerCase().includes('cache') || k.toLowerCase().includes('caché'));
    const colTaquilla = Object.keys(filas[0]).find(k => k.toLowerCase().includes('taquilla'));

    const stats = {};
    if (colCache) {
      const [prom, med] = window.calcularStats(filas, colCache);
      stats.promedioCache   = prom;
      stats.medianaCache    = med;
      stats.colCache        = colCache;
    }
    if (colTaquilla) {
      const [prom, med] = window.calcularStats(filas, colTaquilla);
      stats.promedioTaquilla = prom;
      stats.medianaTaquilla  = med;
      stats.colTaquilla      = colTaquilla;
    }
    return stats;
  };

  const statsFunc = filasFiltradas ? calcularStatsFunciones(filasFiltradas) : {};

  // Convierte un importe (caché o taquilla) en su rango. Los valores vacíos o
  // no numéricos se etiquetan como "Sin datos" para no inflar el rango más bajo.
  const rangoIngreso = (v) => {
    const n = parseFloat(v);
    if (isNaN(n) || n <= 0) return "Sin datos";
    return typeof window.rangoCache === 'function' ? window.rangoCache(n) : "Sin datos";
  };

  return (
    <div>
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <label className="label-archivo">
          {filas ? 'Cambiar' : 'Cargar'} Excel Funciones
          <input type="file" accept=".xlsx,.xls" onChange={handleCarga} style={{ display: 'none' }} />
        </label>
      </div>
      {cargando && <p className="estado">Cargando datos...</p>}

      {filas && aniosDisponibles.length > 1 && (
        <div style={{ textAlign: 'center', margin: '0 0 24px 0' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#fff', border: '1px solid #E9ECEF', borderRadius: '10px', padding: '10px 20px' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Filtrar por año:</span>
            <select
              value={anioFiltro}
              onChange={e => setAnioFiltro(e.target.value)}
              style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '5px 10px', fontFamily: 'inherit', fontSize: '0.9rem', cursor: 'pointer' }}
            >
              <option value="todos">Todos los años ({filas.length} funciones)</option>
              {aniosDisponibles.map(a => {
                const count = filas.filter(f => {
                  const colFecha = detectarColFecha(filas);
                  return colFecha && String(window.extraerAnio(f[colFecha])) === String(a);
                }).length;
                return <option key={a} value={a}>{a} ({count} funciones)</option>;
              })}
            </select>
          </div>
        </div>
      )}

      {filasFiltradas && (
        <div className="resultado">
          <SeccionAnalisis titulo="Funciones por Año"
            datos={procesarFrecuencias(filasFiltradas, [detectarColFecha(filasFiltradas) || "fecha"], typeof window.extraerAnio === 'function' ? window.extraerAnio : null)} />
          <SeccionAnalisis titulo="Distribución por Mes"
            datos={procesarFrecuencias(filasFiltradas, [detectarColFecha(filasFiltradas) || "fecha"], obtenerNombreMes)} />
          <SeccionAnalisis titulo="Funciones por CCAA donde tienen lugar"
            datos={procesarFrecuencias(filasFiltradas, ["ccaa", "comunidad"])} />
          <SeccionAnalisis titulo="Misma CCAA o distinta a la de la compañía"
            datos={procesarFrecuencias(filasFiltradas, ["distinta", "ccaa distinta", "comunidad distinta"], typeof window.calcularCcaaDistinta === 'function' ? window.calcularCcaaDistinta : null)} />
          <SeccionAnalisis titulo="Funciones por Género"
            datos={procesarFrecuencias(filasFiltradas, ["genero", "género"])} />
          <SeccionAnalisis titulo="Funciones por Subgénero"
            datos={procesarFrecuencias(filasFiltradas, ["subgenero", "subgénero"])} />
          <SeccionAnalisis titulo="Tipo de espacio donde se realizan"
            datos={adaptar(window.analizarEspaciosFunciones(filasFiltradas).tablaTipo)} />
          <SeccionAnalisis titulo="Funciones por Mercado (Interior / Exterior)"
            datos={procesarFrecuencias(filasFiltradas, ["pais", "país", "lugar"], typeof window.calcularMercado === 'function' ? window.calcularMercado : null)} />
          <SeccionAnalisis titulo="Funciones por Región del Mundo"
            datos={procesarFrecuencias(filasFiltradas, ["pais", "país", "region", "región"], typeof window.calcularRegion === 'function' ? window.calcularRegion : null)} />
          <SeccionAnalisis titulo="Funciones por País"
            datos={procesarFrecuencias(filasFiltradas, ["pais", "país", "nation"])} />
          <SeccionAnalisis titulo="Sistema de Contratación"
            datos={procesarFrecuencias(filasFiltradas, ["contratacion", "contratación", "sistema"])} />
          <SeccionAnalisis titulo="Forma de Retribución"
            datos={procesarFrecuencias(filasFiltradas, ["retribucion", "retribución", "forma de pago"])} />
          {statsFunc.colCache && (
            <SeccionAnalisis titulo="Rangos de ingresos por Caché"
              datos={procesarFrecuencias(filasFiltradas, [statsFunc.colCache], rangoIngreso)}
              promedioCustom={statsFunc.promedioCache} medianaCustom={statsFunc.medianaCache} etiquetaCustom="€" />
          )}
          {statsFunc.colTaquilla && (
            <SeccionAnalisis titulo="Rangos de ingresos por Taquilla"
              datos={procesarFrecuencias(filasFiltradas, [statsFunc.colTaquilla], rangoIngreso)}
              promedioCustom={statsFunc.promedioTaquilla} medianaCustom={statsFunc.medianaTaquilla} etiquetaCustom="€" />
          )}
        </div>
      )}
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---

function App() {
  const [tabActiva,  setTabActiva]  = useState("org");
  const [utilsListo, setUtilsListo] = useState(false);
  const [dataOrg,    setDataOrg]    = useState(null);
  const [dataProd,   setDataProd]   = useState(null);
  const [dataFunc,   setDataFunc]   = useState(null);

  useEffect(() => {
    fetch('utils.js')
      .then(response => response.text())
      .then(codigo => {
        const scriptGlobal = document.createElement('script');
        scriptGlobal.text  = codigo;
        document.head.appendChild(scriptGlobal);
        setUtilsListo(true);
      })
      .catch(err => {
        console.error("Error cargando utilidades:", err);
        setUtilsListo(true);
      });
  }, []);

  if (!window.Recharts || !utilsListo) return <div className="estado">Cargando librerías del sistema...</div>;

  return (
    <>
      <header className="header-fijo">
        <h1>Creación Independiente — Artes Escénicas</h1>
        <nav className="tabs-principales">
          <button className={`tab-main-btn ${tabActiva === 'org'  ? 'active' : ''}`} onClick={() => setTabActiva("org")}>Organizaciones</button>
          <button className={`tab-main-btn ${tabActiva === 'prod' ? 'active' : ''}`} onClick={() => setTabActiva("prod")}>Producciones</button>
          <button className={`tab-main-btn ${tabActiva === 'func' ? 'active' : ''}`} onClick={() => setTabActiva("func")}>Funciones</button>
        </nav>
      </header>
      <div className="contenedor">
        {tabActiva === "org"  && <OrgTab       filas={dataOrg}  setFilas={setDataOrg}  />}
        {tabActiva === "prod" && <ProdTab      filas={dataProd} setFilas={setDataProd} />}
        {tabActiva === "func" && <FuncionesTab filas={dataFunc} setFilas={setDataFunc} />}
      </div>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);