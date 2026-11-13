import React, { useState, useRef, useEffect, useCallback } from "react";
import { cargarVozPreferida, hablar } from "./Voz";
import { useProcesadorTexto } from "./Prosedordetexto";
import CaritaRobot from "./Caradeia";
import RobotAnimado from "./Animararitahome";
import { obtenerPlatosComplejos } from "../Firebase/PlatosComplejos";
import { guardarPedidoMesa } from "../Firebase/PedidosMesa";
import { useNavigate, useParams } from "react-router-dom";

// Detectar si es móvil para ajustar comportamiento
const esMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

const Homeiamor = () => {
  const [usuario, setUsuario] = useState("");
  const [escuchando, setEscuchando] = useState(false);
  const [vozLista, setVozLista] = useState(false);
  const [iniciado, setIniciado] = useState(false);
  const [hablando, setHablando] = useState(false);
  const [platosComplejos, setPlatosComplejos] = useState({});
  const [procesando, setProcesando] = useState(false);
  const [estadoIA, setEstadoIA] = useState("esperando"); // esperando, escuchando, pensando, hablando
  const [permisoMicrofono, setPermisoMicrofono] = useState(false); // NUEVO: Estado de permiso
  const [mostrarBotonIniciar, setMostrarBotonIniciar] = useState(esMobile); // NUEVO: Mostrar botón en móvil
  const vozSeleccionadaRef = useRef(null);
  const escuchandoRef = useRef(false);
  const procesandoRef = useRef(false);
  const reconocimiento = useRef(null);
  const reinicioTimeoutRef = useRef(null);
  const timeoutSeguridadRef = useRef(null);
  const timeoutEscuchaRef = useRef(null);
  const navigate = useNavigate();

  const { numero } = useParams();

  // Mensajes de bienvenida variados para más naturalidad
  const mensajesBienvenida = [
    "¡Hola! Bienvenido a Moritas. Soy tu asistente virtual. ¿Qué te gustaría ordenar hoy?",
    "¡Qué gusto verte! Soy Morita, tu mesera virtual. Pregúntame por el menú o dime qué se te antoja.",
    "¡Hola! Bienvenido. Estoy lista para tomar tu pedido. ¿Empezamos?",
  ];

  // ✅ Cargar voz de forma segura - OPTIMIZADO PARA MÓVIL
  useEffect(() => {
    const esperarVoces = () => {
      const voces = window.speechSynthesis.getVoices();
      if (voces.length > 0) {
        vozSeleccionadaRef.current = cargarVozPreferida();
        setVozLista(true);
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          vozSeleccionadaRef.current = cargarVozPreferida();
          setVozLista(true);
        };
      }
    };

    // En móvil, dar más tiempo para cargar voces
    const delay = esMobile ? 500 : 100;
    setTimeout(esperarVoces, delay);

    // Cleanup: cancelar síntesis al salir
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // NUEVO: Función para solicitar permisos de micrófono
  const solicitarPermisoMicrofono = async () => {
    // Verificar si el navegador soporta getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Tu navegador no soporta acceso al micrófono. Intenta con Chrome o Safari actualizados.");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Detener el stream inmediatamente, solo lo usamos para pedir permiso
      stream.getTracks().forEach(track => track.stop());
      setPermisoMicrofono(true);
      console.log("Permiso de micrófono concedido");
      return true;
    } catch (error) {
      console.error("Error al solicitar permiso de micrófono:", error);
      if (error.name === 'NotAllowedError') {
        alert("Debes permitir el acceso al micrófono. Ve a la configuración de tu navegador y permite el micrófono para este sitio.");
      } else if (error.name === 'NotFoundError') {
        alert("No se encontró un micrófono en tu dispositivo.");
      } else {
        alert("Error al acceder al micrófono: " + error.message);
      }
      return false;
    }
  };

  // NUEVO: Función para iniciar manualmente (necesario en móviles)
  const iniciarAsistente = async () => {
    // Verificar soporte de reconocimiento de voz
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta reconocimiento de voz. Por favor usa Chrome en Android o Safari 14.5+ en iOS.");
      return;
    }

    // Primero solicitar permiso de micrófono
    const tienePermiso = await solicitarPermisoMicrofono();
    if (!tienePermiso) return;

    setMostrarBotonIniciar(false);
    
    // Pequeño delay para asegurar que todo está listo
    setTimeout(() => {
      // Iniciar el saludo - el useEffect se encargará de activar la escucha
      if (vozLista && !iniciado) {
        const mensaje = mensajesBienvenida[Math.floor(Math.random() * mensajesBienvenida.length)];
        hablarSeguro(mensaje);
        setIniciado(true);
      } else {
        // Si la voz aún no está lista, solo marcar como iniciado
        // El useEffect que observa permisoMicrofono iniciará la escucha
        setIniciado(true);
      }
    }, 300);
  };

  const hablarSeguro = useCallback((mensaje, callback) => {
    // Limpiar cualquier timeout pendiente
    if (reinicioTimeoutRef.current) {
      clearTimeout(reinicioTimeoutRef.current);
    }

    // 1️⃣ Detener reconocimiento antes de hablar
    if (reconocimiento.current && escuchandoRef.current) {
      try {
        reconocimiento.current.stop();
      } catch (e) {}
      setEscuchando(false);
      escuchandoRef.current = false;
    }

    setEstadoIA("hablando");
    setHablando(true);

    // 2️⃣ Hablar
    const synth = window.speechSynthesis;
    synth.cancel(); // Cancelar cualquier habla anterior

    const utterance = new SpeechSynthesisUtterance(mensaje);
    utterance.voice = vozSeleccionadaRef.current;
    utterance.lang = "es-ES";
    // Ajustar velocidad para móvil (un poco más lento para mejor comprensión)
    utterance.rate = esMobile ? 1.0 : 1.15;
    utterance.pitch = 1.1;

    // Fix para Chrome móvil: la síntesis puede pausarse
    if (esMobile) {
      // Workaround para bug de Chrome móvil donde la síntesis se pausa
      const resumeInterval = setInterval(() => {
        if (synth.paused) {
          synth.resume();
        }
        if (!synth.speaking) {
          clearInterval(resumeInterval);
        }
      }, 250);

      utterance.onend = () => {
        clearInterval(resumeInterval);
        setHablando(false);
        setEstadoIA("esperando");
        // Más delay en móvil para evitar cortes
        reinicioTimeoutRef.current = setTimeout(() => {
          reiniciarEscucha();
          if (callback) callback();
        }, 600);
      };

      utterance.onerror = () => {
        clearInterval(resumeInterval);
        setHablando(false);
        setEstadoIA("esperando");
        reinicioTimeoutRef.current = setTimeout(reiniciarEscucha, 600);
      };
    } else {
      utterance.onend = () => {
        setHablando(false);
        setEstadoIA("esperando");
        reinicioTimeoutRef.current = setTimeout(() => {
          reiniciarEscucha();
          if (callback) callback();
        }, 400);
      };

      utterance.onerror = () => {
        setHablando(false);
        setEstadoIA("esperando");
        reinicioTimeoutRef.current = setTimeout(reiniciarEscucha, 400);
      };
    }

    synth.speak(utterance);
  }, []);

  // Función centralizada para reiniciar escucha - OPTIMIZADA
  const reiniciarEscucha = useCallback(() => {
    // Limpiar timeout de escucha anterior
    if (timeoutEscuchaRef.current) {
      clearTimeout(timeoutEscuchaRef.current);
    }

    // No reiniciar si está hablando o ya escuchando
    if (window.speechSynthesis.speaking || escuchandoRef.current) return;

    // Asegurarse de limpiar estado de procesando
    if (procesandoRef.current) {
      procesandoRef.current = false;
      setProcesando(false);
    }

    try {
      // Primero intentar detener cualquier reconocimiento previo
      try {
        reconocimiento.current?.stop();
      } catch (e) {}

      // Pequeño delay antes de iniciar
      setTimeout(() => {
        try {
          reconocimiento.current?.start();
          setEscuchando(true);
          escuchandoRef.current = true;
          setEstadoIA("escuchando");

          // TIMEOUT DE SEGURIDAD: Si después de 10 segundos sigue "escuchando" sin recibir nada, reiniciar
          const timeoutEscucha = esMobile ? 8000 : 12000;
          timeoutEscuchaRef.current = setTimeout(() => {
            if (escuchandoRef.current && !procesandoRef.current) {
              console.warn("Escucha atascada, reiniciando...");
              try {
                reconocimiento.current?.stop();
              } catch (e) {}
              escuchandoRef.current = false;
              setEscuchando(false);
              setEstadoIA("esperando");
              // Reiniciar después de un momento
              setTimeout(reiniciarEscucha, 1000);
            }
          }, timeoutEscucha);
        } catch (e) {
          console.log("Error al iniciar reconocimiento:", e);
          escuchandoRef.current = false;
          setEscuchando(false);
          // Reintentar después de un momento
          setTimeout(reiniciarEscucha, 1500);
        }
      }, 100);
    } catch (e) {
      // Error general, reintentar
      const delay = esMobile ? 1000 : 500;
      setTimeout(() => {
        if (!escuchandoRef.current && !window.speechSynthesis.speaking) {
          reiniciarEscucha();
        }
      }, delay);
    }
  }, []);

  // Este saluda una sola vez cuando la voz ya esté lista
  // EN MÓVIL: Solo saluda después de que el usuario presione el botón
  useEffect(() => {
    if (!vozLista || iniciado) return;
    // En móvil, esperar a que el usuario inicie manualmente
    if (esMobile && mostrarBotonIniciar) return;

    const mensaje =
      mensajesBienvenida[Math.floor(Math.random() * mensajesBienvenida.length)];
    hablarSeguro(mensaje);
    setIniciado(true);
  }, [vozLista, iniciado, mostrarBotonIniciar]);

  useEffect(() => {
    const cargarPlatos = async () => {
      try {
        const data = await obtenerPlatosComplejos(
          "principamorasadmi@moritas.com",
        );
        setPlatosComplejos(data || {}); // fallback seguro
        localStorage.setItem("menu", JSON.stringify(data));
      } catch (e) {
        console.error("Error cargando platos complejos:", e);
        setPlatosComplejos({});
      }
    };
    cargarPlatos();
  }, []);

  // ✅ Hook con voz cargada
  const {
    respuesta,
    ordenes,
    setOrdenes,
    procesarTexto,
    ordenesRef,
    platoSugeridoRef,
  } = useProcesadorTexto({
    vozCargada: vozLista ? vozSeleccionadaRef.current : null,
    platosComplejos2: platosComplejos,
  });

  // ✅ Configurar reconocimiento de voz una vez - OPTIMIZADO PARA MÓVIL
  useEffect(() => {
    if (!vozLista) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("El navegador no soporta reconocimiento de voz");
      return;
    }

    reconocimiento.current = new SpeechRecognition();
    reconocimiento.current.lang = "es-ES";
    reconocimiento.current.continuous = false;
    // En móvil, desactivar interimResults para mejor rendimiento
    reconocimiento.current.interimResults = !esMobile;
    reconocimiento.current.maxAlternatives = 1;

    reconocimiento.current.onresult = async (event) => {
      const resultado = event.results[event.results.length - 1];
      const texto = resultado[0].transcript.toLowerCase();

      // Mostrar texto mientras habla (interim)
      setUsuario(texto);

      // Solo procesar cuando es resultado final
      if (resultado.isFinal) {
        setEstadoIA("pensando");
        setProcesando(true);
        procesandoRef.current = true;

        // ⏱️ Timeout de seguridad - más tiempo en móvil
        const timeoutSeguridad = esMobile ? 12000 : 8000;
        if (timeoutSeguridadRef.current)
          clearTimeout(timeoutSeguridadRef.current);
        timeoutSeguridadRef.current = setTimeout(() => {
          if (procesandoRef.current) {
            console.warn("Timeout de seguridad: reseteando estado");
            procesandoRef.current = false;
            setProcesando(false);
            setEstadoIA("esperando");
            reiniciarEscucha();
          }
        }, timeoutSeguridad);

        try {
          await procesarTexto(texto);
        } catch (e) {
          console.error("Error procesando:", e);
          hablarSeguro("Lo siento, no pude entenderte. ¿Puedes repetirlo?");
        } finally {
          // Siempre limpiar el estado al terminar
          clearTimeout(timeoutSeguridadRef.current);
          procesandoRef.current = false;
          setProcesando(false);

          // Si no está hablando, cambiar estado
          if (!window.speechSynthesis.speaking) {
            setEstadoIA("esperando");
            // Más delay en móvil
            const delayReinicio = esMobile ? 800 : 600;
            reinicioTimeoutRef.current = setTimeout(
              reiniciarEscucha,
              delayReinicio,
            );
          }
        }
      }
    };

    reconocimiento.current.onend = () => {
      // Limpiar timeout de escucha
      if (timeoutEscuchaRef.current) {
        clearTimeout(timeoutEscuchaRef.current);
      }

      setEscuchando(false);
      escuchandoRef.current = false;

      // Solo reiniciar si no está hablando ni procesando
      if (!window.speechSynthesis.speaking && !procesandoRef.current) {
        const delay = esMobile ? 800 : 500;
        reinicioTimeoutRef.current = setTimeout(reiniciarEscucha, delay);
      }
    };

    reconocimiento.current.onerror = (event) => {
      console.log("Error de reconocimiento:", event.error);

      // Limpiar timeout de escucha
      if (timeoutEscuchaRef.current) {
        clearTimeout(timeoutEscuchaRef.current);
      }

      setEscuchando(false);
      escuchandoRef.current = false;

      // Reiniciar en TODOS los errores en móvil (son más comunes)
      if (esMobile) {
        const delay = 1200;
        reinicioTimeoutRef.current = setTimeout(reiniciarEscucha, delay);
      } else {
        // En desktop, solo reiniciar en errores recuperables
        if (
          event.error === "no-speech" ||
          event.error === "aborted" ||
          event.error === "network"
        ) {
          const delay = 800;
          reinicioTimeoutRef.current = setTimeout(reiniciarEscucha, delay);
        }
      }
    };

    // Evento adicional para móviles: onaudiostart/onaudioend
    reconocimiento.current.onaudiostart = () => {
      console.log("Audio iniciado");
    };

    // Activación inicial - EN MÓVIL solo activar si ya tiene permiso y el usuario inició
    if (!esMobile || (esMobile && permisoMicrofono && !mostrarBotonIniciar)) {
      const delayInicial = esMobile ? 2500 : 1500;
      reinicioTimeoutRef.current = setTimeout(reiniciarEscucha, delayInicial);
    }

    return () => {
      if (reinicioTimeoutRef.current) clearTimeout(reinicioTimeoutRef.current);
      if (timeoutSeguridadRef.current)
        clearTimeout(timeoutSeguridadRef.current);
      if (timeoutEscuchaRef.current) clearTimeout(timeoutEscuchaRef.current);
      try {
        reconocimiento.current?.stop();
      } catch (e) {}
      window.speechSynthesis.cancel();
    };
  }, [vozLista, hablarSeguro, reiniciarEscucha, permisoMicrofono, mostrarBotonIniciar]);

  const enviarOrden = () => {
    if (ordenesRef.current.length === 0) {
      hablar("No hay nada en la orden.", vozSeleccionadaRef.current);
      alert("⚠️ No hay nada en la orden.");
      return;
    }

    // Leer lo que ya hay en localStorage
    const pedidoExistenteJSON = localStorage.getItem(`mesa${numero}`);
    let pedidoExistente = [];
    if (pedidoExistenteJSON) {
      try {
        pedidoExistente = JSON.parse(pedidoExistenteJSON);
        if (!Array.isArray(pedidoExistente)) pedidoExistente = [];
      } catch {
        pedidoExistente = [];
      }
    }

    // Combinar pedidos anteriores con los nuevos
    const pedidosCombinados = [...pedidoExistente, ...ordenesRef.current];

    const resumen = pedidosCombinados.map((o) => `${o.nombre}`).join(" | ");
    console.log(pedidosCombinados);

    const mensaje = `Tu pedido ha sido enviado: ${resumen}. ¡Gracias!`;
    hablarSeguro(mensaje);
    alert("✅ " + mensaje);

    // Guardar la combinación en localStorage
    localStorage.setItem(`mesa${numero}`, JSON.stringify(pedidosCombinados));

    setOrdenes([]);
    ordenesRef.current = [];

    // Guardar/actualizar en Firebase; esperar un poco antes del reload
    Promise.race([
      guardarPedidoMesa(numero, pedidosCombinados, pedidoExistente.length === 0),
      new Promise((r) => setTimeout(r, 1500)),
    ]).finally(() => {
      navigate(`/mesa/${numero}`);
      window.location.reload();
    });
  };

  /*elimnar unaorden */
  const eliminarOrden = (index) => {
    const ordenEliminada = ordenes[index];
    const nuevasOrdenes = [...ordenes];
    nuevasOrdenes.splice(index, 1);
    setOrdenes(nuevasOrdenes);
    ordenesRef.current = nuevasOrdenes;

    // 🗣️ Mensaje hablado al eliminar
    const mensaje = `La orden ${ordenEliminada.nombre} ha sido eliminada.`;
    hablarSeguro(mensaje);
  };

  return (
    <div className="contepricipalia">
      <RobotAnimado />

      {/* BOTÓN DE INICIO PARA MÓVILES - Necesario para permisos de audio */}
      {mostrarBotonIniciar && (
        <div className="boton-inicio-movil">
          <button 
            className="btn-iniciar-asistente"
            onClick={iniciarAsistente}
          >
            🎤 Toca para hablar con Morita
          </button>
          <p className="texto-permiso">Es necesario permitir el micrófono</p>
        </div>
      )}

      {/* Indicador de estado de la IA */}
      <div className="estado-ia">
        {estadoIA === "escuchando" && (
          <span className="estado escuchando">🎤 Te escucho...</span>
        )}
        {estadoIA === "pensando" && (
          <span className="estado pensando">🤔 Procesando...</span>
        )}
        {estadoIA === "hablando" && (
          <span className="estado hablando">🗣️ Hablando...</span>
        )}
      </div>

      {/* Mostrar lo que el usuario dice */}
      {usuario && (
        <div className="texto-usuario">
          <p>📝 "{usuario}"</p>
        </div>
      )}

      <section className="conteordens">
        {ordenes.length > 0 ? (
          <>
            <h3 className="tulopedis">
              🧾 Pedido actual para la mesa {numero}
            </h3>

            <ul className="contelitadepdis">
              {ordenes.map((orden, index) => (
                <li className="carpefid" key={index}>
                  <button
                    className="btnEliminar"
                    onClick={() => eliminarOrden(index)}
                  >
                    ❌
                  </button>
                  <strong className="nobretulo">{orden.nombre}</strong>

                  <ul className="contdeta">
                    {Object.entries(orden.respuestas).map(([item, r], i) => (
                      <li className="detitem" key={i}>
                        {item}: {r}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>

            <button onClick={enviarOrden}>enviar pedido</button>
          </>
        ) : null}
      </section>
    </div>
  );
};

export default Homeiamor;
