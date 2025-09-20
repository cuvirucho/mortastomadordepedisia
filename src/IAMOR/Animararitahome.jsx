import React, { useEffect, useState, useRef } from "react";
import CaritaRobot from "./Caradeia";
import OndaReactiva from "./OndaReactiva";
import AuraReactiva from "./OndaReactiva";

const ojosHabla = ["robocop","bulging","sensor","shade01","roundFrame02"];
const bocasHabla = [  "smile02","smile01"];

const ojosReposo = ["robocop","bulging","sensor","shade01","roundFrame02","hearts","roundFrame01"];
const ojosParpadeo =["dizzy","happy"];
const bocaCallado = "smile01";

const getAleatorio = (lista) => lista[Math.floor(Math.random() * lista.length)];
const tiempoAleatorio = (min, max) => Math.floor(Math.random() * (max - min)) + min;

const RobotAnimado = () => {
  const [ojos, setOjos] = useState("eva");
  const [boca, setBoca] = useState(bocaCallado);
  const [hablando, setHablando] = useState(false);

  const parpadeoTimeout = useRef(null);
  const cambioOjosReposoInterval = useRef(null);
  const monitoreoVozInterval = useRef(null);

  // Monitorea si está hablando
  useEffect(() => {
    let animacionBocaInterval = null;

    monitoreoVozInterval.current = setInterval(() => {
      const hablandoAhora = window.speechSynthesis.speaking;
      setHablando(hablandoAhora);

      if (hablandoAhora) {
        clearInterval(cambioOjosReposoInterval.current);
        clearTimeout(parpadeoTimeout.current);

        // ⏱️ Inicia animación de boca al azar
        if (!animacionBocaInterval) {
          animacionBocaInterval = setInterval(() => {
            setBoca(getAleatorio(bocasHabla));
          }, 100); // cambia cada 180ms
        }

      } else {
        setBoca(bocaCallado);
        clearInterval(animacionBocaInterval);
        animacionBocaInterval = null;
      }
    }, 75);

    return () => {
      clearInterval(monitoreoVozInterval.current);
      clearInterval(animacionBocaInterval);
    };
  }, []);

  // Cuando está callado: ojos reposo + parpadeo ocasional
  useEffect(() => {
    if (!hablando) {
      // Cambiar ojos cada 5–8 segundos
      cambioOjosReposoInterval.current = setInterval(() => {
        setOjos(getAleatorio(ojosReposo));
      }, tiempoAleatorio(15000, 20000));

      // Parpadeo ocasional cada 3–6s
    // Parpadeo con ojos especiales (sensoriales)
const iniciarParpadeo = () => {
  parpadeoTimeout.current = setTimeout(() => {
    const ojosPrevios = ojos;
    const ojoFlash = getAleatorio(ojosParpadeo); // 👈 aleatorio llamativo
    setOjos(ojoFlash);
    setTimeout(() => {
      setOjos(ojosPrevios);
      iniciarParpadeo(); // reiniciar
    }, 150);
  }, tiempoAleatorio(6000, 7000));
};

      iniciarParpadeo();
    }

    return () => {
      clearInterval(cambioOjosReposoInterval.current);
      clearTimeout(parpadeoTimeout.current);
    };
  }, [hablando]);

  return (
    <>
    <div className="conetecarita" >

 <div className="robot-contenedor">
  
   <div className="envoltorio-carita">
  <CaritaRobot ojos={ojos} boca={null} />
  {hablando && <AuraReactiva hablando={hablando} />}
</div>

  </div>
    </div>
        </>
  );
};

export default RobotAnimado;
