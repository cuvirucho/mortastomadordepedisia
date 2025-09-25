import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navar from '../utilidales/Navar';
import { db } from '../Firebase/Firebase';
import { addDoc, collection, doc } from 'firebase/firestore';

const Mesashome = () => {
  const { numero } = useParams();
  const navigate = useNavigate();

  const [pedido, setPedido] = useState([]);
  const [itemsSeleccionados, setItemsSeleccionados] = useState([]); // ids de items seleccionados
  const [pagados, setPagados] = useState([]); // ids de items pagados
  const [itemsParcial, setItemsParcial] = useState([]); // ids para pago parcial

  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [modalParcialActivo, setModalParcialActivo] = useState(false);

  // Cargar pedido desde localStorage
  useEffect(() => {
    const data = localStorage.getItem(`mesa${numero}`);
    if (data) setPedido(JSON.parse(data));
  }, [numero]);

  // Cargar itemsSeleccionados y pagados
  useEffect(() => {
    const seleccionados = JSON.parse(localStorage.getItem("itemsSeleccionados")) || [];
    setItemsSeleccionados(seleccionados);

    const pagadosGuardados = JSON.parse(localStorage.getItem("pagados")) || [];
    setPagados(pagadosGuardados);
  }, []);

  // Borrar toda la mesa
  const borrarMesa = () => {
    localStorage.removeItem(`mesa${numero}`);
    setPedido([]);
  };

  // Borrar un item por id
  const borrarItem = (id) => {
    const nuevoPedido = pedido.filter(p => p.id !== id);
    setPedido(nuevoPedido);
    localStorage.setItem(`mesa${numero}`, JSON.stringify(nuevoPedido));

    const nuevosSeleccionados = itemsSeleccionados.filter(i => i !== id);
    setItemsSeleccionados(nuevosSeleccionados);
    localStorage.setItem("itemsSeleccionados", JSON.stringify(nuevosSeleccionados));

    const nuevosPagados = pagados.filter(i => i !== id);
    setPagados(nuevosPagados);
    localStorage.setItem("pagados", JSON.stringify(nuevosPagados));
  };

  // Selección de items
  const toggleSeleccion = (id) => {
    let nuevosItems;
    if (itemsSeleccionados.includes(id)) {
      nuevosItems = itemsSeleccionados.filter(i => i !== id);
    } else {
      nuevosItems = [...itemsSeleccionados, id];
    }
    setItemsSeleccionados(nuevosItems);
    localStorage.setItem("itemsSeleccionados", JSON.stringify(nuevosItems));
  };

  // Selección para pago parcial
  const toggleSeleccionParcial = (id) => {
    if (pagados.includes(id)) return;
    if (itemsParcial.includes(id)) {
      setItemsParcial(itemsParcial.filter(i => i !== id));
    } else {
      setItemsParcial([...itemsParcial, id]);
    }
  };

  // Total de pago parcial
  const totalParcial = itemsParcial.reduce((sum, id) => {
    const item = pedido.find(p => p.id === id);
    return sum + (item?.precioVenta || 0);
  }, 0);

  // Confirmar pago parcial
  const confirmarPagoParcial = () => {
    const nuevosPagados = [...pagados, ...itemsParcial];
    setPagados(nuevosPagados);
    localStorage.setItem("pagados", JSON.stringify(nuevosPagados));
    setItemsParcial([]);
    setMostrarModalPago(false);
    setModalParcialActivo(false);
  };

  // Pagar todos los items
  const pagarCompleto = () => {
    const todosIds = pedido.map(p => p.id);
    setPagados(todosIds);
    localStorage.setItem("pagados", JSON.stringify(todosIds));
    setMostrarModalPago(false);
  };

  // Resetear items pagados
  const resetPagados = () => {
    setPagados([]);
    localStorage.removeItem("pagados");
  };






// Total de todos los items
const totalPedido = pedido.reduce((sum, p) => sum + Number(p.precioVenta || 0), 0);

// Total pagado
const totalPagado = pedido
  .filter(p => pagados.includes(p.id))
  .reduce((sum, p) => sum + Number(p.precioVenta || 0), 0);

// Restante por pagar
const restante = totalPedido - totalPagado;









/*cagadofin*/
const [cargaDOFIN, setcargaDOFIN] = useState(false)







// Finalizar pedido
const finalizarPedido = async () => {
  
  
  
  if (pedido.length === 0) return;
  
setcargaDOFIN(true)
  // --- Guardar pedidos realizados ---
  const pedidosPrevios = JSON.parse(localStorage.getItem("pedidosRealizados")) || [];
  const nuevosPedidos = [...pedidosPrevios, ...pedido];
  localStorage.setItem("pedidosRealizados", JSON.stringify(nuevosPedidos));

  // --- Guardar ingredientes acumulados ---
  let ingredientesPrevios = JSON.parse(localStorage.getItem("ingredientesAcumulados")) || [];

  let mapaIngredientes = {};
  ingredientesPrevios.forEach(ing => {
    mapaIngredientes[ing.nombre] = {
      ...ing,
      cantidad: parseFloat(ing.cantidad),
    };
  });

  pedido.forEach(p => {
    if (p.ingredientes) {
      p.ingredientes.forEach(ing => {
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
  localStorage.setItem("ingredientesAcumulados", JSON.stringify(ingredientesActualizados));

  ////// Guardar en Firebase //////

  try {
    // referencia al documento del usuario
    const userDocRef = doc(db, "usuarios", "principamorasadmi@moritas.com");

    // referencia a la subcolección "orders" dentro del usuario
    const ordersRef = collection(userDocRef, "orders");

    // añadir un pedido
    await addDoc(ordersRef, {
      pedido: pedido,
      total: totalPedido,
      mesa: numero,
      estado: "pagada",
      createdAt: new Date(),
    });

    // --- Limpiar la mesa actual ---
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
    setcargaDOFIN(false)
  }
};







const irafactura = () => {

 localStorage.setItem("facturaActual", JSON.stringify({
      pedido,
      total: totalPedido,
      mesa: numero,
      pagados,
      restante
    }));
    navigate(`/factura/${numero}`);
  
}


  return (
    <div className='mesascontainerpadre'>
      <article className="HEDER">
          <img
            className="LOGOIMG"
            src="https://res.cloudinary.com/db8e98ggo/image/upload/v1731124196/Que_esperas_._dqfhgg.png"
            alt=""
          />
        </article>

      <section className='pedido-sectionFULL'>
        <h2 className='tilomes'>Pedidos para la mesa N°{numero}</h2>

        {pedido.length > 0 ? (
          <section className='pedido-contenido'>
            
            <ul className='lista-pedidos'>
              {pedido.map((p) => (
                <li
                  key={p.id}
                  className={`pedido-item ${itemsSeleccionados.includes(p.id) ? 'activo' : ''}`}
                  onClick={() => toggleSeleccion(p.id)}
                >
                  <div className='cotefnoypreci'>
                    <p className='nobrepaltop'   >{p.nombre}</p>
                    <p>${p.precioVenta}</p>
                  </div>

                  {p.respuestas ? (
                    <ul className='respuestas-lista'>
                      {Object.entries(p.respuestas).map(([clave, valor], idx) => (
                        <li key={idx} className='respuesta-item'>{clave}: {valor}</li>
                      ))}
                    </ul>
                  ) : p.detalle ? (
                    <div className='detalles-texto'>{p.detalle}</div>
                  ) : null}

                  <button className='btnx' onClick={() => borrarItem(p.id)}>X</button>

                  {pagados.includes(p.id) && (
                    <div className="overlay-pagado">PAGADO</div>
                  )}
                </li>
              ))}
            </ul>

            <p className='total-texto'>
              TOTAL: ${pedido.reduce((sum, p) => sum + Number(p.precioVenta || 0), 0).toFixed(2)}
            </p>

<p className='total-pagado'>
  PAGADO: ${totalPagado.toFixed(2)}
</p>
<p className='total-restante'>
  RESTANTE: ${restante.toFixed(2)}
</p>

 {restante === 0 &&
  
   
   
   <div>
{cargaDOFIN ?
 
 (<p className='tilomes'    >Procesando...</p>) 
 
 : (

<section  className='contvtn'  >


<button  onClick={finalizarPedido}      className='btnfindpi'   >
      Finalizar pedido
    </button>


<button onClick={irafactura}      className='btnfindpi'     >
Crear factura

</button>

</section>

  )}

</div>


  }





            <div className='acciones'>
              <button className='btn agregar' onClick={() => setMostrarModal(true)}>Agregar más al pedido</button>
              <button className='btn pagado' onClick={() => setMostrarModalPago(true)}>Pagar pedido</button>
            </div>
          </section>
        ) : (
          <article className='pedido-vacio'>
            <h3>No hay pedido para esta mesa.</h3>
            <p>Haz clic en “Agregar pedido” para comenzar.</p>
            <button className='btn' onClick={() => navigate(`/ia/${numero}`)}>Pedido por IA</button>
            <button className='btn' onClick={() => navigate(`/ordentradi/${numero}`)}>Pedido tradicional</button>
          </article>
        )}
      </section>

      {/* Modal Selección de tipo de pedido */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>¿Cuál método de pedido prefieres?</h3>
            <button onClick={() => navigate(`/ia/${numero}`)}>Pedido por IA</button>
            <button onClick={() => navigate(`/ordentradi/${numero}`)}>Pedido tradicional</button>
            <button className="cerrar" onClick={() => setMostrarModal(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Modal Pago */}
      {mostrarModalPago && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>¿Cómo desea pagar?</h3>
            <button onClick={() => { setModalParcialActivo(true); }}>Pagar en partes</button>
            <button onClick={pagarCompleto}>Pagar completo</button>
            <button className="cerrar" onClick={() => setMostrarModalPago(false)}>Cancelar</button>

            {modalParcialActivo && (
              <div className="modal-overlay">
                <div className="modal">
                  <h4>Seleccione los platos a pagar</h4>
                  <ul>
                    {pedido.map(p => (
                      <li
                        key={p.id}
                        onClick={() => toggleSeleccionParcial(p.id)}
                        style={{
                          cursor: pagados.includes(p.id) ? "not-allowed" : "pointer",
                          opacity: pagados.includes(p.id) ? 0.5 : 1,
                          background: itemsParcial.includes(p.id) ? "#14ca3eff" : ""
                        }}
                      >
                        {p.nombre} - ${p.precioVenta} {pagados.includes(p.id) && " ✅ Pagado"}
                      </li>
                    ))}
                  </ul>
                  <p>Total seleccionado: ${totalParcial.toFixed(2)}</p>
                  <button onClick={confirmarPagoParcial}>Confirmar pago parcial</button>
                  <button className="cerrar" onClick={() => { setModalParcialActivo(false); setMostrarModalPago(false); }}>Cancelar</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      <Navar />
    </div>
  );
};

export default Mesashome;
             

