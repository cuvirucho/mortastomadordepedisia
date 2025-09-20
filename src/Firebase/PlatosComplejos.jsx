// src/data/platosComplejos.js
import { collection, getDocs } from "firebase/firestore";
import { db } from "./Firebase";

/**
 * Obtiene todos los platos de Firebase y los devuelve
 * con el formato original de `platosComplejos`
 */
export const obtenerPlatosComplejos = async (userEmail) => {
  const colRef = collection(db, "usuarios", userEmail, "Menu");
  const snapshot = await getDocs(colRef);

  const resultado = {};

  snapshot.forEach((doc) => {
    const plato = doc.data();
    resultado[plato.nombrePlato] = {
      descripcion: plato.descripcion || "",
      tipo: plato.tipo || "",
      alias: Array.isArray(plato.alias) ? plato.alias : [],
      items: Array.isArray(plato.items) ? plato.items : [],
      preguntas: plato.preguntas || {},
      precioVenta:plato.precioVenta || {},
      etiquetas: Array.isArray(plato.etiquetas) ? plato.etiquetas : [],
      ingredientes: Array.isArray(plato.ingredientes) ? plato.ingredientes:[],
    };
  });

  return resultado;
};
