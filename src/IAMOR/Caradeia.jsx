// CaritaRobot.jsx - OPTIMIZADO PARA MÓVIL
import React, { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { botttsNeutral } from "@dicebear/collection";

const CaritaRobot = React.memo(({ seed = "robotia", ojos, boca }) => {
  // Memorizar el SVG para evitar regenerarlo en cada render
  const svg = useMemo(() => {
    const avatar = createAvatar(botttsNeutral, {
      seed: "Aneka",
      size: 250, // Reducido para mejor rendimiento en móvil
      radius: 50,
      backgroundType: ["gradientLinear", "solid"],
      backgroundColor: ["5e35b1", "d1d4f9"],
      translateY: 5,
      eyes: [ojos],
      mouth: [boca],
    });
    return avatar.toString();
  }, [ojos, boca]); // Solo regenera si cambian ojos o boca

  return (
    <div
      className="cararobot"
      dangerouslySetInnerHTML={{ __html: svg }}
      style={{
        willChange: "auto",
        contain: "layout style paint",
      }}
    />
  );
});

CaritaRobot.displayName = "CaritaRobot";

export default CaritaRobot;
