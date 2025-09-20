// constantes.js
export const catalogo = {
  croissant: [],
   jugo: ["naranja", "mora", "piña"],
   té: ["negro", "verde", "manzanilla"],
  agua: [], pan: [], 
  cafe: [],

};



/*DIRMBRA DE PALTPOS*/






 export const platosComplejos = {
 
  "desayuno americano": {
    descripcion: "Incluye huevos a tu gusto, café y jugo natural.",
    alias: ["americano"],
    items: ["huevos", "café", "jugo"],
    preguntas: {
      huevos: "¿Cómo quieres tus huevos? Revueltos, fritos o tibios.",
      bebida: "¿Qué tipo de café prefieres? Tinto, filtrado o con leche.",
      jugo: "¿Qué jugo deseas? Naranja, mora o piña."
    
    },
    etiquetas: ["llenador","rápido","completo"]

  },

  "desayuno continental": {
    descripcion: "Trae pan recién horneado, una bebida caliente y fruta fresca.",
       alias: [ "continental"],
    items: ["pan", "bebida", "fruta"],
    preguntas: {
      pan: "¿Qué tipo de pan prefieres? Croissant, integral o blanco.",
      bebida: "¿Qué bebida deseas? Café, té o jugo.",
      fruta: "¿Qué fruta deseas? Papaya, sandía o melón."
    },
    etiquetas: ["ligero", "rápido"]
  },
  "desayuno vegetariano": {
    descripcion: "Compuesto por un batido saludable, hummus casero y ensalada.",
    alias: ["vegetariano"],
    items: ["batido", "hummus", "ensalada"],
    preguntas: {
      batido: "¿Qué batido prefieres? Verde, de frutas o de avena.",
      hummus: "¿Deseas hummus clásico, con pimiento o con ajo?",
      ensalada: "¿Qué tipo de ensalada deseas? Mixta, de quinoa o de garbanzos."
    },
    etiquetas: ["Saludable", "Completo", "Vegetariano", "Fitness"]
  },
  "desayuno infantil": {
    descripcion: "Ideal para niños: panqueques, leche y fruta dulce.",
     alias: ["infantil", "niños", "kids","infantiles",],
    items: ["panqueques", "leche", "fruta"],
    preguntas: {
      panqueques: "¿Con qué quieres tus panqueques? Miel, chocolate o mermelada.",
      leche: "¿Qué leche prefieres? Entera, deslactosada o de almendra.",
      fruta: "¿Qué fruta quieres? Banana, fresa o uvas."
    },
    etiquetas: ["Dulce", "Niños", "Completo", "Rápido"]
  }
};























/*FIN DE SIBRA*/









































export const frasesOrden = [
    "quiero ordenar", 
    "voy a ordenar",
    "voy a pedir",
    "quiero un",
    "quiero",
     "me gustaría pedir",
     "me gustaría un",
     "dame un",
     "quisiera un",
      "quiero pedir",
      "quisiera ordenar",
      "ordenare",
      "quiere un",
      "sirveme",
      "quiero",
  "ordenar",
  "tráeme",
"prefiero",
  "ponme",
  "mejor dame",
  "mejor tráeme",
  "me antoja",
  "voy con",
  "me gustaría pedir",
  "pediré",
  "dame el",
  "tráeme el",
  "ayúdame con un",
  "dame un "
  ];

  // 🔍 Frases que indican que el cliente quiere saber qué hayqw
 export const frasesConsultaMenu = [
  "qué hay en el menú", "qué tienen", "qué ofrecen", 
  "qué puedo pedir",
  "qué menú",
  "qué menu",
  "dime el menu",
   "cuáles son los platos",
   "cuál es el menu de hoy",
   "cuál es el menu",
   "menu",
   "el menú de moritas por favor",
   "el menú",
   "qué tienes en el menú",
   "quisiera saber que tienes en el menú",
   "qué nomás hay",
   "qué hay",
   "qué hay en el menu",
   "qué desayunos tienes para hoy",
   "qué me puedes ofrecer del menú",
   "qué desayunos tienen",
   "qué tienenes"
];


  




export const frasesContenidoPlato = [
  "qué contiene", "qué trae",   "que trae",  "qué incluye", "que incluye",  "qué lleva","que lleva", "qué tiene", "que tiene" ,"qué va", "que va" , "cuentame mas","qué llave","que lleve"
];


export const frasesNegativas = ["no", "mejor no", "no gracias","cambia" ];

export  const frasesAfirmativas = ["sí","si", "claro", "correcto", "así es",  "lo quiero", "quiero", "dale", "ok", "está bien","me gusta ese","s","claro"];


export const frasesRecomendacion = [
  "recomiéndame algo",
  "recomiéndame",
  "qué me sugieres",
  "qué me recomiendas",
  "sorpréndeme",
  "no sé qué pedir"
];
