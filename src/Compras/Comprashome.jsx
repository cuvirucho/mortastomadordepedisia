import React, { useState, useEffect, useRef } from "react";
import Navar from "../utilidales/Navar";

const Comprashome = () => {
  const [compras, setCompras] = useState(() => {
    const comprasGuardadas = localStorage.getItem("compras");
    return comprasGuardadas ? JSON.parse(comprasGuardadas) : [];
  });

  const [nombre, setNombre] = useState("");
  const [valor, setValor] = useState("");
  const recognitionRef = useRef(null);
  const [vozSabina, setVozSabina] = useState(null);

  useEffect(() => {
    localStorage.setItem("compras", JSON.stringify(compras));
  }, [compras]);

  // 🔊 Cargar voces disponibles
  useEffect(() => {
    const cargarVoces = () => {
      const voces = window.speechSynthesis.getVoices();
    

      const sabina = voces.find((v) =>
        v.name.toLowerCase().includes("sabina")
      );

      if (sabina) {
        setVozSabina(sabina);
      } else {
        setVozSabina(null);
      }
    };

    cargarVoces();

    // Algunos navegadores cargan voces con retardo
    window.speechSynthesis.onvoiceschanged = cargarVoces;
  }, []);

  // 🔊 Función para hablar
  const hablar = (texto) => {
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = "es-ES";
    if (vozSabina) {
      utterance.voice = vozSabina;
    }
    window.speechSynthesis.speak(utterance);
  };

  // 🎤 Inicializar reconocimiento de voz
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "es-ES";
      recognition.continuous = false;
      recognition.interimResults = false;

recognition.onresult = (event) => {
  const texto = event.results[0][0].transcript.trim();
  console.log("Reconocido:", texto);

  const partes = texto.split(" ");

  // 🔎 Buscar primer número válido en todo el texto
  let numeroFinal = null;
  let indexNumero = -1;

  for (let i = 0; i < partes.length; i++) {
    let candidato = partes[i].replace(":", ".").replace(",", ".");
    let num = parseFloat(candidato);
    if (!isNaN(num)) {
      numeroFinal = num;
      indexNumero = i;
      break;
    }
  }

  if (numeroFinal !== null) {
    // 📌 Nombre = todo menos la parte numérica encontrada
    const nombreDetectado = partes
      .filter((_, i) => i !== indexNumero)
      .join(" ")
      .trim();

    const nuevaCompra = { nombre: nombreDetectado, valor: numeroFinal };
    setCompras((prev) => [...prev, nuevaCompra]);
    hablar(
      `Compra añadida: ${nombreDetectado || "sin nombre"}, ${numeroFinal} dólares`
    );
  } else {
    // No se detectó número
    setNombre(texto);
    setValor("");
    hablar(`Compra añadida: ${texto}, valor pendiente`);
  }
};

      recognitionRef.current = recognition;
    } else {
      alert("Tu navegador no soporta reconocimiento de voz 😢");
    }
  }, [vozSabina]);

  const handleAgregarCompra = (e) => {
    e.preventDefault();
    if (nombre.trim() === "" || valor.trim() === "") return;

    const nuevaCompra = { nombre, valor: parseFloat(valor) };
    setCompras([...compras, nuevaCompra]);
    hablar(`Compra añadida: ${nombre}, ${valor} dólares`);
    setNombre("");
    setValor("");
  };

  const handleBorrarCompras = () => {
    if (window.confirm("¿Seguro que quieres borrar todas las compras?")) {
      setCompras([]);
      hablar("Todas las compras han sido borradas");
    }
  };

  const iniciarVoz = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  const total = compras.reduce((acc, compra) => acc + compra.valor, 0);



// 👉 Nueva función para borrar un ítem por índice
const handleBorrarCompra = (index) => {
  const nuevasCompras = compras.filter((_, i) => i !== index);
  setCompras(nuevasCompras);
  hablar("Compra eliminada");
};








  return (
    <section className="contfllhomevop">
      <div className="containercopras">
        <article className="HEDER">
          <img
            className="LOGOIMG"
            src="https://res.cloudinary.com/db8e98ggo/image/upload/v1731124196/Que_esperas_._dqfhgg.png"
            alt=""
          />
        </article>

        <div className="cardcopras">
          <h2 className="titlecopras">Agregar Compra</h2>
          <form onSubmit={handleAgregarCompra} className="formcopara">
            <input
              type="text"
              placeholder="Nombre de la compra"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="inputCOP"
            />
            <input
              type="number"
              placeholder="Valor"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="inputCOP"
            />
            <button type="submit" className="btnacop">
              Agregar
            </button>
          </form>


<div  className="contebtnaogbto"   >  



          <button
            onClick={iniciarVoz}
            className="btnacop"
          >
            🎤 Agregar con voz
          </button>

  

</div>

        </div>

        {compras.length > 0 && (
          <div className="contelistacop">
            <h3 className="titlecopras">Lista de Compras</h3>
          <ul className="listascop">
  {compras.map((compra, index) => (
    <li key={index} className="compraitem">
      <div  className="conteitemcop"  >
        <div>
          <p>{compra.nombre}</p>
          <p>${compra.valor.toFixed(2)}</p>
        </div>
        <button
          onClick={() => handleBorrarCompra(index)}
    className="btnelincpo"
        >
          ❌
        </button>
      </div>
    </li>
  ))}
</ul>

          </div>
        )}

        <h3 className="totlcop">Total: ${total.toFixed(2)}</h3>
      </div>

      <Navar />
    </section>
  );
};

export default Comprashome;
