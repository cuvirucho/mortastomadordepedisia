// CaritaRobot.jsx
import React from "react";
import { createAvatar } from '@dicebear/core';
import { botttsNeutral } from "@dicebear/collection";

const CaritaRobot = ({ seed = "robotia", ojos , boca  }) => {
const avatar = createAvatar(botttsNeutral, {
seed: "Aneka",
  size:300,
  radius:50,
backgroundType: ["gradientLinear","solid"],
backgroundColor: ["5e35b1","d1d4f9"],
  translateY: 5,
    eyes: [ojos],   // 👈 ahora dinámico
    mouth: [boca],  // 👈 ahora dinámico

});

const svg = avatar.toString();


  return (
    <div className="cararobot"   dangerouslySetInnerHTML={{ __html: svg }} />
  );
};

export default CaritaRobot;
