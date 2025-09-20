// src/utils/texto.js
export function normalizarTexto(texto = "") {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")               // separa tildes
    .replace(/[\u0300-\u036f]/g, "")// quita tildes
    .replace(/\s+/g, " ")           // colapsa espacios
    .trim();
}
