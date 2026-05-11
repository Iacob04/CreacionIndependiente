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
