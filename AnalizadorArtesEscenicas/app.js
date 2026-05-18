const { useState, useEffect } = React;

// --- COMPONENTES BASE ---

function EstadisticasBar({ datos, promedioCustom, medianaCustom, etiquetaCustom = "N" }) {
  if (!datos || datos.length === 0) return null;
  
  const promedio = promedioCustom !== undefined ? promedioCustom : (datos.map(d => d.n).reduce((a, b) => a + b, 0) / datos.length).toFixed(1);
  // Buscamos calcularMediana de forma segura en el objeto global window
  const mediana = medianaCustom !== undefined ? medianaCustom : (typeof window.calcularMediana === 'function' ? window.calcularMediana(datos.map(d => d.n)) : 0);
  
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
  if (!datos || datos.length === 0) return null;
  return (
    <div className="seccion-analisis">
      <div className="seccion-header">
        <h2>{titulo}</h2>
        <div className="toggle-grupo">
          <button className={`toggle-btn ${vista === 'tabla' ? 'activo' : ''}`} onClick={() => setVista("tabla")}>Tabla</button>
          <button className={`toggle-btn ${vista === 'grafico' ? 'activo' : ''}`} onClick={() => setVista("grafico")}>Gráfico</button>
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
      ) : <GraficoBarras datos={datos} />}
    </div>
  );
}

// --- LOGICA DE PROCESAMIENTO ---

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

// NUEVO: convierte el formato de utils.js {nombre, cantidad, porcentaje}
// al formato que esperan los componentes   {categoria, n, porcentaje}
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

// --- PESTAÑAS (TABS) ---

function OrgTab({ filas, setFilas }) {
  const [cargando, setCargando] = useState(false);

  const handleCarga = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCargando(true);
    try {
      // Llamada segura a window.leerExcel
      const data = await window.leerExcel(file);
      setFilas(data);
    } catch (err) {
      console.error(err);
    }
    setCargando(false);
  };

  return (
    <div>
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <label className="label-archivo"> {filas ? 'Cambiar' : 'Cargar'} Excel Organizaciones
          <input type="file" accept=".xlsx,.xls" onChange={handleCarga} style={{ display: 'none' }} />
        </label>
      </div>
      {cargando && <p className="estado">Cargando datos...</p>}
      {filas && (
        <div className="resultado">
          <SeccionAnalisis titulo="Asociaciones" datos={procesarFrecuencias(filas, ["asociacion", "asoc"])} />
          <SeccionAnalisis titulo="Formas Jurídicas" datos={procesarFrecuencias(filas, ["forma", "juridica"])} />
          <SeccionAnalisis titulo="Comunidades Autónomas" datos={procesarFrecuencias(filas, ["ccaa", "comunidad"])} />
          {/* NUEVO: secciones añadidas */}
          <SeccionAnalisis titulo="Provincias"
            datos={procesarFrecuencias(filas, ["provincia"])} />
          <SeccionAnalisis titulo="Género artístico"
            datos={procesarFrecuencias(filas, ["genero", "género"])} />
          <SeccionAnalisis titulo="Subgénero artístico"
            datos={procesarFrecuencias(filas, ["subgenero", "subgénero"])} />
          <SeccionAnalisis titulo="Compañías inclusivas"
            datos={procesarFrecuencias(filas, ["inclusiva", "inclusivo"])} />
          <SeccionAnalisis titulo="Redes sociales — por plataforma"
            datos={adaptar(window.analizarRedes(filas).tablaPorRed)} />
          <SeccionAnalisis titulo="Redes sociales — nº de redes por compañía"
            datos={adaptar(window.analizarRedes(filas).tablaPorNumero)} />
          <SeccionAnalisis titulo="Espacios — tipo"
            datos={adaptar(window.analizarEspacios(filas).tablaTipo)} />
          <SeccionAnalisis titulo="Espacios — régimen de tenencia"
            datos={adaptar(window.analizarEspacios(filas).tablaRegimen)} />
        </div>
      )}
    </div>
  );
}

