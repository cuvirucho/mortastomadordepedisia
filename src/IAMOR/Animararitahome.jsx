import React, { useEffect, useState, useRef, useMemo } from "react";
import CaritaRobot from "./Caradeia";
import AuraReactiva from "./OndaReactiva";

const ojosReposo = ["robocop", "bulging", "sensor", "shade01", "roundFrame02"];
const bocasHabla = ["smile02", "smile01"];
const bocaCallado = "smile01";

const getAleatorio = (lista) => lista[Math.floor(Math.random() * lista.length)];

// Detectar si es móvil
const esMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

const RobotAnimado = React.memo(() => {
  const [ojos, setOjos] = useState("robocop");
  const [boca, setBoca] = useState(bocaCallado);
  const [hablando, setHablando] = useState(false);

  const hablandoRef = useRef(false);
  const animacionBocaInterval = useRef(null);
  const ojosInterval = useRef(null);
  const checkInterval = useRef(null);

  // Monitoreo simple con setInterval - más predecible y eficiente
  useEffect(() => {
    // Verificar estado de habla cada 300ms (suficiente para detectar cambios)
    const intervaloCheck = esMobile ? 400 : 300;

    checkInterval.current = setInterval(() => {
      const hablandoAhora = window.speechSynthesis.speaking;

      if (hablandoAhora !== hablandoRef.current) {
        hablandoRef.current = hablandoAhora;
        setHablando(hablandoAhora);

        if (hablandoAhora) {
          // Iniciar animación de boca
          if (!animacionBocaInterval.current) {
            const intervaloBoca = esMobile ? 300 : 200;
            animacionBocaInterval.current = setInterval(() => {
              setBoca((prev) => (prev === "smile01" ? "smile02" : "smile01"));
            }, intervaloBoca);
          }
        } else {
          // Detener animación de boca
          setBoca(bocaCallado);
          if (animacionBocaInterval.current) {
            clearInterval(animacionBocaInterval.current);
            animacionBocaInterval.current = null;
          }
        }
      }
    }, intervaloCheck);

    // Cambio de ojos periódico (muy poco frecuente)
    const intervaloOjos = esMobile ? 25000 : 18000;
    ojosInterval.current = setInterval(() => {
      if (!hablandoRef.current) {
        setOjos(getAleatorio(ojosReposo));
      }
    }, intervaloOjos);

    return () => {
      clearInterval(checkInterval.current);
      clearInterval(ojosInterval.current);
      if (animacionBocaInterval.current) {
        clearInterval(animacionBocaInterval.current);
      }
    };
  }, []);

  // Memorizar el componente de carita para evitar re-renders innecesarios
  const caritaMemo = useMemo(
    () => <CaritaRobot ojos={ojos} boca={boca} />,
    [ojos, boca],
  );

  return (
    <div className="conetecarita">
      <div className="robot-contenedor">
        <div className="envoltorio-carita">
          {caritaMemo}
          {hablando && <AuraReactiva hablando={hablando} />}
        </div>
      </div>
    </div>
  );
});

RobotAnimado.displayName = "RobotAnimado";

export default RobotAnimado;
