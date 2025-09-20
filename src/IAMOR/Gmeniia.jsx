import { GoogleGenerativeAI } from "@google/generative-ai";


const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);




// (Opcional) Namespacing para localStorage
const keyFor = (name) => `${name}`;

const getMenuFromStorage = () => {
  try {
    // Si no quieres namespacing, usa "menu" directamente
    const raw = localStorage.getItem(keyFor("menu")); 
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("No se pudo leer/parsear el menú de localStorage:", e);
    return null;
  }
};

// Formatea tu menú para el prompt
const formatMenu = (menu) => {
  if (!menu) return "No hay menú cargado.";
  if (Array.isArray(menu)) {
    return menu
      .map((i) => `- ${i.nombre}${i.precio ? ` $${i.precio}` : ""}${i.descripcion ? `: ${i.descripcion}` : ""}`)
      .join("\n");
  }
  return JSON.stringify(formatMenu(menu));
};

 




export const generarRespuesta = async (texto) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

    const menu = getMenuFromStorage();

    

  try {
   
   
const result = await model.generateContent([
  `
  
  PARAMETROS
  Responde de forma breve y natural en español de una manera  femenina conversadora no uses la palabrase ay , uy,amor o mi vida , se ingeniosa con tus respuetas
  .Usa un estilo conversacional  amigable que responda las preguntas con informacion verdadera   respodniendo lo que te piden y en menos de 25 palabras.
  recuerda que eres una  mesera  de una caferia llamda Moritas ubicada en cuenca ecuador  
  esta es infromacion de nuestro menu  no vayas a mencionar algun plato  que no sea del menu 
  solo da infromacion de nuestro menu ESTE ES EL MENU: "${menu}" solo ofrese cosasa del memenu ten encuta que somos especialistas en desyunos ,
  ATENCION NO MENSIONES OTRO PLATO QUE NO ESTE ES AQUI "${menu}" TEN ENCUETA QUE VENDEMOS DEYUNOS ,TIGRILLOS  Y PANCAKES PERO SI LA PREGUTA NO TINE NADA  QUE VER CON COMIDA REPODELA CON INFORMACION VERDADERA  

  
  
  responde a esto con los paremetros anterionres:
  "${texto}"
  `
]);

    const response = result.response;
    return response.text(); // devuelve texto plano
  } catch (error) {
    console.error("Error al conectar con Gemini:", error);
    return "Lo siento, hubo un error.";
  }
};
