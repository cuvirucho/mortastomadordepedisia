import React, { useEffect, useRef, useState } from "react";

const AuraReactiva = ({ hablando }) => {
  const auraRef = useRef(null);
  const [nivel, setNivel] = useState(0);

  // Simula cambios de amplitud aleatorios cuando habla
  useEffect(() => {
    if (!hablando) {
      setNivel(0);
      return;
    }
    const interval = setInterval(() => {
      setNivel(Math.random() * 0.7 + 0.3); // entre 0.3 y 1
    }, 100);
    return () => clearInterval(interval);
  }, [hablando]);

  // Aplica estilo en tiempo real
  useEffect(() => {
    if (auraRef.current) {
      const scale = 1 + nivel * 0.5; // escala entre 1 y 1.35 aprox
      const opacity = 0.3 + nivel * 0.4; // opacidad entre 0.3 y 0.7
      auraRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
      auraRef.current.style.opacity = `${opacity}`;
    }
  }, [nivel]);

  return <div ref={auraRef} className="aura-reactiva" />;
};

export default AuraReactiva;
