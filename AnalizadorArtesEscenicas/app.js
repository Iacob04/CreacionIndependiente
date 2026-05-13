const { useState } = React;

// --- 1. COMPONENTE: EstadisticasBar ---
// Muestra el promedio y la mediana de los datos de la sección
function EstadisticasBar({ datos }) {
  if (!datos || datos.length === 0) return null;

  const valoresN = datos.map(d => d.n);
  
  // Cálculo de promedio
  const promedio = (valoresN.reduce((a, b) => a + b, 0) / valoresN.length).toFixed(1);
  
  // Cálculo de mediana (usando la función de utils.js)
  const mediana = typeof calcularMediana === 'function' ? calcularMediana(valoresN) : 0;

  return (
    <div className="estadisticas-bar">
      <div className="stat-item">
        <span className="stat-valor">{promedio}</span>
        <span className="stat-etiqueta">Promedio (N)</span>
      </div>
      <div className="stat-item">
        <span className="stat-valor">{mediana}</span>
        <span className="stat-etiqueta">Mediana (N)</span>
      </div>
      <div className="stat-item">
        <span className="stat-valor">{datos.length}</span>
        <span className="stat-etiqueta">Categorías</span>
      </div>
    </div>
  );
}

// --- 2. COMPONENTE: GraficoBarras ---
// Implementación de Recharts con scroll dinámico y truncado de etiquetas
function GraficoBarras({ datos }) {
  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } = window.Recharts;
  
  const LIMA = "#C9E02A";
  const NEGRO = "#0D0D0D";

  // Tomamos los 15 más frecuentes para que el gráfico no sea infinito
  const datosGrafico = datos.slice(0, 15);
  
  // Altura dinámica: 50px por cada barra para evitar solapamientos
  const alturaContenedor = Math.max(350, datosGrafico.length * 50);

  // Función para recortar nombres muy largos en el eje Y
  const truncarTexto = (texto) => (texto.length > 22 ? texto.substring(0, 20) + "..." : texto);

  return (
    <div style={{ width: '100%', height: alturaContenedor, marginTop: '20px' }}>
      <ResponsiveContainer>
        <BarChart 
          layout="vertical" 
          data={datosGrafico} 
          margin={{ left: 10, right: 60, top: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
          <XAxis type="number" hide domain={[0, 100]} />
          <YAxis 
            dataKey="categoria" 
            type="category" 
            width={150} 
            tickFormatter={truncarTexto}
            tick={{ fontSize: 12, fill: NEGRO, fontWeight: 500 }} 
            axisLine={false} 
          />
          <Tooltip 
            cursor={{ fill: 'rgba(201,224,42,0.1)' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Bar dataKey="porcentaje" fill={NEGRO} radius={[0, 6, 6, 0]} barSize={28}>
            {datosGrafico.map((_, i) => (
              <Cell key={i} fill={i === 0 ? LIMA : NEGRO} />
            ))}
            <LabelList 
              dataKey="porcentaje" 
              position="right" 
              formatter={v => `${v}%`} 
              style={{ fontSize: 12, fontWeight: '700', fill: NEGRO }} 
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- 3. COMPONENTE: SeccionAnalisis ---
// Controla el toggle entre Tabla y Gráfico y envuelve el contenido en una "Card"
function SeccionAnalisis({ titulo, datos }) {
  const [vista, setVista] = useState("tabla");

  if (!datos || datos.length === 0) return null;

  return (
    <div className="seccion-analisis">
      <div className="seccion-header">
        <h2>{titulo}</h2>
        <div className="toggle-grupo">
          <button 
            className={`toggle-btn ${vista === 'tabla' ? 'activo' : ''}`} 
            onClick={() => setVista("tabla")}
          >
            Tabla
          </button>
          <button 
            className={`toggle-btn ${vista === 'grafico' ? 'activo' : ''}`} 
            onClick={() => setVista("grafico")}
          >
            Gráfico
          </button>
        </div>
      </div>

      <EstadisticasBar datos={datos} />

      {vista === "tabla" ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="tabla-analisis">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Frecuencia (N)</th>
                <th>Porcentaje (%)</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((d, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{d.categoria}</td>
                  <td>{d.n}</td>
                  <td style={{ fontWeight: 700 }}>{d.porcentaje}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <GraficoBarras datos={datos} />
      )}
    </div>
  );
}

// --- 4. COMPONENTE PRINCIPAL: App ---
function App() {
  const [filas, setFilas] = useState(null);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [cargando, setCargando] = useState(false);

  // Verificación de librería
  if (!window.Recharts) return <div className="estado">Cargando Recharts...</div>;

  const calcularFrecuencias = (data, palabrasClave) => {
    if (!data || !data.length) return [];
    const conteos = {};
    let total = 0;
    
    data.forEach(fila => {
      const clave = Object.keys(fila).find(k => 
        palabrasClave.some(p => k.toLowerCase().includes(p.toLowerCase()))
      );
      let valor = clave && fila[clave] ? String(fila[clave]).trim() : "Sin especificar";
      conteos[valor] = (conteos[valor] || 0) + 1;
      total++;
    });

    return Object.keys(conteos).map(cat => ({
      categoria: cat,
      n: conteos[cat],
      porcentaje: parseFloat(((conteos[cat] / total) * 100).toFixed(1))
    })).sort((a, b) => b.n - a.n);
  };

  async function handleArchivo(e) {
    const file = e.target.files[0];
    if (!file) return;
    setNombreArchivo(file.name);
    setCargando(true);
    try {
      const data = await leerExcel(file); // Función de utils.js
      setFilas(data);
    } catch (err) { 
      alert("Error al procesar el Excel"); 
    } finally { 
      setCargando(false); 
    }
  }

  return (
    <>
      <header className="header-fijo">
        <h1>Creación Independiente — Artes Escénicas</h1>
      </header>

      <div className="contenedor">
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <label className="label-archivo">
            📁 Cargar Base de Datos (Excel)
            <input type="file" accept=".xlsx,.xls" onChange={handleArchivo} style={{ display: 'none' }} />
          </label>
        </div>

        {cargando && (
          <div className="seccion-analisis" style={{ textAlign: 'center' }}>
            <p className="estado">Procesando datos del archivo...</p>
          </div>
        )}

        {filas && (
          <div className="resultado">
            <div className="banner-archivo-nuevo" style={{ marginBottom: '30px' }}>
              <span>Archivo: <strong>{nombreArchivo}</strong></span>
              <span style={{ float: 'right' }}><strong>{filas.length}</strong> registros</span>
            </div>
            
            <SeccionAnalisis titulo="Asociaciones" datos={calcularFrecuencias(filas, ["asociacion", "asoc"])} />
            <SeccionAnalisis titulo="Formas Jurídicas" datos={calcularFrecuencias(filas, ["forma", "juridica"])} />
            <SeccionAnalisis titulo="Comunidades Autónomas" datos={calcularFrecuencias(filas, ["ccaa", "comunidad"])} />
            <SeccionAnalisis titulo="Género" datos={calcularFrecuencias(filas, ["genero", "sexo"])} />
          </div>
        )}
      </div>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
