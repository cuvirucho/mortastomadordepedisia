import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navar from "../utilidales/Navar";
import { db } from "../Firebase/Firebase";
import { addDoc, collection, doc } from "firebase/firestore";

const Mesashome = () => {
  const { numero } = useParams();
  const navigate = useNavigate();

  const [pedido, setPedido] = useState([]);
  const [itemsSeleccionados, setItemsSeleccionados] = useState([]);
  const [pagados, setPagados] = useState([]);
  const [itemsParcial, setItemsParcial] = useState([]);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [modalParcialActivo, setModalParcialActivo] = useState(false);

  const [tipoPago, setTipoPago] = useState(null);
  const [pagosPorItem, setPagosPorItem] = useState(
    JSON.parse(localStorage.getItem("pagosPorItem")) || {}
  );

  // 🔹 nuevos estados para el modal del vuelto
  const [mostrarModalVuelto, setMostrarModalVuelto] = useState(false);
  const [montoRecibido, setMontoRecibido] = useState("");
  const [vuelto, setVuelto] = useState(0);
  const [accionPago, setAccionPago] = useState(null); // "completo" o "parcial"

  useEffect(() => {
    const data = localStorage.getItem(`mesa${numero}`);
    if (data) setPedido(JSON.parse(data));
  }, [numero]);

  useEffect(() => {
    const seleccionados =
      JSON.parse(localStorage.getItem("itemsSeleccionados")) || [];
    setItemsSeleccionados(seleccionados);

    const pagadosGuardados = JSON.parse(localStorage.getItem("pagados")) || [];
    setPagados(pagadosGuardados);
  }, []);

  const borrarMesa = () => {
    localStorage.removeItem(`mesa${numero}`);
    setPedido([]);
  };

  const borrarItem = (id) => {
    const nuevoPedido = pedido.filter((p) => p.id !== id);
    setPedido(nuevoPedido);
    localStorage.setItem(`mesa${numero}`, JSON.stringify(nuevoPedido));

    const nuevosSeleccionados = itemsSeleccionados.filter((i) => i !== id);
    setItemsSeleccionados(nuevosSeleccionados);
    localStorage.setItem(
      "itemsSeleccionados",
      JSON.stringify(nuevosSeleccionados)
    );

    const nuevosPagados = pagados.filter((i) => i !== id);
    setPagados(nuevosPagados);
    localStorage.setItem("pagados", JSON.stringify(nuevosPagados));

    const nuevosPagos = { ...pagosPorItem };
    delete nuevosPagos[id];
    setPagosPorItem(nuevosPagos);
    localStorage.setItem("pagosPorItem", JSON.stringify(nuevosPagos));
  };

  const toggleSeleccion = (id) => {
    let nuevosItems;
    if (itemsSeleccionados.includes(id)) {
      nuevosItems = itemsSeleccionados.filter((i) => i !== id);
    } else {
      nuevosItems = [...itemsSeleccionados, id];
    }
    setItemsSeleccionados(nuevosItems);
    localStorage.setItem("itemsSeleccionados", JSON.stringify(nuevosItems));
  };

  const toggleSeleccionParcial = (id) => {
    if (pagados.includes(id)) return;
    if (itemsParcial.includes(id)) {
      setItemsParcial(itemsParcial.filter((i) => i !== id));
    } else {
      setItemsParcial([...itemsParcial, id]);
    }
  };

  const totalParcial = itemsParcial.reduce((sum, id) => {
    const item = pedido.find((p) => p.id === id);
    return sum + (item?.precioVenta || 0);
  }, 0);

  // 🔹 Calcular vuelto en tiempo real
  useEffect(() => {
    const total = accionPago === "completo" ? totalPedido : totalParcial;
    const monto = parseFloat(montoRecibido);
    if (!isNaN(monto)) {
      setVuelto(monto - total);
    } else {
      setVuelto(0);
    }
  }, [montoRecibido, accionPago]);

  const confirmarPagoParcial = () => {
    if (!tipoPago) {
      alert("Selecciona un método de pago antes de confirmar.");
      return;
    }

    if (tipoPago === "efectivo") {
      setAccionPago("parcial");
      setMostrarModalVuelto(true);
      return;
    }

    confirmarPagoParcialReal();
  };

  const pagarCompleto = () => {
    if (!tipoPago) {
      alert("Selecciona un método de pago antes de continuar.");
      return;
    }

    if (tipoPago === "efectivo") {
      setAccionPago("completo");
      setMostrarModalVuelto(true);
      return;
    }

    pagarCompletoReal();
  };

  // 🔹 Procesos reales (sin el modal)
  const confirmarPagoParcialReal = () => {
    const nuevosPagados = [...pagados, ...itemsParcial];
    const nuevosPagos = { ...pagosPorItem };

    const nuevoPedido = pedido.map((item) => {
      if (itemsParcial.includes(item.id)) {
        return { ...item, tipoPago };
      }
      return item;
    });

    itemsParcial.forEach((id) => {
      nuevosPagos[id] = tipoPago;
    });

    setPagados(nuevosPagados);
    setPagosPorItem(nuevosPagos);
    setPedido(nuevoPedido);
    localStorage.setItem(`mesa${numero}`, JSON.stringify(nuevoPedido));
    localStorage.setItem("pagados", JSON.stringify(nuevosPagados));
    localStorage.setItem("pagosPorItem", JSON.stringify(nuevosPagos));

    setItemsParcial([]);
    setTipoPago(null);
    setMostrarModalPago(false);
    setModalParcialActivo(false);
  };

  const pagarCompletoReal = () => {
    const todosIds = pedido.map((p) => p.id);
    const nuevosPagos = { ...pagosPorItem };

    todosIds.forEach((id) => {
      nuevosPagos[id] = tipoPago;
    });

    const nuevoPedido = pedido.map((item) => ({
      ...item,
      tipoPago,
    }));

    setPagados(todosIds);
    setPagosPorItem(nuevosPagos);
    setPedido(nuevoPedido);
    localStorage.setItem(`mesa${numero}`, JSON.stringify(nuevoPedido));
    localStorage.setItem("pagados", JSON.stringify(todosIds));
    localStorage.setItem("pagosPorItem", JSON.stringify(nuevosPagos));

    setTipoPago(null);
    setMostrarModalPago(false);
  };

  // 🔹 Confirmar vuelto
  const confirmarVuelto = () => {
    const monto = parseFloat(montoRecibido);
    const total = accionPago === "completo" ? totalPedido : totalParcial;

    if (isNaN(monto) || monto < total) {
      alert("El monto recibido es insuficiente o inválido.");
      return;
    }

    if (accionPago === "completo") {
      pagarCompletoReal();
    } else {
      confirmarPagoParcialReal();
    }

    setMostrarModalVuelto(false);
    setMontoRecibido("");
    setVuelto(0);
  };

  const resetPagados = () => {
    setPagados([]);
    setPagosPorItem({});
    localStorage.removeItem("pagados");
    localStorage.removeItem("pagosPorItem");
  };

  const totalPedido = pedido.reduce(
    (sum, p) => sum + Number(p.precioVenta || 0),
    0
  );

  const totalPagado = pedido
    .filter((p) => pagados.includes(p.id))
    .reduce((sum, p) => sum + Number(p.precioVenta || 0), 0);

  const restante = totalPedido - totalPagado;

  const [cargaDOFIN, setcargaDOFIN] = useState(false);

  const finalizarPedido = async () => {
    if (pedido.length === 0) return;
    setcargaDOFIN(true);

    const pedidosPrevios =
      JSON.parse(localStorage.getItem("pedidosRealizados")) || [];
    const nuevosPedidos = [...pedidosPrevios, ...pedido];
    localStorage.setItem("pedidosRealizados", JSON.stringify(nuevosPedidos));

    let ingredientesPrevios =
      JSON.parse(localStorage.getItem("ingredientesAcumulados")) || [];

    let mapaIngredientes = {};
    ingredientesPrevios.forEach((ing) => {
      mapaIngredientes[ing.nombre] = {
        ...ing,
        cantidad: parseFloat(ing.cantidad),
      };
    });

    pedido.forEach((p) => {
      if (p.ingredientes) {
        p.ingredientes.forEach((ing) => {
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

    const ingredientesActualizados = Object.values(mapaIngredientes);
    localStorage.setItem(
      "ingredientesAcumulados",
      JSON.stringify(ingredientesActualizados)
    );

    try {
      const userDocRef = doc(db, "usuarios", "principamorasadmi@moritas.com");
      const ordersRef = collection(userDocRef, "orders");

      await addDoc(ordersRef, {
        pedido,
        total: totalPedido,
        mesa: numero,
        estado: "pagada",
        createdAt: new Date(),
        pagosPorItem,
      });

      borrarMesa();
      resetPagados();
      setItemsSeleccionados([]);
      localStorage.removeItem("itemsSeleccionados");

      navigate(`/`);
      alert("✅ Pedido finalizado gracias");
    } catch (error) {
      console.error("❌ Error guardando pedido en Firebase:", error);
      alert("Hubo un error al guardar en Firebase");
    } finally {
      setcargaDOFIN(false);
    }
  };

  const irafactura = () => {
    localStorage.setItem(
      "facturaActual",
      JSON.stringify({
        pedido,
        total: totalPedido,
        mesa: numero,
        pagados,
        restante,
        pagosPorItem,
      })
    );
    navigate(`/factura/${numero}`);
  };

  return (
    <div className="mesascontainerpadre">
      <article className="HEDER">
        <img
          className="LOGOIMG"
          src="https://res.cloudinary.com/db8e98ggo/image/upload/v1731124196/Que_esperas_._dqfhgg.png"
          alt=""
        />
      </article>

      <section className="pedido-sectionFULL">
        <h2 className="tilomes">Pedidos para la mesa N°{numero}</h2>

        {pedido.length > 0 ? (
          <section className="pedido-contenido">
            <ul className="lista-pedidos">
              {pedido.map((p) => (
                <li
                  key={p.id}
                  className={`pedido-item ${
                    itemsSeleccionados.includes(p.id) ? "activo" : ""
                  }`}
                  onClick={() => toggleSeleccion(p.id)}
                >
                  <div className="cotefnoypreci">
                    <p className="nobrepaltop">{p.nombre}</p>
                    <p>${p.precioVenta}</p>
                  </div>

                  {p.respuestas ? (
                    <ul className="respuestas-lista">
                      {Object.entries(p.respuestas).map(
                        ([clave, valor], idx) => (
                          <li key={idx} className="respuesta-item">
                            {clave}: {valor}
                          </li>
                        )
                      )}
                    </ul>
                  ) : p.detalle ? (
                    <div className="detalles-texto">{p.detalle}</div>
                  ) : null}

                  <button className="btnx" onClick={() => borrarItem(p.id)}>
                    X
                  </button>
                  {pagados.includes(p.id) && (
                    <div className="overlay-pagado">
                      PAGADO
                      <br />
                      <small>
                        ({p.tipoPago || pagosPorItem[p.id] || "sin tipo"})
                      </small>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <p className="total-texto">TOTAL: ${totalPedido.toFixed(2)}</p>
            <p className="total-pagado">PAGADO: ${totalPagado.toFixed(2)}</p>
            <p className="total-restante">RESTANTE: ${restante.toFixed(2)}</p>

            {restante === 0 && (
              <div>
                {cargaDOFIN ? (
                  <p className="tilomes">Procesando...</p>
                ) : (
                  <section className="contvtn">
                    <button onClick={finalizarPedido} className="btnfindpi">
                      Finalizar pedido
                    </button>

                    <button onClick={irafactura} className="btnfindpi">
                      Crear factura
                    </button>
                  </section>
                )}
              </div>
            )}

            <div className="acciones">
              <button
                className="btn agregar"
                onClick={() => setMostrarModal(true)}
              >
                Agregar más al pedido
              </button>
              <button
                className="btn pagado"
                onClick={() => setMostrarModalPago(true)}
              >
                Pagar pedido
              </button>
            </div>
          </section>
        ) : (
          <article className="pedido-vacio">
            <h3>No hay pedido para esta mesa.</h3>
            <p>Haz clic en “Agregar pedido” para comenzar.</p>
            <button className="btn" onClick={() => navigate(`/ia/${numero}`)}>
              Pedido por IA
            </button>
            <button
              className="btn"
              onClick={() => navigate(`/ordentradi/${numero}`)}
            >
              Pedido tradicional
            </button>
          </article>
        )}
      </section>

      {/* Modal de tipo de pedido */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>¿Cuál método de pedido prefieres?</h3>
            <button onClick={() => navigate(`/ia/${numero}`)}>
              Pedido por IA
            </button>
            <button onClick={() => navigate(`/ordentradi/${numero}`)}>
              Pedido tradicional
            </button>
            <button className="cerrar" onClick={() => setMostrarModal(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal 1: Elegir tipo de pago */}
      {mostrarModalPago && !tipoPago && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Seleccione el método de pago</h3>

            <button
              onClick={() => setTipoPago("transferencia")}
              style={{
                background: "#007bff07",
                color: "#fff",
              }}
            >
              Transferencia
            </button>

            <button
              onClick={() => setTipoPago("efectivo")}
              style={{
                background: "#55373704",
                color: "#fff",
                marginRight: "5px",
              }}
            >
              Efectivo
            </button>

            <button
              className="cerrar"
              onClick={() => setMostrarModalPago(false)}
              style={{ marginTop: "10px" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal 2: Elegir pago parcial o completo */}
      {mostrarModalPago && tipoPago && !modalParcialActivo && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Tipo de pago seleccionado: {tipoPago.toUpperCase()}</h3>

            <button
              onClick={() => setModalParcialActivo(true)}
              style={{ marginBottom: "8px" }}
            >
              Pago Parcial
            </button>
            <button onClick={pagarCompleto}>Pago Completo</button>
            <button
              className="cerrar"
              onClick={() => {
                setTipoPago(null);
                setMostrarModalPago(false);
                setItemsParcial([]);
              }}
              style={{ marginTop: "10px" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal 3: Pago parcial */}
      {modalParcialActivo && (
        <div className="modal-overlay">
          <div className="modal">
            <h4>Seleccione los platos a pagar ({tipoPago})</h4>
            <ul>
              {pedido.map((p) => (
                <li
                  key={p.id}
                  onClick={() => toggleSeleccionParcial(p.id)}
                  style={{
                    cursor: pagados.includes(p.id) ? "not-allowed" : "pointer",
                    opacity: pagados.includes(p.id) ? 0.5 : 1,
                    background: itemsParcial.includes(p.id) ? "#14ca3eff" : "",
                  }}
                >
                  {p.nombre} - ${p.precioVenta}{" "}
                  {pagados.includes(p.id) &&
                    ` ✅ Pagado (${pagosPorItem[p.id] || "?"})`}
                </li>
              ))}
            </ul>
            <p>Total seleccionado: ${totalParcial.toFixed(2)}</p>
            <button onClick={confirmarPagoParcial}>
              Confirmar pago parcial
            </button>
            <button
              className="cerrar"
              onClick={() => {
                setModalParcialActivo(false);
                setMostrarModalPago(false);
                setTipoPago(null);
                setItemsParcial([]);
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal 4: Ingreso de monto y cálculo de vuelto */}
      {mostrarModalVuelto && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Hay que cobrar {totalParcial ? totalParcial : totalPedido} </h3>
            <h3>
              Ingrese el monto recibido (
              {accionPago === "completo" ? "Pago completo" : "Pago parcial"})
            </h3>
            <input
              type="number"
              placeholder="Monto recibido"
              value={montoRecibido}
              onChange={(e) => setMontoRecibido(e.target.value)}
              style={{
                marginTop: "10px",

                borderRadius: "1rem",
                padding: "8px",
                border: "none",
              }}
            />
            <p style={{ marginTop: "10px", padding: "6px" }}>
              <strong>
                Vuelto: $
                {vuelto >= 0
                  ? vuelto.toFixed(2)
                  : "Monto insuficiente o inválido"}
              </strong>
            </p>
            <button onClick={confirmarVuelto}>Confirmar</button>
            <button
              className="cerrar"
              onClick={() => {
                setMostrarModalVuelto(false);
                setMontoRecibido("");
                setVuelto(0);
              }}
              style={{ marginTop: "10px" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <Navar />
    </div>
  );
};

export default Mesashome;