// NUEVO: ProdTab completa (antes era un placeholder)
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

  let promedioInterpretes = undefined;
  let medianaInterpretes  = undefined;
  let promedioCoste       = undefined;
  let medianaCoste        = undefined;
  let promedioCache       = undefined;
  let medianaCache        = undefined;
  let promedioDuracion    = undefined;
  let medianaDuracion     = undefined;

  if (filas && filas.length > 0) {
    const calcStats = (col) => {
      const vals = filas.map(f => parseFloat(f[col])).filter(v => !isNaN(v));
      if (!vals.length) return [undefined, undefined];
      const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
      const sorted = [...vals].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const med = sorted.length % 2 === 0
        ? ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1)
        : sorted[mid].toFixed(1);
      return [avg, med];
    };
    [promedioInterpretes, medianaInterpretes] = calcStats('Numero de interpretes');
    [promedioCoste,       medianaCoste]       = calcStats('Coste total');
    [promedioCache,       medianaCache]       = calcStats('Cache medio');
    [promedioDuracion,    medianaDuracion]    = calcStats('Duracion');
  }

  return (
    <div>
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <label className="label-archivo">
          {filas ? 'Cambiar' : 'Cargar'} Excel Producciones
          <input type="file" accept=".xlsx,.xls"
                 onChange={handleCarga} style={{ display: 'none' }} />
        </label>
      </div>
      {cargando && <p className="estado">Cargando datos...</p>}
      {filas && (
        <div className="resultado">
          <SeccionAnalisis titulo="Producciones por año"
            datos={procesarFrecuencias(filas,
              ['fecha', 'estreno', 'anio', 'año'],
              typeof window.extraerAnio === 'function' ? window.extraerAnio : null)} />
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
            promedioCustom={promedioInterpretes}
            medianaCustom={medianaInterpretes}
            etiquetaCustom="intérp." />
          <SeccionAnalisis titulo="Duración del espectáculo"
            datos={adaptar(window.contarPorRango(filas, 'Duracion', window.rangoDuracion))}
            promedioCustom={promedioDuracion}
            medianaCustom={medianaDuracion}
            etiquetaCustom="min" />
          <SeccionAnalisis titulo="Coste de producción"
            datos={adaptar(window.contarPorRango(filas, 'Coste total', window.rangoCoste))}
            promedioCustom={promedioCoste}
            medianaCustom={medianaCoste}
            etiquetaCustom="€" />
          <SeccionAnalisis titulo="Caché por función"
            datos={adaptar(window.contarPorRango(filas, 'Cache medio', window.rangoCache))}
            promedioCustom={promedioCache}
            medianaCustom={medianaCache}
            etiquetaCustom="€" />
        </div>
      )}
    </div>
  );
}

