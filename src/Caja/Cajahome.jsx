import React, { useState } from "react";
import Navar from "../utilidales/Navar";
import {
  addDoc,
  collection,
  doc,
  Timestamp,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../Firebase/Firebase";
import { useNavigate } from "react-router-dom";

const Cajahome = () => {
  const pedidosListos = JSON.parse(localStorage.getItem("pedidosListos")) || [];
  const paymentData = JSON.parse(localStorage.getItem("paymentData")) || {};
  const pedidosRealizados =
    JSON.parse(localStorage.getItem("pedidosRealizados")) || [];

  const [compras, setCompras] = useState(() => {
    const comprasGuardadas = localStorage.getItem("compras");
    return comprasGuardadas ? JSON.parse(comprasGuardadas) : [];
  });
  const navigate = useNavigate();

  // ✅ Calcular totales generales
  const totalCompras = compras.reduce((acc, compra) => acc + compra.valor, 0);
  const totalVentas = pedidosRealizados.reduce((acc, pedido) => {
    const precio = parseFloat(pedido.precioVenta) || 0;
    return acc + precio;
  }, 0);

  // ✅ Totales separados por tipo de pago
  const totalTransferencias = pedidosRealizados
    .filter((p) => p.tipoPago === "transferencia")
    .reduce((acc, p) => acc + (parseFloat(p.precioVenta) || 0), 0);

  const totalEfectivo = pedidosRealizados
    .filter((p) => p.tipoPago === "efectivo")
    .reduce((acc, p) => acc + (parseFloat(p.precioVenta) || 0), 0);

  const totalCaja = totalVentas - totalTransferencias;

  // ✅ Guardar en Firebase y borrar localStorage
  const [cargaDOFIN, setcargaDOFIN] = useState(false);

  const finalizarDia = async () => {
    setcargaDOFIN(true);

    try {
      const userDocRef = doc(db, "usuarios", "principamorasadmi@moritas.com");
      const ordersRef = collection(userDocRef, "fndia");

      const resumen = {
        fecha: new Date().toLocaleDateString("es-EC"),
        timestamp: Timestamp.now(),
        totalVentas,
        totalCompras,
        totalCaja,
        totalTransferencias,
        totalEfectivo,
        listadecomparas: compras,

        pedidoslocal: pedidosRealizados,
      };

      await addDoc(ordersRef, resumen);

      localStorage.removeItem("pedidosListos");
      localStorage.removeItem("paymentData");
      localStorage.removeItem("compras");
      localStorage.removeItem("pedidosRealizados");

      alert("✅ Día finalizado y guardado en Firebase 🚀");

      // Enviar mensaje de WhatsApp con el resumen
      const mensaje = `✅ *DÍA FINALIZADO*\n\n📅 Fecha: ${new Date().toLocaleDateString("es-EC")}\n\n💰 Total Ventas: $${totalVentas.toFixed(2)}\n🟢 Efectivo: $${totalEfectivo.toFixed(2)}\n🔵 Transferencias: $${totalTransferencias.toFixed(2)}\n💼 Total en Caja: $${totalCaja.toFixed(2)}`;
      const numeroWhatsApp = "593963200325"; // Cambia por tu número
      const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
      window.open(urlWhatsApp, "_blank");
    } catch (error) {
      console.error("❌ Error guardando en Firebase:", error);
      alert("Hubo un error al guardar el resumen en Firebase.");
    } finally {
      setcargaDOFIN(false);
      navigate(`/`);
    }
  };

  return (
    <section className="contfllhomecaja">
      <article className="HEDER">
        <img
          className="LOGOIMG"
          src="https://res.cloudinary.com/db8e98ggo/image/upload/v1731124196/Que_esperas_._dqfhgg.png"
          alt=""
        />
      </article>

      <div className="contecajfu">
        <div className="contedatscajas">
          <h2 className="totlcaja">Caja</h2>

          <h3 className="cajahome-subtitle cajahome-total">
            💰 Total de Ventas: ${totalVentas.toFixed(2)}
          </h3>

          <h4 className="cajahome-subtitle cajahome-total">
            🔵 Total por Transferencias: ${totalTransferencias.toFixed(2)}
          </h4>

          <h4 className="cajahome-subtitle cajahome-total">
            🟢 Total en Efectivo: ${totalEfectivo.toFixed(2)}
          </h4>

          <h3 className="cajahome-subtitle cajahome-total caja">
            💼 Total en Caja: ${totalCaja.toFixed(2)}
          </h3>
        </div>

        <ul className="cajahome-pedidos">
          {pedidosRealizados.map((pedido, index) => (
            <li key={index} className="cajahome-pedido-item">
              <strong>{pedido.nombre}</strong> - ${pedido.precioVenta}{" "}
              <em>({pedido.tipoPago || "sin tipo"})</em>
            </li>
          ))}
        </ul>

        {pedidosRealizados.length === 0 && (
          <p className="nopedidos">No hay pedidos realizados todavía.</p>
        )}
      </div>

      <div>
        {cargaDOFIN ? (
          <p className="cajahomebutton">Procesando...</p>
        ) : (
          <button onClick={finalizarDia} className="cajahomebutton">
            Finalizar día
          </button>
        )}
      </div>

      <Navar />
    </section>
  );
};

export default Cajahome;
