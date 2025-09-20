export const cargarVozPreferida = () => {
  const voces = window.speechSynthesis.getVoices();
  let voz = voces.find(v => v.name.toLowerCase().includes("sabina"));
  if (!voz) voz = voces.find(v => v.name.toLowerCase().includes("google") && v.lang.startsWith("es"));
  return voz || voces[0];
};

export const hablar = (texto, voz) => {
  if (!texto) return;

  const synth = window.speechSynthesis;

  if (!voz) {
    // Esperar a que las voces estén listas
    window.speechSynthesis.onvoiceschanged = () => {
      const nuevaVoz = cargarVozPreferida();
      hablar(texto, nuevaVoz);
    };
    return;
  }

  // Asegurarse que no haya otra voz hablando
  if (synth.speaking) {
    synth.cancel();
  }

  const mensaje = new SpeechSynthesisUtterance(texto);
  mensaje.lang = "es-ES";
  mensaje.voice = voz;
  mensaje.rate = 1.1;
mensaje.pitch = 1.2;
  synth.speak(mensaje);
};
