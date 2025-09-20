// Ejemplo seguro de contieneFrase
export const contieneFrase = (frases, texto) => {
  if (!Array.isArray(frases) || typeof texto !== "string") return false;
  return frases.some(frase => frase && texto.toLowerCase().includes(frase.toLowerCase()));
};

export const obtenerPlatoMencionado = (texto, platos) =>
  Object.keys(platos).find(plato => texto.includes(plato));



export const contieneOpcion = (texto, opciones) => {
  if (!Array.isArray(opciones)) return null;
  const limpio = texto.toLowerCase().trim();

  return opciones.find((op) => {
    const opcionLimpia = op.toLowerCase();
    return (
      limpio === opcionLimpia || // respuesta directa: "mora"
      limpio.includes(opcionLimpia) ||
      limpio.includes(`de ${opcionLimpia}`) ||
      limpio.includes(`lo quiero de ${opcionLimpia}`) ||
      limpio.includes(`quiero de ${opcionLimpia}`) ||
      limpio.includes(`me gustaria de ${opcionLimpia}`) ||
      limpio.includes(`lo quiero ${opcionLimpia}`) ||
      limpio.includes(`quiero ${opcionLimpia}`)
    );
  });
};




