import { useEffect, useRef, useState } from "react";
import { hablar } from "./Voz";
import wordsToNumbersEs from "words-to-numbers-es";

export const useGestorDePedidos = (
  platosComplejos,
  catalogo,
  vozSeleccionada,
  ordenesRef,
  actualizarOrdenes,
  platosPendientesRef,
  subitemActualRef
) => {
  const platosRef2 = useRef({});

  useEffect(() => {
    platosRef2.current = platosComplejos ?? {};
  }, [platosComplejos]);

  const [platosPendientes, setPlatosPendientes] = useState([]);
  const [subitemActual, setSubitemActual] = useState(null);


  const hablarSeguro = (texto) => {
    if (vozSeleccionada) {
      hablar(texto, vozSeleccionada);
    } else {
      console.warn("⚠️ Intento de hablar sin voz cargada:", texto);
    }
  };

  const normalizar = (texto) => {
    if (!texto || typeof texto !== "string") return "";
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  const manejarPedidoComplejo = (texto) => {
    const partes = texto
      .toLowerCase()
      .split(/\by\b|\s*,\s*|\.\s*|\;\s*/i)
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const nuevosPlatos = [];

    for (const parte of partes) {
      const matchCantidad = parte.match(
        /(uno|una|un|dos|tres|cuatro|cinco|\d+)\s+(.*)/i
      );
      let cantidad = 1;
      let descripcion = parte;

      if (matchCantidad) {
        cantidad = wordsToNumbersEs(matchCantidad[1]) || 1;
        descripcion = matchCantidad[2];
      }

      for (const nombre in platosRef2.current) {
        const normalizadoDescripcion = normalizar(descripcion);
        const normalizadoNombre = normalizar(nombre);
        const alias = platosRef2.current[nombre].alias || [];

        const coincideNombre =
          normalizadoDescripcion.includes(normalizadoNombre);
        const coincideAlias = alias.some((a) =>
          normalizadoDescripcion.includes(normalizar(a))
        );

        if (coincideNombre || coincideAlias) {
          for (let i = 0; i < cantidad; i++) {
            nuevosPlatos.push({
              id: Date.now() + Math.random(),
              nombre,
              items: platosRef2.current[nombre].items,
              preguntas: platosRef2.current[nombre].preguntas,
            });
          }
          break;
        }
      }
    }

    if (nuevosPlatos.length === 0) return false;

    const actualizados = [...platosPendientesRef.current, ...nuevosPlatos];
    setPlatosPendientes(actualizados);
    platosPendientesRef.current = actualizados;

    if (!subitemActualRef.current && nuevosPlatos.length > 0) {
      const primerPlato = nuevosPlatos[0];
      const primerItem = primerPlato.items[0];
      setSubitemActual(primerItem);
      subitemActualRef.current = primerItem;

      const pregunta = primerPlato.preguntas[primerItem];
      hablarSeguro(`Para el ${primerPlato.nombre}: ${pregunta}`);
    }

    return true;
  };

  const gestionarSiguientePregunta = (texto) => {
    const actual = platosPendientesRef.current[0];
    const itemActual = subitemActualRef.current;
    if (!actual || !itemActual) return false;

    let orden = ordenesRef.current.find((o) => o.id === actual.id);
    if (!orden) {
      const infoExtra = platosRef2.current[actual.nombre] ?? {};

      orden = {
        id: actual.id,
        nombre: actual.nombre,
        respuestas: {},
        precioVenta: infoExtra.precioVenta,
        ingredientes: infoExtra.ingredientes,
      };
      ordenesRef.current.push(orden);
    }

    orden.respuestas[itemActual] = texto;
    actualizarOrdenes([...ordenesRef.current]);

    const pendientes = actual.items.filter(
      (item) => !orden.respuestas[item] && item !== itemActual
    );

    if (pendientes.length > 0) {
      const siguienteItem = pendientes[0];
      setSubitemActual(siguienteItem);
      subitemActualRef.current = siguienteItem;

      const pregunta = actual.preguntas[siguienteItem];
      hablarSeguro(pregunta);
    } else {
      const restantes = platosPendientesRef.current.slice(1);
      setPlatosPendientes(restantes);
      platosPendientesRef.current = restantes;

      if (restantes.length > 0) {
        const siguientePlato = restantes[0];
        const siguienteItem = siguientePlato.items[0];

        setSubitemActual(siguienteItem);
        subitemActualRef.current = siguienteItem;

        const pregunta = siguientePlato.preguntas[siguienteItem];
        hablarSeguro(`Ahora vamos con el ${siguientePlato.nombre}. ${pregunta}`);
      } else {
        setSubitemActual(null);
        subitemActualRef.current = null;
        hablarSeguro("Listo, he anotado todos los pedidos si deseas algo más solo dime o si es todo presiona el botón de enviar pedido y espera la magia.");
      }
    }

    return true;
  };

  const procesarTextoPedido = async (texto) => {

console.log("estamos en procesarTextoPedido:", texto);

    if (platosPendientesRef.current.length > 0 && subitemActualRef.current !== null) {
      const continuado = gestionarSiguientePregunta(texto);
      return {
        seDetecto: continuado,
        ordenes: [...ordenesRef.current],
      };
    }

    const frases = texto
      .toLowerCase()
      .split(/\by\b|\s*,\s*|\.\s*|\;\s*/i)
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    let seDetecto = false;
    for (const frase of frases) {
      const complejosDetectados = manejarPedidoComplejo(frase);
      if (complejosDetectados) seDetecto = true;
    }

    return {
      seDetecto,
      ordenes: [...ordenesRef.current],
    };
  };

  return {
    procesarTextoPedido,
    platosPendientes,
    subitemActual,
  };
};