function FuncionesTab({ filas, setFilas }) {
  const [cargando, setCargando] = useState(false);

  const handleCarga = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCargando(true);
    try {
      // Llamada segura a window.leerExcel
      const data = await window.leerExcel(file);
      setFilas(data);
    } catch (err) {
      console.error(err);
    }
    setCargando(false);
  };

  const obtenerNombreMes = (valor) => {
    if (!valor) return "Sin datos";
    const nombresMeses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    const numMes = typeof window.extraerMes === 'function' ? window.extraerMes(valor) : null;
    if (numMes && numMes >= 1 && numMes <= 12) {
      return nombresMeses[numMes - 1];
    }
    const fecha = new Date(valor);
    if (!isNaN(fecha)) {
      return fecha.toLocaleString('es-ES', { month: 'long' }).toUpperCase();
    }
    return "Sin datos";
  };

  let promedioIngresos = undefined;
  let medianaIngresos = undefined;

  if (filas && filas.length > 0) {
    const colIngresos = Object.keys(filas[0]).find(k => ["ingreso", "cache", "caché", "precio", "recaudacion", "importe"].some(p => k.toLowerCase().includes(p)));
    if (colIngresos) {
      const valores = filas.map(f => parseFloat(f[colIngresos])).filter(v => !isNaN(v));
      if (valores.length > 0) {
        promedioIngresos = (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2);
        valores.sort((a, b) => a - b);
        const mitad = Math.floor(valores.length / 2);
        medianaIngresos = valores.length % 2 === 0 ? ((valores[mitad - 1] + valores[mitad]) / 2).toFixed(2) : valores[mitad].toFixed(2);
      }
    }
  }

  return (
    <div>
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <label className="label-archivo"> {filas ? 'Cambiar' : 'Cargar'} Excel Funciones
          <input type="file" accept=".xlsx,.xls" onChange={handleCarga} style={{ display: 'none' }} />
        </label>
      </div>
      {cargando && <p className="estado">Cargando datos...</p>}
      {filas && (
        <div className="resultado">
          {/* Todas las funciones de extracción mapeadas de manera segura a través de window */}
          <SeccionAnalisis titulo="Funciones por Año" datos={procesarFrecuencias(filas, ["fecha", "año", "anio"], typeof window.extraerAnio === 'function' ? window.extraerAnio : null)} />
          <SeccionAnalisis titulo="Distribución por Mes" datos={procesarFrecuencias(filas, ["fecha", "mes"], obtenerNombreMes)} />
          <SeccionAnalisis titulo="Funciones por CCAA donde tienen lugar" datos={procesarFrecuencias(filas, ["ccaa", "comunidad"])} />
          <SeccionAnalisis titulo="Funciones por Género" datos={procesarFrecuencias(filas, ["genero", "género"])} />
          <SeccionAnalisis titulo="Funciones por Subgénero" datos={procesarFrecuencias(filas, ["subgenero", "subgénero"])} />
          <SeccionAnalisis titulo="Funciones por Mercado (Interior / Exterior)" datos={procesarFrecuencias(filas, ["mercado", "pais", "país", "lugar"], typeof window.calcularMercado === 'function' ? window.calcularMercado : null)} />
          <SeccionAnalisis titulo="Funciones por Región del Mundo" datos={procesarFrecuencias(filas, ["pais", "país", "region", "región"], typeof window.calcularRegion === 'function' ? window.calcularRegion : null)} />
          <SeccionAnalisis titulo="Funciones por País" datos={procesarFrecuencias(filas, ["pais", "país", "nation"])} />
          <SeccionAnalisis titulo="Sistema de Contratación" datos={procesarFrecuencias(filas, ["contratacion", "contratación", "sistema"])} />
          <SeccionAnalisis titulo="Forma de Retribución" datos={procesarFrecuencias(filas, ["retribucion", "retribución", "pago", "forma de pago"])} />
          <SeccionAnalisis 
            titulo="Rangos de Ingresos / Caché" 
            datos={procesarFrecuencias(filas, ["ingreso", "cache", "caché", "precio", "recaudacion", "importe"], (v) => typeof window.rangoCache === 'function' ? window.rangoCache(parseFloat(v) || 0) : null)} 
            promedioCustom={promedioIngresos}
            medianaCustom={medianaIngresos}
            etiquetaCustom="€"
          />
        </div>
      )}
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---

function App() {
  const [tabActiva, setTabActiva] = useState("org");
  const [utilsListo, setUtilsListo] = useState(false);
  
  const [dataOrg, setDataOrg] = useState(null);
  const [dataProd, setDataProd] = useState(null);
  const [dataFunc, setDataFunc] = useState(null);

  //Lee utils.js y lo fuerza a inyectarse globalmente en window
  useEffect(() => {
    fetch('utils.js')
      .then(response => response.text())
      .then(codigo => {
        const scriptGlobal = document.createElement('script');
        scriptGlobal.text = codigo; // Al ejecutarse en un tag estándar, expone funciones en window
        document.head.appendChild(scriptGlobal);
        setUtilsListo(true);
      })
      .catch(err => {
        console.error("Error cargando el puente de utilidades:", err);
        setUtilsListo(true); // Continuar de todos modos para evitar bloqueo total
      });
  }, []);

  if (!window.Recharts || !utilsListo) return <div className="estado">Cargando librerías del sistema...</div>;

  return (
    <>
      <header className="header-fijo">
        <h1>Creación Independiente — Artes Escénicas</h1>
        <nav className="tabs-principales">
          <button className={`tab-main-btn ${tabActiva === 'org' ? 'active' : ''}`} onClick={() => setTabActiva("org")}>Organizaciones</button>
          <button className={`tab-main-btn ${tabActiva === 'prod' ? 'active' : ''}`} onClick={() => setTabActiva("prod")}>Producciones</button>
          <button className={`tab-main-btn ${tabActiva === 'func' ? 'active' : ''}`} onClick={() => setTabActiva("func")}>Funciones</button>
        </nav>
      </header>

      <div className="contenedor">
        {tabActiva === "org" && <OrgTab filas={dataOrg} setFilas={setDataOrg} />}
        {tabActiva === "prod" && <ProdTab filas={dataProd} setFilas={setDataProd} />}
        {tabActiva === "func" && <FuncionesTab filas={dataFunc} setFilas={setDataFunc} />}
      </div>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);