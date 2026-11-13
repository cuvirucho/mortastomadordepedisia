// Sincroniza los pedidos de cada mesa (localStorage `mesa{n}`) con Firestore `pedidos/mesa{n}`.
// localStorage sigue siendo lo que leen los componentes; Firebase es el respaldo/fuente remota.
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./Firebase";

export const EVENTO_MESAS = "mesas-actualizadas";

const keyMesa = (n) => `mesa${n}`;
const keySync = (n) => `fbsync_mesa${n}`; // "1" = ya está en Firebase
const keyPend = (n) => `fbpend_mesa${n}`; // "save" | "delete" = escritura sin confirmar

const refMesa = (n) => doc(db, "pedidos", `mesa${n}`);

const leerLocal = (n) => {
  try {
    const data = JSON.parse(localStorage.getItem(keyMesa(n)));
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
};

const avisar = () => window.dispatchEvent(new Event(EVENTO_MESAS));

export const guardarPedidoMesa = (numero, items, esNuevo = false) => {
  localStorage.setItem(keyPend(numero), "save");
  const limpio = JSON.parse(JSON.stringify(items || []));
  const data = {
    mesa: String(numero),
    items: limpio,
    actualizadoEn: serverTimestamp(),
  };
  if (esNuevo) data.hora = serverTimestamp();

  return setDoc(refMesa(numero), data, { merge: true })
    .then(() => {
      if (localStorage.getItem(keyPend(numero)) === "save") {
        localStorage.removeItem(keyPend(numero));
      }
      localStorage.setItem(keySync(numero), "1");
    })
    .catch((e) => console.error("❌ Error guardando pedido de mesa:", e));
};

export const eliminarPedidoMesa = (numero) => {
  localStorage.setItem(keyPend(numero), "delete");
  return deleteDoc(refMesa(numero))
    .then(() => {
      if (localStorage.getItem(keyPend(numero)) === "delete") {
        localStorage.removeItem(keyPend(numero));
      }
      localStorage.removeItem(keySync(numero));
    })
    .catch((e) => console.error("❌ Error eliminando pedido de mesa:", e));
};

const mesasLocales = () =>
  Object.keys(localStorage)
    .map((k) => /^mesa(\d+)$/.exec(k))
    .filter(Boolean)
    .map((m) => m[1]);

// Listener global: mantiene localStorage al día con Firebase.
export const escucharPedidosMesas = () => {
  let primerSnapshotServidor = true;

  return onSnapshot(
    collection(db, "pedidos"),
    (snap) => {
      // Ignorar datos de caché (pueden estar viejos u offline).
      if (snap.metadata.fromCache) return;

      let cambio = false;
      const enFirebase = new Set();

      snap.docs.forEach((d) => {
        const m = /^mesa(\d+)$/.exec(d.id);
        if (!m) return;
        const n = m[1];
        enFirebase.add(n);
        const pendiente = localStorage.getItem(keyPend(n));

        // Hay una escritura local sin confirmar: reintentar en vez de pisar el local.
        if (pendiente === "save") {
          const local = leerLocal(n);
          if (local) guardarPedidoMesa(n, local);
          return;
        }
        if (pendiente === "delete") {
          eliminarPedidoMesa(n);
          return;
        }

        const remoto = Array.isArray(d.data().items) ? d.data().items : [];
        const actualJSON = localStorage.getItem(keyMesa(n));
        const remotoJSON = JSON.stringify(remoto);
        if (actualJSON !== remotoJSON) {
          localStorage.setItem(keyMesa(n), remotoJSON);
          cambio = true;
        }
        localStorage.setItem(keySync(n), "1");
      });

      // Documentos borrados en otro dispositivo.
      snap.docChanges().forEach((c) => {
        if (c.type !== "removed") return;
        const m = /^mesa(\d+)$/.exec(c.doc.id);
        if (!m || localStorage.getItem(keyPend(m[1])) === "save") return;
        localStorage.removeItem(keyMesa(m[1]));
        localStorage.removeItem(keySync(m[1]));
        cambio = true;
      });

      // Primera vez con datos del servidor: mesas locales que no están en Firebase.
      if (primerSnapshotServidor) {
        primerSnapshotServidor = false;
        mesasLocales().forEach((n) => {
          if (enFirebase.has(n)) return;
          const pendiente = localStorage.getItem(keyPend(n));
          if (pendiente === "delete") {
            localStorage.removeItem(keyPend(n));
            return;
          }
          const local = leerLocal(n);
          const yaSincronizada = localStorage.getItem(keySync(n)) === "1";
          if (yaSincronizada && pendiente !== "save") {
            // Estaba en Firebase y se cerró en otro dispositivo.
            localStorage.removeItem(keyMesa(n));
            localStorage.removeItem(keySync(n));
            cambio = true;
          } else if (local && local.length > 0) {
            // Pedido anterior a esta función o escritura perdida: subirlo.
            guardarPedidoMesa(n, local, true);
          }
        });
      }

      if (cambio) avisar();
    },
    (e) => console.error("❌ Error escuchando pedidos de mesas:", e),
  );
};
