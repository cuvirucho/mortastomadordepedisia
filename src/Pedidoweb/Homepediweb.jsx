import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { db } from "../Firebase/Firebase";
import { Html5Qrcode } from "html5-qrcode";

const Homepediweb = () => {
  const [pedidos, setPedidos] = useState([]);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [searchId, setSearchId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [filtro, setFiltro] = useState("aprobados"); // 👈 por defecto aprobados
  const userEmail = "principamorasadmi@moritas.com";
  const [bntpdilis, setbntpdilis] = useState(true);

  const [pedidosListos, setPedidosListos] = useState(() => {
    // Cargar del localStorage al iniciar
    const saved = localStorage.getItem("pedidosListos");
    return saved ? JSON.parse(saved) : {};
  });

  /*PEDIOS LISOTAS*/

  const marcarPedidoListo = (pedidoId, pedidoData) => {
    const updated = { ...pedidosListos, [pedidoId]: true };
    setPedidosListos(updated);
    localStorage.setItem("pedidosListos", JSON.stringify(updated));

    // Aquí puedes hacer algo con pedidoData si lo necesitas
    setbntpdilis(false);
    ingedyresusa(pedidoData);
  };

  /*INGEDIENTE USADOS  */

  const ingedyresusa = (pedido) => {
    // --- Guardar ingredientes acumulados ---
    let ingredientesPrevios =
      JSON.parse(localStorage.getItem("ingredientesAcumulados")) || [];

    let mapaIngredientes = {};
    ingredientesPrevios.forEach((ing) => {
      mapaIngredientes[ing.nombre] = {
        ...ing,
        cantidad: parseFloat(ing.cantidad),
      };
    });

    // 👇 ahora recorremos el carrito de un solo pedido
    if (pedido.cart) {
      pedido.cart.forEach((item) => {
        if (item.ingredientes) {
          item.ingredientes.forEach((ing) => {
            const nombre = ing.nombre;
            const cantidad = parseFloat(ing.cantidad);

            if (!mapaIngredientes[nombre]) {
              mapaIngredientes[nombre] = { ...ing, cantidad };
            } else {
              mapaIngredientes[nombre].cantidad += cantidad;
            }
          });
        }
      });
    }

    const ingredientesActualizados = Object.values(mapaIngredientes);
    localStorage.setItem(
      "ingredientesAcumulados",
      JSON.stringify(ingredientesActualizados),
    );
  };

  // Calcular inicio y fin del día
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // 00:00:00
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1); // 00:00:00 del día siguiente

  // Cargar pedidos desde Firestore
  useEffect(() => {
    const q = query(
      collection(db, "usuarios", userEmail, "orders"),
      where("createdAt", ">=", Timestamp.fromDate(hoy)),
      where("createdAt", "<", Timestamp.fromDate(manana)),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedPedidos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPedidos(updatedPedidos);
      localStorage.setItem("paymentData", JSON.stringify(updatedPedidos));
    });

    return () => unsubscribe();
  }, []);

  // Filtrar por ID + tipo de filtro (aprobados o entregados)
  const pedidosFiltrados = pedidos.filter((pedido) => {
    const matchesSearch = (pedido?.payphoneResponse?.transactionId || "")
      .toString()
      .includes(searchId.trim());

    if (filtro === "aprobados") {
      return (
        matchesSearch &&
        pedido?.payphoneResponse?.transactionStatus === "Approved" &&
        !pedido.entregado
      );
    }
    if (filtro === "entregados") {
      return matchesSearch && pedido.entregado === true;
    }
    return matchesSearch;
  });

  // 🚨 Detectar cambio en la cantidad de pedidos filtrados

  // 🔊 referencia al audio
  const audioRef = useRef(null);

  // Guardar el último length
  const lastLengthRef = useRef(0);

  useEffect(() => {
    // Filtrar solo pedidos aprobados y no entregados
    const aprobadosNoEntregados = pedidos.filter(
      (p) =>
        p.payphoneResponse?.transactionStatus === "Approved" && !p.entregado,
    );

    if (
      lastLengthRef.current !== 0 &&
      aprobadosNoEntregados.length > lastLengthRef.current
    ) {
      if (audioRef.current) {
        audioRef.current
          .play()
          .catch((err) => console.warn("No se pudo reproducir el audio:", err));
      }
    }

    lastLengthRef.current = aprobadosNoEntregados.length;
  }, [pedidos]); // 🔹 observa solo pedidos

  // Escaneo QR (sin cambios)
  useEffect(() => {
    if (!scanning) return;

    const html5QrCode = new Html5Qrcode("qr-reader");

    html5QrCode
      .start(
        { facingMode: "environment" },
        { fps: 2, qrbox: 250 },
        async (decodedText) => {
          const pedidoEncontrado = pedidos.find(
            (p) =>
              p.payphoneResponse?.transactionId === decodedText ||
              p.retiroCode === decodedText,
          );

          if (pedidoEncontrado) {
            const pedidoRef = doc(
              db,
              "usuarios",
              userEmail,
              "orders",
              pedidoEncontrado.id,
            );
            await updateDoc(pedidoRef, { entregado: true });

            console.log(pedidoEncontrado);

            alert(
              `Pedido de ${pedidoEncontrado.form.nombrecliente} marcado como entregado ✅`,
            );
          } else {
            alert("Pedido no encontrado ❌");
          }

          await html5QrCode.stop();
          setScanning(false);
        },
        () => {},
      )
      .catch((err) => {
        console.error("No se pudo iniciar el escaneo:", err);
        setScanning(false);
      });

    return () => {
      if (html5QrCode.getState() === 2) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, [scanning]);

  console.log(selectedPedido);

  return (
    <div className="contfulpediwqeb">
      {/* 🎵 el audio oculto */}
      <audio ref={audioRef} src="public/timbre.mp3" preload="auto" />

      <h1 className="titulo">Pedidos web</h1>

      {/* búsqueda */}
      <div className="busquedacontainer">
        <input
          type="text"
          placeholder="Buscar por ID..."
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="busquedainput"
        />

        <button
          className="tipobtn"
          onClick={async () => {
            if (scanning) {
              try {
                const html5QrCode = new Html5Qrcode("qr-reader");
                if (html5QrCode.getState() === 2) {
                  await html5QrCode.stop();
                }
              } catch (err) {
                console.error("Error al cancelar escaneo:", err);
              }
              // 🔴 oculta el lector
              document.getElementById("qr-reader").innerHTML = "";
              setScanning(false);
            } else {
              setScanning(true);
            }
          }}
        >
          {scanning ? "❌ Cancelar" : "Entregar pedido"}
        </button>
      </div>

      {scanning && (
        <div id="qr-reader" style={{ width: "300px", marginTop: "20px" }}></div>
      )}

      {/* menú de filtros */}
      <div className="menu-tipos">
        <button
          className={`tipobtn ${filtro === "aprobados" ? "btnactivos" : ""}`}
          onClick={() => setFiltro("aprobados")}
        >
          Aprobados
        </button>

        <button
          className={`tipobtn ${filtro === "entregados" ? "btnactivos" : ""}`}
          onClick={() => setFiltro("entregados")}
        >
          Entregados
        </button>
      </div>

      {/* lista pedidos */}
      {pedidosFiltrados.length === 0 ? (
        <p className="sin-pedidos">No se encontraron pedidos 🚫</p>
      ) : (
        <div className="pedconte">
          {pedidosFiltrados.map((pedido) => (
            <div
              key={pedido.id}
              className="pedido-card"
              style={{
                backgroundColor: pedidosListos[pedido.id]
                  ? "#f3e3f7ff"
                  : "white", // Verde si está listo
              }}
            >
              <div className="pedido-header">
                <h2 className="idepdi">
                  ID: {pedido?.payphoneResponse?.transactionId || "N/A"}
                </h2>
                <span
                  className={`estado ${
                    pedido.entregado
                      ? "entregado"
                      : pedido?.payphoneResponse?.transactionStatus ===
                          "Approved"
                        ? "aprobado"
                        : "pendiente"
                  }`}
                >
                  {pedido.entregado
                    ? "✅ Entregado"
                    : pedido?.payphoneResponse?.transactionStatus ||
                      "Pendiente"}
                </span>
              </div>

              {/* Etiqueta Para llevar / Para retirar */}
              <div className="tipo-entrega">
                <span
                  className={`etiqueta-entrega ${pedido.coords ? "para-llevar" : "para-retirar"}`}
                >
                  {pedido.coords ? "🛵 Para llevar" : "🏪 Para retirar"}
                </span>
              </div>

              <div className="pedido-info">
                <p className="igopditex">
                  <strong>Pedido para:</strong>{" "}
                  {pedido?.form?.nombrecliente || "N/A"}
                </p>
              </div>

              <button
                className="btn-ver-mas"
                onClick={() => setSelectedPedido(pedido)}
              >
                Ver más
              </button>
            </div>
          ))}
        </div>
      )}

      {/* modal detalles */}
      {selectedPedido && (
        <div className="modal-overlay" onClick={() => setSelectedPedido(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="titulo">Detalles del Pedido</h2>
            <p className="modal-contentp">
              <strong>Cliente:</strong>{" "}
              {selectedPedido?.payphoneResponse?.optionalParameter4}
            </p>
            <p className="modal-contentp">
              <strong>Email:</strong> {selectedPedido?.payphoneResponse?.email}
            </p>
            <p className="modal-contentp">
              <strong>Teléfono:</strong>{" "}
              {selectedPedido?.payphoneResponse?.phoneNumber}
            </p>
            <p className="modal-contentp">
              <strong>Retiro Code:</strong> {selectedPedido.retiroCode}
            </p>

            {/* Tipo de entrega */}
            <div className="tipo-entrega-modal">
              <span
                className={`etiqueta-entrega-modal ${selectedPedido.coords ? "para-llevar" : "para-retirar"}`}
              >
                {selectedPedido.coords
                  ? "🛵 Para llevar (Delivery)"
                  : "🏪 Para retirar en local"}
              </span>
            </div>

            {/* Dirección y botón Google Maps si tiene coords */}
            {selectedPedido.coords && (
              <div className="coords-section">
                <p className="modal-contentp">
                  <strong>📍 Dirección:</strong> {selectedPedido.coords.address}
                </p>
                <button
                  className="btn-google-maps"
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps?q=${selectedPedido.coords.lat},${selectedPedido.coords.lng}`,
                      "_blank",
                    )
                  }
                >
                  🗺️ Abrir en Google Maps
                </button>
              </div>
            )}

            <p className="modal-contentp">
              <strong>Estado:</strong>{" "}
              {selectedPedido.entregado
                ? "✅ Entregado"
                : selectedPedido?.payphoneResponse?.transactionStatus}
            </p>
            <p className="modal-contentp">
              <strong>Monto:</strong> ${selectedPedido.amount / 100}
            </p>
            <p className="modal-contentp">
              <strong>Fecha:</strong>{" "}
              {new Date(
                selectedPedido?.payphoneResponse?.date,
              ).toLocaleString()}
            </p>

            <h3 className="modal-contenth3">🛒 Productos</h3>
            <ul className="modal-contentul">
              {selectedPedido.cart?.map((item, i) => (
                <li className="modal-contentli" key={i}>
                  <p className="cantioprod">{item.nombre}</p>
                  <p className="cantioprod">cantidad:{item.cantidad}</p>
                  {item.opciones && (
                    <ul className="optiex">
                      {Object.entries(item.opciones).map(([key, value], j) => (
                        <li className="optiex" key={j}>
                          <strong>{key}:</strong> {value}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>

            <div className="CONTEPEDIBTN">
              <button
                className="btn-cerrar"
                onClick={() => setSelectedPedido(null)}
              >
                Cerrar
              </button>

              {bntpdilis ? (
                <button
                  className="btn-cerrar"
                  onClick={() => {
                    marcarPedidoListo(selectedPedido.id, selectedPedido); // 🔹 marcar como listo
                    setSelectedPedido(null); // cerrar modal
                  }}
                >
                  Llamar al delivey
                </button>
              ) : (
                <button
                  className="btn-cerrar"
                  onClick={() => {
                    marcarPedidoListo(selectedPedido.id, selectedPedido); // 🔹 marcar como listo
                    setSelectedPedido(null); // cerrar modal
                  }}
                >
                  Pedido listo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homepediweb;
