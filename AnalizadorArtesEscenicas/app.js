const { useState } = React;

// --- COMPONENTES BASE ---

function EstadisticasBar({ datos }) {
  if (!datos || datos.length === 0) return null;
  const valoresN = datos.map(d => d.n);
  const promedio = (valoresN.reduce((a, b) => a + b, 0) / valoresN.length).toFixed(1);
  const mediana = typeof calcularMediana === 'function' ? calcularMediana(valoresN) : 0;
  return (
    <div className="estadisticas-bar">
      <div className="stat-item"><span className="stat-valor">{promedio}</span><span className="stat-etiqueta">Promedio (N)</span></div>
      <div className="stat-item"><span className="stat-valor">{mediana}</span><span className="stat-etiqueta">Mediana (N)</span></div>
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
          <XAxis type="number" hide domain={[0, 100]} />
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

function SeccionAnalisis({ titulo, datos }) {
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
      <EstadisticasBar datos={datos} />
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
    
    if (claveCol && fila[claveCol]) {
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

// --- PESTAÑAS (TABS) ---
// Ahora reciben 'filas' y 'setFilas' como props 

function OrgTab({ filas, setFilas }) {
  const [cargando, setCargando] = useState(false);

  const handleCarga = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCargando(true);
    const data = await leerExcel(file);
    setFilas(data);
    setCargando(false);
  };

  return (
    <div>
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <label className="label-archivo">📁 {filas ? 'Cambiar' : 'Cargar'} Excel Organizaciones
          <input type="file" accept=".xlsx,.xls" onChange={handleCarga} style={{ display: 'none' }} />
        </label>
      </div>
      {cargando && <p className="estado">Cargando datos...</p>}
      {filas && (
        <div className="resultado">
          <SeccionAnalisis titulo="Asociaciones" datos={procesarFrecuencias(filas, ["asociacion", "asoc"])} />
          <SeccionAnalisis titulo="Formas Jurídicas" datos={procesarFrecuencias(filas, ["forma", "juridica"])} />
          <SeccionAnalisis titulo="Comunidades Autónomas" datos={procesarFrecuencias(filas, ["ccaa", "comunidad"])} />
        </div>
      )}
    </div>
  );
}

function ProdTab({ filas, setFilas }) {
    // Implementación similar se puede añadir aquí
    return <div className="seccion-analisis" style={{ textAlign: 'center' }}><h3>Próximamente: Análisis de Producciones</h3></div>;
}

function FuncionesTab({ filas, setFilas }) {
  const [cargando, setCargando] = useState(false);

  const handleCarga = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCargando(true);
    const data = await leerExcel(file);
    setFilas(data);
    setCargando(false);
  };

  const extraerMes = (valor) => {
    if (!valor) return "Sin datos";
    const fecha = new Date(valor);
    if (isNaN(fecha)) return "Sin datos";
    return fecha.toLocaleString('es-ES', { month: 'long' }).toUpperCase();
  };

  const extraerMercado = (valor) => {
    const t = String(valor).toLowerCase();
    if (t.includes("exterior") || t.includes("internacional") || t.includes("fuera")) return "EXTERIOR";
    return "INTERIOR (España)";
  };

  return (
    <div>
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <label className="label-archivo">📁 {filas ? 'Cambiar' : 'Cargar'} Excel Funciones
          <input type="file" accept=".xlsx,.xls" onChange={handleCarga} style={{ display: 'none' }} />
        </label>
      </div>
      {cargando && <p className="estado">Cargando datos...</p>}
      {filas && (
        <div className="resultado">
          <SeccionAnalisis titulo="Funciones por Año" datos={procesarFrecuencias(filas, ["fecha", "año", "anio"], extraerAnio)} />
          <SeccionAnalisis titulo="Distribución por Mes" datos={procesarFrecuencias(filas, ["fecha", "mes"], extraerMes)} />
          <SeccionAnalisis titulo="Mercado (Interior vs Exterior)" datos={procesarFrecuencias(filas, ["lugar", "mercado", "pais"], extraerMercado)} />
        </div>
      )}
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---

function App() {
  const [tabActiva, setTabActiva] = useState("org");
  
  // ESTADO GLOBAL: Guardamos los datos aquí para que no se pierdan al cambiar de pestaña (preservación de los datos Jueves 14)
  const [dataOrg, setDataOrg] = useState(null);
  const [dataProd, setDataProd] = useState(null);
  const [dataFunc, setDataFunc] = useState(null);

  if (!window.Recharts) return <div className="estado">Cargando librerías...</div>;

  return (
    <>
      <header className="header-fijo">
        <h1>Creación Independiente — Artes Escénicas</h1>
      </header>

      <div className="contenedor">
        <nav className="tabs-principales">
          <button className={`tab-main-btn ${tabActiva === 'org' ? 'active' : ''}`} onClick={() => setTabActiva("org")}>Organizaciones</button>
          <button className={`tab-main-btn ${tabActiva === 'prod' ? 'active' : ''}`} onClick={() => setTabActiva("prod")}>Producciones</button>
          <button className={`tab-main-btn ${tabActiva === 'func' ? 'active' : ''}`} onClick={() => setTabActiva("func")}>Funciones</button>
        </nav>

        {/* Llamamos a los datos y la función para actualizarlos como props */}
        {tabActiva === "org" && <OrgTab filas={dataOrg} setFilas={setDataOrg} />}
        {tabActiva === "prod" && <ProdTab filas={dataProd} setFilas={setDataProd} />}
        {tabActiva === "func" && <FuncionesTab filas={dataFunc} setFilas={setDataFunc} />}
      </div>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

