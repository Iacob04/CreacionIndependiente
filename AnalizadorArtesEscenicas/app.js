const { useState } = React;

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
      const datos = await leerExcel(file);
      setFilas(datos);
    } catch (err) {
      setError("No se pudo leer el archivo: " + err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="contenedor">
      <h1>Creación Independiente — Artes Escénicas</h1>

      <label className="label-archivo">
        Selecciona un Excel (.xlsx / .xls)
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleArchivo}
        />
      </label>

      {cargando && <p className="estado">Leyendo archivo…</p>}

      {error && <p className="error">{error}</p>}

      {filas !== null && !cargando && (
        <div className="resultado">
          <p className="nombre-archivo">{nombreArchivo}</p>
          <p className="contador-filas">
            <span className="num-filas">{filas.length}</span>
            <span className="etiqueta-filas">
              {filas.length === 1 ? "fila leída" : "filas leídas"}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
