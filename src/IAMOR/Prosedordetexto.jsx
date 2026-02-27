import { useState, useRef, useEffect } from "react";
import { contieneFrase, obtenerPlatoMencionado } from "./Preguntasloigcas";
import {
  frasesConsultaMenu,
  frasesContenidoPlato,
  frasesOrden,
  platosComplejos,
  catalogo,
  frasesAfirmativas,
  frasesNegativas,
  frasesRecomendacion,
} from "./Fracesdetonates";
import { generarRespuesta } from "./Gmeniia";
import { hablar } from "./Voz";
import { useGestorDePedidos } from "./UseGestorDePedidos";

export const useProcesadorTexto = ({ vozCargada, platosComplejos2 }) => {
  const [respuesta, setRespuesta] = useState([]);
  const [ordenes, setOrdenes] = useState([]);

  const ordenesRef = useRef([]);
  const subitemActualRef = useRef(null);
  const platosPendientesRef = useRef([]);
  const platoSugeridoRef = useRef(null);
  const ultimasSugerenciasRef = useRef([]);
  const ultimoMensajeTimestampRef = useRef(Date.now());
  const abaldoRef = useRef(false);
  const colaPendientesRef = useRef([]);
  const platosRef = useRef({});

  // Inicializar platos
  useEffect(() => {
    platosRef.current = platosComplejos2 ?? {};
  }, [platosComplejos2]);

  // Intervalo de silencio para sugerir finalizar pedido
  // OPTIMIZADO: Intervalo más largo para mejor rendimiento
  useEffect(() => {
    const intervaloSilencio = setInterval(() => {
      const hanPasadoMs = Date.now() - ultimoMensajeTimestampRef.current;
      if (hanPasadoMs > 15_000 && !abaldoRef.current) {
        sugerirFinDePedido();
      }
    }, 15000); // Cambiado de 10s a 15s para reducir checks

    return () => clearInterval(intervaloSilencio);
  }, []);

  const { procesarTextoPedido } = useGestorDePedidos(
    platosRef.current,
    catalogo,
    vozCargada,
    ordenesRef,
    actualizarOrdenes,
    platosPendientesRef,
    subitemActualRef,
    colaPendientesRef,
  );

  // Mensajes variados para más naturalidad
  const mensajesFinPedido = [
    "Si ya terminaste, presiona Enviar pedido y preparamos todo.",
    "¿Algo más? Si no, puedes enviar tu pedido cuando quieras.",
    "Tu orden está lista. ¿Enviamos o agregamos algo más?",
  ];

  const mensajesNoEntendi = [
    "Mmm, no te escuché bien. ¿Puedes repetirlo?",
    "Perdón, ¿qué dijiste?",
    "No capturé eso. ¿Me lo repites?",
  ];

  const mensajesAfirmativos = [
    "¡Perfecto!",
    "¡Excelente elección!",
    "¡Listo!",
    "¡Genial!",
  ];

  // Función para obtener mensaje aleatorio
  const getMensajeAleatorio = (lista) =>
    lista[Math.floor(Math.random() * lista.length)];

  // Función para sugerir finalizar pedido
  const sugerirFinDePedido = () => {
    const sinPedidosPendientes =
      colaPendientesRef.current.length === 0 &&
      platosPendientesRef.current.length === 0 &&
      !subitemActualRef.current;

    const hayOrden = ordenesRef.current.length > 0;

    if (sinPedidosPendientes && hayOrden) {
      const mensaje = getMensajeAleatorio(mensajesFinPedido);
      setRespuesta(mensaje);
      hablarSiHayVoz(mensaje);
    }
  };

  // Función para hablar si hay voz cargada
  const hablarSiHayVoz = (texto) => {
    if (vozCargada) {
      hablar(texto, vozCargada);
      ultimoMensajeTimestampRef.current = Date.now();
      abaldoRef.current = true;
    }
  };

  // Actualizar órdenes
  function actualizarOrdenes(nuevas) {
    ordenesRef.current = nuevas;
    setOrdenes(nuevas);
  }

  // --- Funciones de manejo de texto ---

  const manejarConsultaMenu = async (texto) => {
    if (!contieneFrase(frasesConsultaMenu, texto)) return false;

    const platos = Object.keys(platosRef.current);
    const intro = getMensajeAleatorio([
      "Tenemos opciones deliciosas:",
      "Nuestro menú incluye:",
      "Te puedo ofrecer:",
    ]);
    const listaPlatos = platos.slice(0, 5).join(", "); // Limitar para no abrumar
    const res = `${intro} ${listaPlatos}. ¿Cuál te llama la atención?`;

    setRespuesta(res);
    hablarSiHayVoz(res);
    return true;
  };

  const manejarContenidoPlato = async (texto) => {
    if (!contieneFrase(frasesContenidoPlato, texto)) return false;

    const normalizar = (s) =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    const textoNormalizado = normalizar(texto);

    let platoDetectado = null;

    Object.entries(platosRef.current).forEach(([nombrePlato, infoPlato]) => {
      const nombreNormalizado = normalizar(nombrePlato);
      const alias = infoPlato.alias || [];
      const coincideNombre = textoNormalizado.includes(nombreNormalizado);
      const coincideAlias = alias.some((a) =>
        textoNormalizado.includes(normalizar(a)),
      );

      if (coincideNombre || coincideAlias) platoDetectado = nombrePlato;
    });

    if (!platoDetectado) return false;

    const descripcion = platosRef.current[platoDetectado].descripcion;
    const res = `El ${platoDetectado} ${descripcion}. ¿Te gustaría pedirlo?`;

    setRespuesta(res);
    hablarSiHayVoz(res);
    platoSugeridoRef.current = platoDetectado;
    return true;
  };

  const detectarYOfrecerSugerencia = (texto) => {
    const textoLimpio = texto.toLowerCase();

    for (const [nombrePlato, detalles] of Object.entries(platosRef.current)) {
      if (
        textoLimpio.includes(nombrePlato.toLowerCase()) ||
        detalles.alias?.some((a) => textoLimpio.includes(a.toLowerCase()))
      ) {
        const res = `¿Te gustaría pedir el ${nombrePlato} o si quieres más información di "qué lleva el ${nombrePlato}"?`;
        setRespuesta(res);
        hablarSiHayVoz(res);
        platoSugeridoRef.current = nombrePlato;
        return true;
      }
    }

    return false;
  };

  const manejarSugerencia = async (texto) => {
    const etiquetas = ["llenador", "ligero", "vegetariano", "rápido", "dulce"];
    const etiquetaMencionada = etiquetas.find((etq) =>
      texto.toLowerCase().includes(etq),
    );

    if (!contieneFrase(frasesRecomendacion, texto)) return false;

    if (etiquetaMencionada) return sugerirPorTipo(etiquetaMencionada);
    else return sugerirAleatorio();
  };

  const ordendircta = async (texto) => {
    if (contieneFrase(frasesOrden, texto)) {
      await procesarTextoPedido(texto);
      return true;
    }
    return false;
  };

  const manejarListaDeSugerencias = async (texto) => {
    const textoLimpio = texto.toLowerCase();
    const mencionado = ultimasSugerenciasRef.current.find((nombre) =>
      textoLimpio.includes(nombre),
    );

    if (mencionado) {
      const esComplejo = Object.keys(platosRef.current).includes(mencionado);
      if (esComplejo) {
        platosPendientesRef.current.push({
          nombre: mencionado,
          respuestas: {},
        });
        await procesarTextoPedido(""); // iniciar flujo
      } else {
        const res = `Lo siento, no tengo el plato ${mencionado} en el menú.`;
        setRespuesta(res);
        hablarSiHayVoz(res);
      }
      ultimasSugerenciasRef.current = [];
      return true;
    }

    return false;
  };

  const procesarSugerenciaActiva = async (sugerido, texto) => {
    if (!sugerido) return false;

    if (contieneFrase(frasesAfirmativas, texto)) {
      hablarSiHayVoz(getMensajeAleatorio(mensajesAfirmativos));
      await procesarTextoPedido(`quiero ${sugerido}`);
      platoSugeridoRef.current = null;
    } else if (contieneFrase(frasesNegativas, texto)) {
      const mensajesNegativos = [
        "¡Sin problema! ¿Qué otra cosa te gustaría?",
        "Entendido. Dime qué más te interesa.",
        "Ok, ¿en qué más puedo ayudarte?",
      ];
      const res = getMensajeAleatorio(mensajesNegativos);
      setRespuesta(res);
      hablarSiHayVoz(res);
      platoSugeridoRef.current = null;
    } else {
      platoSugeridoRef.current = null;
    }

    return true;
  };

  const dijounproc = async (texto) => {
    const noEsOrden = !contieneFrase(frasesOrden, texto);
    const sinPlatosActivos =
      !platosPendientesRef.current[0] && !subitemActualRef.current;

    if (noEsOrden && sinPlatosActivos) {
      return detectarYOfrecerSugerencia(texto);
    } else {
      hablarSiHayVoz(getMensajeAleatorio(mensajesNoEntendi));
    }

    return false;
  };

  const hayPedidoEnProceso = async (texto) => {
    if (
      platosPendientesRef.current.length > 0 &&
      subitemActualRef.current !== null
    ) {
      await procesarTextoPedido(texto);
      return true;
    }
    return false;
  };

  const sugerirPorTipo = (etiqueta) => {
    const sugerencias = Object.entries(platosRef.current)
      .filter(([_, detalles]) => detalles.etiquetas?.includes(etiqueta))
      .map(([nombre]) => ({ nombre, tipo: "complejo" }));

    if (sugerencias.length === 0) {
      const res = `No tengo nada etiquetado como ${etiqueta}, pero puedes preguntarme por otra cosa.`;
      setRespuesta(res);
      hablarSiHayVoz(res);
      return false;
    }

    const nombres = sugerencias.map((s) => s.nombre).join(", ");
    const res = `Aquí tienes algunas opciones ${etiqueta}: ${nombres}. ¿Te gustaría pedir alguna?`;
    setRespuesta(res);
    hablarSiHayVoz(res);
    platoSugeridoRef.current = null;
    ultimasSugerenciasRef.current = sugerencias.map((s) =>
      s.nombre.toLowerCase(),
    );
    return true;
  };

  const sugerirAleatorio = () => {
    const todos = Object.keys(platosRef.current);
    const elegido = todos[Math.floor(Math.random() * todos.length)];
    const intros = [
      `Te recomiendo el ${elegido}, ¡es muy popular!`,
      `¿Qué tal un ${elegido}? A todos les encanta.`,
      `El ${elegido} es una excelente opción hoy.`,
    ];
    const res = `${getMensajeAleatorio(intros)} ¿Lo quieres?`;
    setRespuesta(res);
    hablarSiHayVoz(res);
    platoSugeridoRef.current = elegido;
    return true;
  };

  const manejarConversacionLibre = async (texto) => {
    const noEsOrden = !contieneFrase(frasesOrden, texto);
    const sinPlatosActivos =
      !platosPendientesRef.current[0] && !subitemActualRef.current;

    if (noEsOrden && sinPlatosActivos) {
      const res = await generarRespuesta(texto);
      setRespuesta(res);
      hablarSiHayVoz(res);
      return true;
    }
    return false;
  };

  /*nuev*/

  // Función para sugerir platos por tipo
  const sugerirPorTipoDePlato = (tipo) => {
    const sugerencias = Object.entries(platosRef.current)
      .filter(
        ([_, detalles]) => detalles.tipo?.toLowerCase() === tipo.toLowerCase(),
      )
      .map(([nombre]) => nombre);

    if (sugerencias.length === 0) {
      const res = `Lo siento, no tengo platos del tipo "${tipo}".`;
      setRespuesta(res);
      hablarSiHayVoz(res);
      return false;
    }

    const lista = sugerencias.join(", ");
    const res = `Estos son los platos de tipo "${tipo}": ${lista}. ¿Cuál te gustaría pedir?`;
    setRespuesta(res);
    hablarSiHayVoz(res);
    ultimasSugerenciasRef.current = sugerencias.map((s) => s.toLowerCase());
    return true;
  };

  // Detectar tipo de plato en el texto
  const detectarTipoPlato = (texto) => {
    const tipos = ["desayuno", "pancakes", "tigrillo"]; // puedes agregar más tipos
    const tipoMencionado = tipos.find((t) => texto.toLowerCase().includes(t));
    const noEsOrden = !contieneFrase(frasesOrden, texto);
    const sinPlatosActivos =
      !platosPendientesRef.current[0] && !subitemActualRef.current;

    if (tipoMencionado && noEsOrden && sinPlatosActivos) {
      sugerirPorTipoDePlato(tipoMencionado);
      return true;
    }
    return false;
  };

  // Función principal
  const procesarTexto = async (texto) => {
    // Validar que hay texto
    if (!texto || texto.trim() === "") {
      return;
    }

    ultimoMensajeTimestampRef.current = Date.now();
    abaldoRef.current = true;

    let sugerido = platoSugeridoRef.current;

    try {
      if (await ordendircta(texto)) return;
      if (await manejarContenidoPlato(texto)) return;
      if (await manejarConsultaMenu(texto)) return;
      if (await hayPedidoEnProceso(texto)) return;
      if (await procesarSugerenciaActiva(sugerido, texto)) return;
      if (await manejarListaDeSugerencias(texto)) return;
      if (await manejarSugerencia(texto)) return;
      if (await dijounproc(texto)) return;
      if (await detectarTipoPlato(texto)) return;
      if (await manejarConversacionLibre(texto)) return;

      // Si ninguna función manejó el texto, dar respuesta genérica
      const respuestaGenerica = getMensajeAleatorio([
        "¿Puedes decirme qué te gustaría ordenar?",
        "Estoy aquí para ayudarte. ¿Qué deseas?",
        "¿En qué puedo ayudarte?",
      ]);
      hablarSiHayVoz(respuestaGenerica);
    } catch (error) {
      console.error("Error en procesarTexto:", error);
      // Respuesta de fallback en caso de error
      hablarSiHayVoz("Disculpa, tuve un problema. ¿Puedes repetirlo?");
    }
  };

  return {
    respuesta,
    ordenes,
    setOrdenes,
    procesarTexto,
    ordenesRef,
    platoSugeridoRef,
  };
};

/*corecines de gpt */
/*pruna1*/
/*ya esat todo slo vasmo a ases una mejoras */
