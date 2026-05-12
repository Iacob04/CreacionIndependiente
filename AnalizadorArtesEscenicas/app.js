const { useState } = React;

function App() {
  const [filas, setFilas] = useState(null);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [cargando, setCargando] = useState(false);

  if (!window.Recharts) return <div className="estado">Cargando librerías...</div>;

  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } = window.Recharts;

  const LIMA = "#C9E02A";
  const NEGRO = "#0D0D0D";

  const calcularFrecuencias = (data, palabrasClave) => {
    if (!data || !data.length) return [];
    const conteos = {};
    let total = 0;
    data.forEach(fila => {
      const clave = Object.keys(fila).find(k => palabrasClave.some(p => k.toLowerCase().includes(p.toLowerCase())));
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

  const SeccionAnalisis = ({ titulo, datos }) => {
    const [vista, setVista] = useState("tabla");
    const valoresN = datos.map(d => d.n);
    const promedio = (valoresN.reduce((a, b) => a + b, 0) / datos.length || 0).toFixed(1);

    return (
      <div className="seccion-analisis">
        <div className="seccion-header">
          <h2>{titulo}</h2>
          <div className="toggle-grupo">
            <button className={`toggle-btn ${vista === 'tabla' ? 'activo' : ''}`} onClick={() => setVista("tabla")}>Tabla</button>
            <button className={`toggle-btn ${vista === 'grafico' ? 'activo' : ''}`} onClick={() => setVista("grafico")}>Gráfico</button>
          </div>
        </div>

        <div className="estadisticas-bar">
          <div className="stat-item">
            <span className="stat-valor">{datos.length}</span>
            <span className="stat-etiqueta">Categorías</span>
          </div>
          <div className="stat-item">
            <span className="stat-valor">{promedio}</span>
            <span className="stat-etiqueta">Promedio N</span>
          </div>
        </div>

        {vista === "tabla" ? (
          <table className="tabla-analisis">
            <thead><tr><th>Categoría</th><th>N</th><th>%</th></tr></thead>
            <tbody>
              {datos.map((d, i) => (
                <tr key={i}><td>{d.categoria}</td><td>{d.n}</td><td>{d.porcentaje}%</td></tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ width: '100%', height: Math.max(300, datos.length * 35), marginTop: '20px' }}>
            <ResponsiveContainer>
              <BarChart layout="vertical" data={datos.slice(0, 15)} margin={{ left: 20, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0e0e0" />
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis dataKey="categoria" type="category" width={140} tick={{ fontSize: 11, fill: NEGRO }} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(201,224,42,0.1)' }} />
                <Bar dataKey="porcentaje" fill={NEGRO} radius={[0, 4, 4, 0]} barSize={20}>
                  {datos.map((_, i) => <Cell key={i} fill={i === 0 ? LIMA : NEGRO} />)}
                  <LabelList dataKey="porcentaje" position="right" formatter={v => `${v}%`} style={{ fontSize: 11, fontWeight: 'bold', fill: NEGRO }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  async function handleArchivo(e) {
    const file = e.target.files[0];
    if (!file) return;
    setNombreArchivo(file.name);
    setCargando(true);
    try {
      const data = await leerExcel(file);
      setFilas(data);
    } catch (err) { alert("Error al leer el archivo"); }
    finally { setCargando(false); }
  }

  return (
    <div className="contenedor">
      <h1>Creación Independiente — Artes Escénicas</h1>
      <label className="label-archivo"> Seleccionar Excel <input type="file" accept=".xlsx,.xls" onChange={handleArchivo} style={{ display: 'none' }} /></label>
      {cargando && <p className="estado">Analizando...</p>}
      {filas && (
        <div className="resultado">
          <div className="banner-archivo-nuevo">
            <span className="nombre-archivo">{nombreArchivo}</span>
            <span className="contador-filas"><strong>{filas.length}</strong> registros leídos</span>
          </div>
          <SeccionAnalisis titulo="Asociaciones" datos={calcularFrecuencias(filas, ["asociacion", "asoc"])} />
          <SeccionAnalisis titulo="Formas Jurídicas" datos={calcularFrecuencias(filas, ["forma", "juridica"])} />
          <SeccionAnalisis titulo="CCAA" datos={calcularFrecuencias(filas, ["ccaa", "comunidad"])} />
          <SeccionAnalisis titulo="Género" datos={calcularFrecuencias(filas, ["genero", "sexo"])} />
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

