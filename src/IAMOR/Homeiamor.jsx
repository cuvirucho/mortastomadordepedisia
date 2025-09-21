import React, { useState, useRef, useEffect } from "react";
import { cargarVozPreferida, hablar } from "./Voz";
import { useProcesadorTexto } from "./Prosedordetexto";
import CaritaRobot from "./Caradeia";
import RobotAnimado from "./Animararitahome";
import { obtenerPlatosComplejos } from "../Firebase/PlatosComplejos";
import { useNavigate, useParams } from "react-router-dom";

const Homeiamor = () => {
  const [usuario, setUsuario] = useState("");
  const [escuchando, setEscuchando] = useState(false);
  const [vozLista, setVozLista] = useState(false);
  const [iniciado, setIniciado] = useState(false);
const [hablando, setHablando] = useState(false);
const [platosComplejos, setPlatosComplejos] = useState({})
  const vozSeleccionadaRef = useRef(null);
  const escuchandoRef = useRef(false);
  const reconocimiento = useRef(null);
  const navigate = useNavigate();


 const { numero } = useParams();
  // ✅ Cargar voz de forma segura
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

    esperarVoces();

  }, []);




const hablarSeguro = (mensaje) => {
  // 1️⃣ Detener el reconocimiento si está activo
  if (reconocimiento.current && escuchandoRef.current) {
    reconocimiento.current.stop(); // Pausamos el micrófono
    setEscuchando(false);
    escuchandoRef.current = false;
  }

  // 2️⃣ Llamamos a la función original de hablar
  hablar(mensaje, vozSeleccionadaRef.current);

  // 3️⃣ Esperamos a que termine de hablar para reiniciar reconocimiento
  const checkHablando = setInterval(() => {
    if (!window.speechSynthesis.speaking) {
      clearInterval(checkHablando); // Terminamos el intervalo
      // 4️⃣ Reiniciamos el micrófono
      reconocimiento.current.start();
      setEscuchando(true);
      escuchandoRef.current = true;
    }
  }, 100); // revisamos cada 100ms si terminó de hablar
};
























// Este saluda una sola vez cuando la voz ya esté lista
useEffect(() => {
  if (!vozLista || iniciado) return;

  const mensaje = "¡Hola! Bienvenida a moritas  Soy tu mesera morita . Puedes pedirme lo que quiras o preguntarme por el menú. Estoy para servirte.";
  hablarSeguro(mensaje);
  setIniciado(true);
}, [vozLista, iniciado]);







 useEffect(() => {
    const cargarPlatos = async () => {
      try {
        const data = await obtenerPlatosComplejos("principamorasadmi@moritas.com");
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
  platosComplejos2:platosComplejos
  });

  // ✅ Configurar reconocimiento de voz una vez
  useEffect(() => {
    if (!vozLista) return;

    reconocimiento.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    reconocimiento.current.lang = "es-ES";
    reconocimiento.current.continuous = false;
    reconocimiento.current.interimResults = false;
    reconocimiento.current.maxAlternatives = 1;

    reconocimiento.current.onresult = async (event) => {
      const texto = event.results[0][0].transcript.toLowerCase();
      setUsuario(texto);
      await procesarTexto(texto);
    };

    reconocimiento.current.onend = () => {
      setEscuchando(false);
      escuchandoRef.current = false;
      setTimeout(() => {
        if (!escuchandoRef.current) {
          reconocimiento.current.start();
          setEscuchando(true);
          escuchandoRef.current = true;
        }
      }, 500);
    };



    const intervalo = setInterval(() => {
    setHablando(window.speechSynthesis.speaking);
  }, 100);
  
  
  
  // Activación automática si está listo
  setTimeout(() => {
    if (!escuchandoRef.current) {
      reconocimiento.current.start();
      setEscuchando(true);
      escuchandoRef.current = true;
    }
  }, 1000);
  
  
  
  
  return () => clearInterval(intervalo);
  }, [vozLista]);

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
  
    navigate(`/mesa/${numero}`);
    window.location.reload();
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



<section  className="conteordens"  >
{
  
  ordenes.length>0?
<>
      <h3 className="tulopedis"  >🧾 Pedido actual para la mesa {numero}</h3>
    
      <ul className="contelitadepdis"   >
        {ordenes.map((orden, index) => (
          <li  className="carpefid" key={index}>
          <button
    className="btnEliminar"
    onClick={() => eliminarOrden(index)}
   
  >
    ❌
  </button>
            <strong className="nobretulo"  >{orden.nombre}</strong>
         
            <ul className="contdeta" >
              {Object.entries(orden.respuestas).map(([item, r], i) => (
                <li  className="detitem"  key={i}>{item}: {r}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>



<button onClick={enviarOrden} >
  enviar pedido
</button>


</>
  :
  
  null
}


</section>





    </div>
  );
};

export default Homeiamor;
