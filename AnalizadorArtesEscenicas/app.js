const { useState } = React;

/**
 * Función auxiliar para calcular N y % de una columna específica.
 * Busca de forma flexible el nombre de la cabecera en el JSON del Excel.
 */
function calcularFrecuencias(filas, palabrasClave) {
  if (!filas || !filas.length) return [];

  const conteos = {};
  let total = 0;

  filas.forEach((fila) => {
    // Encuentra la clave real en el objeto que coincida con las palabras buscadas
    const claveEncontrada = Object.keys(fila).find((key) =>
      palabrasClave.some((palabra) => key.toLowerCase().includes(palabra.toLowerCase()))
    );

    let valor = claveEncontrada && fila[claveEncontrada] !== undefined 
      ? String(fila[claveEncontrada]).trim() 
      : "Sin especificar";

    if (valor === "") valor = "Sin especificar";

    conteos[valor] = (conteos[valor] || 0) + 1;
    total++;
  });

  // Mapeamos el resultado al formato esperado por la tabla y ordenamos de mayor a menor
  return Object.keys(conteos)
    .map((categoria) => ({
      categoria,
      n: conteos[categoria],
      porcentaje: total > 0 ? ((conteos[categoria] / total) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.n - a.n);
}

// 1. Componente TablaAnalisis
function TablaAnalisis({ datos }) {
  if (!datos || datos.length === 0) {
    return <p className="sin-datos">No se encontraron datos para esta columna.</p>;
  }

  return (
    <table className="tabla-analisis" border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%", marginTop: "10px" }}>
      <thead>
        <tr style={{ backgroundColor: "#f2f2f2", textAlign: "left" }}>
          <th>Categoría</th>
          <th>N</th>
          <th>%</th>
        </tr>
      </thead>
      <tbody>
        {datos.map((fila, index) => (
          <tr key={index}>
            <td>{fila.categoria}</td>
            <td>{fila.n}</td>
            <td>{fila.porcentaje}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// 2. Componente SeccionAnalisis
function SeccionAnalisis({ titulo, datos }) {
  return (
    <div className="seccion-analisis" style={{ marginBottom: "30px" }}>
      <h2 style={{ borderBottom: "2px solid #ccc", paddingBottom: "5px" }}>{titulo}</h2>
      <TablaAnalisis datos={datos} />
    </div>
  );
}

// 3. Componente Principal App
function App() {
  const [filas, setFilas] = useState(null);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleArchivo(e) {
    const file = e.target.files[0];
    if (!file) return;

    setNombreArchivo(file.name);
    setError("");
    setFilas(null);
    setCargando(true);

    try {
      // Se asume que leerExcel(file) está definido globalmente en otro script
      const datos = await leerExcel(file);
      setFilas(datos);
    } catch (err) {
      setError("No se pudo leer el archivo: " + err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="contenedor" style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1>Creación Independiente — Artes Escénicas</h1>

      <label className="label-archivo" style={{ display: "block", marginBottom: "20px" }}>
        Selecciona un Excel (.xlsx / .xls)
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleArchivo}
          style={{ marginLeft: "10px" }}
        />
      </label>

      {cargando && <p className="estado">Leyendo archivo…</p>}

      {error && <p className="error" style={{ color: "red" }}>{error}</p>}

      {filas !== null && !cargando && (
        <div className="resultado">
          <div style={{ backgroundColor: "#eef", padding: "10px", borderRadius: "5px", marginBottom: "30px" }}>
            <p className="nombre-archivo" style={{ margin: 0, fontWeight: "bold" }}>{nombreArchivo}</p>
            <p className="contador-filas" style={{ margin: 0 }}>
              <span className="num-filas">{filas.length}</span>{" "}
              <span className="etiqueta-filas">
                {filas.length === 1 ? "fila leída" : "filas leídas"}
              </span>
            </p>
          </div>

          {/* 4. Renderizado de las 4 secciones solicitadas */}
          <div className="analisis-secciones">
            <SeccionAnalisis
              titulo="Asociaciones"
              datos={calcularFrecuencias(filas, ["asociacion", "asociación", "asoc"])}
            />
            <SeccionAnalisis
              titulo="Formas Jurídicas"
              datos={calcularFrecuencias(filas, ["forma juridica", "forma jurídica", "juridica", "jurídica"])}
            />
            <SeccionAnalisis
              titulo="Comunidades Autónomas (CCAA)"
              datos={calcularFrecuencias(filas, ["ccaa", "comunidad", "autonoma", "autónoma"])}
            />
            <SeccionAnalisis
              titulo="Género"
              datos={calcularFrecuencias(filas, ["genero", "género", "sexo"])}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);