// Detectar si es móvil
const esMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

export const cargarVozPreferida = () => {
  const voces = window.speechSynthesis.getVoices();

  // En móvil, preferir voces locales que son más rápidas
  let voz = null;

  if (esMobile) {
    // Primero buscar voces locales en español
    voz = voces.find((v) => v.lang.startsWith("es") && v.localService);
    if (!voz) voz = voces.find((v) => v.lang.startsWith("es"));
  } else {
    voz = voces.find((v) => v.name.toLowerCase().includes("sabina"));
    if (!voz)
      voz = voces.find(
        (v) =>
          v.name.toLowerCase().includes("google") && v.lang.startsWith("es"),
      );
  }

  return voz || voces.find((v) => v.lang.startsWith("es")) || voces[0];
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
  // Ajustar velocidad para móvil
  mensaje.rate = esMobile ? 1.0 : 1.1;
  mensaje.pitch = 1.2;

  // Workaround para Chrome móvil
  if (esMobile) {
    const resumeInterval = setInterval(() => {
      if (synth.paused) synth.resume();
      if (!synth.speaking) clearInterval(resumeInterval);
    }, 200);
  }

  synth.speak(mensaje);
};
