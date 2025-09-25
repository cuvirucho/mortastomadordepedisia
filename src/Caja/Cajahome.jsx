import React, { useState } from "react";
import Navar from "../utilidales/Navar";
import { addDoc, collection, doc, Timestamp, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../Firebase/Firebase";
import { useNavigate } from "react-router-dom";

const Cajahome = () => {
  const pedidosListos = JSON.parse(localStorage.getItem("pedidosListos")) || [];
  const paymentData = JSON.parse(localStorage.getItem("paymentData")) || {};
  const pedidosRealizados = JSON.parse(localStorage.getItem("pedidosRealizados")) || [];
  const ingredientesAcumulados = JSON.parse(localStorage.getItem("ingredientesAcumulados")) || [];
  const [compras, setCompras] = useState(() => {
    const comprasGuardadas = localStorage.getItem("compras");
    return comprasGuardadas ? JSON.parse(comprasGuardadas) : [];
  });
  const navigate = useNavigate();

  // ✅ Calcular totales
  const totalCompras = compras.reduce((acc, compra) => acc + compra.valor, 0);
  const totalVentas = pedidosRealizados.reduce((acc, pedido) => {
    const precio = parseFloat(pedido.precioVenta) || 0;
    return acc + precio;
  }, 0);
  const totalCaja = totalVentas - totalCompras;

  // ✅ Restar ingredientes usados de la bodega
const actualizarBodega = async () => {
  try {
    const ref = doc(
      db,
      "usuarios",
      "principamorasadmi@moritas.com",
      "Bodega",
      "ProductosDeComida"
    );

    // 1. Leer la bodega actual
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      console.error("❌ No existe la bodega en Firebase");
      return;
    }

    let productos = snapshot.data();

    // 2. Construir objeto con updates
    const updates = {};

    ingredientesAcumulados.forEach((ing) => {
      if (productos[ing.nombre]) {
        let nuevaCantidad =
          (productos[ing.nombre].cantidadExistente || 0) - (ing.cantidad || 0);

        if (nuevaCantidad < 0) nuevaCantidad = 0;

        // ✅ Usamos corchetes para soportar espacios en el nombre
        updates[`${ing.nombre}.cantidadExistente`] = nuevaCantidad;
      } else {
        console.warn(`⚠️ El producto ${ing.nombre} no existe en la bodega`);
      }
    });

    // 3. Guardar en Firestore
    if (Object.keys(updates).length > 0) {
      await updateDoc(ref, updates);
      console.log("✅ Bodega actualizada:", updates);
    } else {
      console.log("⚠️ No hubo productos para actualizar");
    }
  } catch (error) {
    console.error("❌ Error actualizando bodega:", error);
  }
};




  // ✅ Guardar en Firebase y borrar localStorage
const finalizarDia = async () => {
 
 setcargaDOFIN(true)
 
  try {
    const userDocRef = doc(db, "usuarios", "principamorasadmi@moritas.com");
    const ordersRef = collection(userDocRef, "fndia");

    const resumen = {
      fecha: new Date().toLocaleDateString("es-EC"),
      timestamp: Timestamp.now(),
      totalVentas,
      totalCompras,
      totalCaja,
      listadecomparas: compras,
      ingredientesusados: ingredientesAcumulados,
      pedidoslocal: pedidosRealizados,
    };

    // 1. Guardar resumen del día
    await addDoc(ordersRef, resumen);

    // 2. Restar ingredientes de la bodega
    await actualizarBodega();

    // 3. Limpiar localStorage
    localStorage.removeItem("pedidosListos");
    localStorage.removeItem("paymentData");
    localStorage.removeItem("compras");
    localStorage.removeItem("pedidosRealizados");
    localStorage.removeItem("ingredientesAcumulados");

    alert("✅ Día finalizado, bodega actualizada y guardado en Firebase 🚀");

  } catch (error) {
    console.error("❌ Error guardando en Firebase:", error);
    alert("Hubo un error al guardar el resumen en Firebase.");
  }finally {
    setcargaDOFIN(false)
 navigate(`/`);
  }
};


console.log(ingredientesAcumulados);




/*cagadofin*/
const [cargaDOFIN, setcargaDOFIN] = useState(false)







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
            Total de Ventas: ${totalVentas.toFixed(2)}
          </h3>
          <h3 className="cajahome-subtitle cajahome-total compra">
            Total de Compras: ${totalCompras.toFixed(2)}
          </h3>
          <h3 className="cajahome-subtitle cajahome-total caja">
            Total de caja: ${totalCaja.toFixed(2)}
          </h3>
        </div>

        <ul className="cajahome-pedidos">
          {pedidosRealizados.map((pedido, index) => (
            <li key={index} className="cajahome-pedido-item">
              <strong>{pedido.nombre}</strong> - ${pedido.precioVenta} 
            </li>
          ))}
        </ul>


{pedidosRealizados.length === 0 && (
  <p className="nopedidos">No hay pedidos realizados todavía.</p>
)}


      </div>

      {/* Botón que guarda en Firebase, actualiza bodega y borra local */}
      
   <div>
{cargaDOFIN ? (<p className='cajahomebutton'    >Procesando...</p>) : (
   <button  onClick={finalizarDia}      className='cajahomebutton'   >
      Finalizar dia
    </button>
  )}

</div>

      <Navar />
    </section>
  );
};

export default Cajahome;
