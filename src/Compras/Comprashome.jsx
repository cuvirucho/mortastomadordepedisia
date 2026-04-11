import React, { useState, useEffect } from "react";
import Navar from "../utilidales/Navar";
import { doc, getDoc, updateDoc, collection, addDoc } from "firebase/firestore";
import { db } from "../Firebase/Firebase";

const Comprashome = () => {
  const [productosBajoStock, setProductosBajoStock] = useState([]);
  const [todosProductos, setTodosProductos] = useState([]);
  const [listaCompras, setListaCompras] = useState(() => {
    const guardada = localStorage.getItem("listaComprasDelDia");
    return guardada ? JSON.parse(guardada) : [];
  });
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [sincronisarbodega, setSincronisarbodega] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState(null);
  const [nuevaCantidad, setNuevaCantidad] = useState("");
  const [guardando, setGuardando] = useState(false);

  const obtenerFechaHoy = () => {
    const hoy = new Date();
    return hoy.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  useEffect(() => {
    localStorage.setItem("listaComprasDelDia", JSON.stringify(listaCompras));
  }, [listaCompras]);

  useEffect(() => {
    const cargarBodega = async () => {
      try {
        setLoading(true);
        const productoDocRef = doc(
          db,
          "usuarios",
          "principamorasadmi@moritas.com",
          "Bodega",
          "ProductosDeComida",
        );

        const docSnap = await getDoc(productoDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          const productosArray = Object.entries(data).map(
            ([nombre, datos]) => ({
              nombre,
              ...datos,
            }),
          );

          const productosFiltrados = productosArray.filter((producto) => {
            const existente = parseFloat(producto.cantidadExistente) || 0;
            const minima = parseFloat(producto.cantidadMinima) || 0;
            return existente <= minima;
          });

          setTodosProductos(productosArray);
          setProductosBajoStock(productosFiltrados);
        }
      } catch (error) {
        console.error("Error cargando bodega:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarBodega();
  }, []);

  const agregarALista = (producto) => {
    const yaExiste = listaCompras.some(
      (item) => item.codigoUnico === producto.codigoUnico,
    );

    if (!yaExiste) {
      const itemCompra = {
        ...producto,
        fechaAgregado: new Date().toISOString(),
        cantidadSugerida:
          parseFloat(producto.cantidadMaxima) -
            parseFloat(producto.cantidadExistente) || 0,
      };
      setListaCompras([...listaCompras, itemCompra]);
    }
  };

  const quitarDeLista = (codigoUnico) => {
    setListaCompras(
      listaCompras.filter((item) => item.codigoUnico !== codigoUnico),
    );
  };

  const enviarLista = async () => {
    if (listaCompras.length === 0) {
      alert("La lista está vacía");
      return;
    }

    setEnviando(true);

    try {
      const listaParaEnviar = {
        fecha: new Date().toISOString(),
        productos: listaCompras,
        total: listaCompras.length,
      };

      // Guardar en Firebase - colección "ListasDeCompras"
      const listasRef = collection(
        db,
        "usuarios",
        "principamorasadmi@moritas.com",
        "ListasDeCompras",
      );
      await addDoc(listasRef, listaParaEnviar);

      console.log("Lista enviada:", listaParaEnviar);
      alert("✅ Lista de compras enviada exitosamente");

      setListaCompras([]);
    } catch (error) {
      console.error("Error enviando lista:", error);
      alert("Error al enviar la lista");
    } finally {
      setEnviando(false);
    }
  };

  const estaEnLista = (codigoUnico) => {
    return listaCompras.some((item) => item.codigoUnico === codigoUnico);
  };

  // Filtrar productos por búsqueda
  const productosFiltradosBusqueda = todosProductos.filter((producto) =>
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase()),
  );

  // Función para actualizar cantidad existente
  const actualizarCantidadExistente = async (producto) => {
    if (nuevaCantidad === "" || isNaN(parseFloat(nuevaCantidad))) {
      alert("Ingresa una cantidad válida");
      return;
    }

    setGuardando(true);

    try {
      const productoDocRef = doc(
        db,
        "usuarios",
        "principamorasadmi@moritas.com",
        "Bodega",
        "ProductosDeComida",
      );

      // Actualizar en Firebase
      await updateDoc(productoDocRef, {
        [`${producto.nombre}.cantidadExistente`]: nuevaCantidad,
      });

      // Actualizar en estado local
      const actualizarLista = (lista) =>
        lista.map((p) =>
          p.codigoUnico === producto.codigoUnico
            ? { ...p, cantidadExistente: nuevaCantidad }
            : p,
        );

      setTodosProductos(actualizarLista(todosProductos));

      // Recalcular bajo stock
      const nuevoBajoStock = actualizarLista(todosProductos).filter((p) => {
        const existente = parseFloat(p.cantidadExistente) || 0;
        const minima = parseFloat(p.cantidadMinima) || 0;
        return existente <= minima;
      });
      setProductosBajoStock(nuevoBajoStock);

      setEditando(null);
      setNuevaCantidad("");
      alert("✅ Cantidad actualizada");
    } catch (error) {
      console.error("Error actualizando cantidad:", error);
      alert("Error al actualizar");
    } finally {
      setGuardando(false);
    }
  };

  const iniciarEdicion = (producto) => {
    setEditando(producto.codigoUnico);
    setNuevaCantidad(producto.cantidadExistente?.toString() || "0");
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setNuevaCantidad("");
  };

  return (
    <section className="contfllhomevop">
      {sincronisarbodega ? (
        <div className="containercopras">
          <article className="HEDER">
            <img
              className="LOGOIMG"
              src="https://res.cloudinary.com/db8e98ggo/image/upload/v1731124196/Que_esperas_._dqfhgg.png"
              alt=""
            />
          </article>

          <button
            style={{
              width: "50%",
              height: "2rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "15px",
              borderRadius: "25px",
              border: "none",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
            }}
            onClick={() => setSincronisarbodega(false)}
          >
            <p
              style={{
                textAlign: "center",
                color: "blueviolet",

                width: "100%",
              }}
            >
              Ver compras
            </p>
          </button>

          <div className="cardcopras">
            <h2 className="titlecopras">📦 Bodega ({todosProductos.length})</h2>

            {/* Buscador */}
            <input
              type="text"
              className="inputCOP"
              placeholder="🔍 Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ marginBottom: "15px" }}
            />

            {loading ? (
              <p style={{ textAlign: "center", color: "blueviolet" }}>
                Cargando productos...
              </p>
            ) : productosFiltradosBusqueda.length === 0 ? (
              <p style={{ textAlign: "center", color: "blueviolet" }}>
                No se encontraron productos
              </p>
            ) : (
              <div
                style={{
                  maxHeight: "60vh",
                  overflowY: "auto",
                  paddingRight: "5px",
                }}
              >
                {productosFiltradosBusqueda.map((producto) => {
                  const existente = parseFloat(producto.cantidadExistente) || 0;
                  const minima = parseFloat(producto.cantidadMinima) || 0;
                  const esBajoStock = existente <= minima;

                  return (
                    <div
                      key={producto.codigoUnico || producto.nombre}
                      style={{
                        background: esBajoStock
                          ? "rgba(220, 53, 69, 0.15)"
                          : "rgba(138, 43, 226, 0.1)",
                        borderRadius: "10px",
                        padding: "12px",
                        marginBottom: "10px",
                        border: esBajoStock
                          ? "1px solid rgba(220, 53, 69, 0.4)"
                          : "1px solid rgba(138, 43, 226, 0.3)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: "150px" }}>
                          <p
                            style={{
                              fontWeight: "bold",
                              color: "blueviolet",
                              fontSize: "1.1rem",
                              marginBottom: "5px",
                            }}
                          >
                            {producto.nombre}
                            {esBajoStock && " ⚠️"}
                          </p>
                          <p
                            style={{
                              color: esBajoStock ? "#dc3545" : "blueviolet",
                              fontSize: "0.85rem",
                            }}
                          >
                            Stock: {producto.cantidadExistente || 0}{" "}
                            {producto.unidadDeMedida} | Mín:{" "}
                            {producto.cantidadMinima}
                          </p>
                        </div>

                        {editando === producto.codigoUnico ? (
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            <input
                              type="number"
                              className="inputCOP"
                              value={nuevaCantidad}
                              onChange={(e) => setNuevaCantidad(e.target.value)}
                              style={{
                                width: "80px",
                                padding: "8px",
                                textAlign: "center",
                              }}
                              autoFocus
                            />
                            <button
                              className="btnacop"
                              onClick={() =>
                                actualizarCantidadExistente(producto)
                              }
                              disabled={guardando}
                              style={{
                                backgroundColor: "#28a745",
                                padding: "8px 12px",
                              }}
                            >
                              {guardando ? "..." : "✓"}
                            </button>
                            <button
                              className="btnacop"
                              onClick={cancelarEdicion}
                              style={{
                                backgroundColor: "#dc3545",
                                padding: "8px 12px",
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btnacop"
                            onClick={() => iniciarEdicion(producto)}
                            style={{ padding: "8px 15px" }}
                          >
                            ✏️ Editar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="containercopras">
          <article className="HEDER">
            <img
              className="LOGOIMG"
              src="https://res.cloudinary.com/db8e98ggo/image/upload/v1731124196/Que_esperas_._dqfhgg.png"
              alt=""
            />
          </article>

          <button
            style={{
              width: "50%",
              height: "2rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "15px",
              borderRadius: "25px",
              border: "none",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
            }}
            onClick={() => setSincronisarbodega(true)}
          >
            <p
              style={{
                textAlign: "center",
                color: "blueviolet",

                width: "100%",
              }}
            >
              Actualizar bodega
            </p>
          </button>

          {/* Sección bajo stock */}
          <div className="cardcopras">
            <h2 className="titlecopras">
              ⚠️ Bajo Stock ({productosBajoStock.length})
            </h2>

            {loading ? (
              <p style={{ textAlign: "center", color: "blueviolet" }}>
                Cargando productos...
              </p>
            ) : productosBajoStock.length === 0 ? (
              <p style={{ textAlign: "center", color: "blueviolet" }}>
                ✅ Todos los productos tienen stock suficiente
              </p>
            ) : (
              <div className="contelistacop">
                <ul className="listascop">
                  {productosBajoStock.map((producto) => (
                    <li
                      key={producto.codigoUnico || producto.nombre}
                      className="compraitem"
                    >
                      <div className="conteitemcop">
                        <p style={{ fontWeight: "bold", marginBottom: "5px" }}>
                          {producto.nombre}
                        </p>

                        {estaEnLista(producto.codigoUnico) ? (
                          <button
                            className="btnacop"
                            style={{
                              marginTop: "10px",
                              backgroundColor: "#28a745",
                              cursor: "default",
                            }}
                            disabled
                          >
                            ✓ En lista
                          </button>
                        ) : (
                          <button
                            className="btnacop"
                            style={{ marginTop: "10px" }}
                            onClick={() => agregarALista(producto)}
                          >
                            ➕ Enviar a lista de compras
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sección lista de compras */}
          <div className="cardcopras2">
            <h2 className="titlecopras">
              🛒 Lista de Compras ({listaCompras.length})
            </h2>
            <p
              style={{
                textAlign: "center",
                color: "blueviolet",
                marginBottom: "15px",
                fontSize: "0.9rem",
              }}
            >
              📅 {obtenerFechaHoy()}
            </p>

            {listaCompras.length === 0 ? (
              <p style={{ textAlign: "center", color: "blueviolet" }}>
                🛒 No hay productos en la lista
              </p>
            ) : (
              <>
                <div className="contelistacop">
                  <ul className="listascop">
                    {listaCompras.map((item) => (
                      <li key={item.codigoUnico} className="compraitem">
                        <button
                          className="btnelincpo"
                          onClick={() => quitarDeLista(item.codigoUnico)}
                        >
                          ❌
                        </button>
                        <div className="conteitemcop">
                          <p style={{ fontWeight: "bold" }}>{item.nombre}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="contebtnaogbto">
                  <button
                    className="btnacop"
                    onClick={enviarLista}
                    disabled={enviando}
                    style={{
                      backgroundColor: enviando ? "#6c757d" : "#28a745",
                      width: "100%",
                    }}
                  >
                    {enviando ? "Enviando..." : "📤 Enviar Lista"}
                  </button>
                </div>
              </>
            )}
          </div>

          <h3 className="totlcop">Total productos: {listaCompras.length}</h3>
        </div>
      )}

      <Navar />
    </section>
  );
};

export default Comprashome;
