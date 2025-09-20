import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { obtenerPlatosComplejos } from '../Firebase/PlatosComplejos';
import Navar from '../utilidales/Navar';

const Pedidoshome = () => {
  const [menu, setMenu] = useState({});
  const { numero } = useParams();
  const navigation = useNavigate();
  const [extras, setExtras] = useState({});
  const [cantidades, setCantidades] = useState({});
  const [search, setSearch] = useState("");
  const [ordenes, setOrdenes] = useState([]);



    const ira = () => {
    navigation(`/mesa/${numero}`); // Ruta que definiste en App
  };

  // Estado para mostrar/ocultar modal carrito
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const cargarPlatos = async () => {
      try {
        const data = await obtenerPlatosComplejos("principamorasadmi@moritas.com");
        setMenu(data || {});
      } catch (e) {
        console.error("Error cargando platos complejos:", e);
      }
    };
    cargarPlatos();
  }, []);

  const platosFiltrados = Object.values(menu).filter(plato =>
    plato.alias.some(nombre =>
      nombre.toLowerCase().includes(search.toLowerCase())
    )
  );

  const desayunos = platosFiltrados.filter(plato => plato.tipo === "desayuno");
  const desatigrillos = platosFiltrados.filter(plato => plato.tipo === "tigrillo");
  const pancakes = platosFiltrados.filter(plato => plato.tipo === "pancakes");

  const handleExtraChange = (key, value) => {
    setExtras(prev => ({ ...prev, [key]: value }));
  };

  const handleCantidadChange = (key, delta) => {
    setCantidades(prev => {
      const nuevaCantidad = Math.max(1, (prev[key] || 1) + delta);
      return { ...prev, [key]: nuevaCantidad };
    });
  };

  const handleAgregarPedido = (key, plato) => {
    const cantidad = cantidades[key] || 1;
    const detalle = extras[key] || "";

    const nuevosPedidos = Array(cantidad).fill().map(() => ({
      id: Math.random().toString(36).substr(2, 9),
      nombre: plato.alias[0],
      detalle: detalle,
      tipo: plato.tipo,
      precioVenta: plato.precioVenta,
      ingredientes: plato.ingredientes || [],
    }));

    setOrdenes(prev => [...prev, ...nuevosPedidos]);
    alert(`Pedido agregado`);
    setExtras(prev => ({ ...prev, [key]: "" }));
    setCantidades(prev => ({ ...prev, [key]: 1 }));


  };











/* enviar orden*/



const enviarOrden = () => {
  if (ordenes.length === 0) {
    hablar("No hay nada en la orden.");
    alert("⚠️ No hay nada en la orden.");
    return;
  }

  // Leer lo que ya hay en localStorage
  const pedidoExistenteJSON = localStorage.getItem(`mesa${numero}`);
  let pedidoExistente = [];
  if (pedidoExistenteJSON) {
    try {
      pedidoExistente = JSON.parse(pedidoExistenteJSON);
      if (!Array.isArray(pedidoExistente)) pedidoExistente = [];
    } catch {
      pedidoExistente = [];
    }
  }

  // Combinar pedidos anteriores con los nuevos
  const pedidosCombinados = [...pedidoExistente, ...ordenes];

  const resumen = pedidosCombinados.map((o) => `${o.nombre}`).join(" | ");

  const mensaje = `Tu pedido ha sido enviado: ${resumen}. ¡Gracias!`;
  alert("✅ " + mensaje);

  // Guardar la combinación en localStorage
  localStorage.setItem(`mesa${numero}`, JSON.stringify(pedidosCombinados));

  setOrdenes([]);
ira(); // Redirigir a la mesa actual
};




/*fin d eenviar oden */



  return (
    <article className='contefull'>
     
     
             <article className='HEDER'>
          <img
            className='LOGOIMG'
            src="https://res.cloudinary.com/db8e98ggo/image/upload/v1731124196/Que_esperas_._dqfhgg.png"
            alt=""
          />
        </article>
     





<div  className='coterbrbu'  >

        <input
          type="text"
          placeholder="Buscar plato..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="barra-busqueda"
        />

  {/* Botón carrito */}
      <button
        onClick={() => setModalVisible(true)}
      className='btncarrito'
        aria-label="Ver carrito"
      >
        🛒
        {ordenes.length > 0 && (
          <span
           className='indicadordepds'
          >
           
          </span>
        )}
    
    
    
    
    
    
      </button>


</div>



      <section className='contepatps'>
      
 







{Object.keys(menu).length === 0 ? (
  <p style={{ textAlign: "center", fontSize: "1.2rem", color: "#6f00ff" }}>
    ⏳ Cargando...
  </p>
) : (
null
)}



        

        {desayunos.length > 0 && <p className='tiosdesyunos'>Desayunos</p>}
        <ul className="lista-desayunos">
          {desayunos.map(plato => {
            const key = `desayuno-${plato.alias[0]}`;
            return (
              <li className='plato-item' key={key}>
                <p><strong>{plato.alias[0]}</strong></p>

                <div className="cantidad-container">
                  <button onClick={() => handleCantidadChange(key, -1)}>-</button>
                  <span className='cari'>{cantidades[key] || 1}</span>
                  <button onClick={() => handleCantidadChange(key, 1)}>+</button>
                </div>

                <input
                  type="text"
                  className="nota-input"
                  placeholder="Detalles"
                  value={extras[key] || ""}
                  onChange={(e) => handleExtraChange(key, e.target.value)}
                />

                <button
                  className='btnagrag'
                  onClick={() => handleAgregarPedido(key, plato)}
                >
                  Agregar el pedido
                </button>
              </li>
            );
          })}
        </ul>

        {desatigrillos.length > 0 && <p className='tiotigrillo'>Tigrillos</p>}
        <ul className="lista-desayunos">
          {desatigrillos.map(plato => {
            const key = `tigrillo-${plato.alias[0]}`;
            return (
              <li className='plato-item' key={key}>
                <p><strong>{plato.alias[0]}</strong></p>

                <div className="cantidad-container">
                  <button onClick={() => handleCantidadChange(key, -1)}>-</button>
                  <span className='cari'>{cantidades[key] || 1}</span>
                  <button onClick={() => handleCantidadChange(key, 1)}>+</button>
                </div>

                <input
                  type="text"
                  className="nota-input"
                  placeholder="Detalles"
                  value={extras[key] || ""}
                  onChange={(e) => handleExtraChange(key, e.target.value)}
                />

                <button
                  className='btnagrag'
                  onClick={() => handleAgregarPedido(key, plato)}
                >
                  Agregar el pedido
                </button>
              </li>
            );
          })}
        </ul>

        {pancakes.length > 0 && <p className='tiosdesyunos'>Pancakes</p>}
        <ul className="lista-desayunos">
          {pancakes.map(plato => {
            const key = `pancakes-${plato.alias[0]}`;
            return (
              <li className='plato-item' key={key}>
                <p><strong>{plato.alias[0]}</strong></p>

                <div className="cantidad-container">
                  <button onClick={() => handleCantidadChange(key, -1)}>-</button>
                  <span className='cari'>{cantidades[key] || 1}</span>
                  <button onClick={() => handleCantidadChange(key, 1)}>+</button>
                </div>

                <input
                  type="text"
                  className="nota-input"
                  placeholder="Detalles"
                  value={extras[key] || ""}
                  onChange={(e) => handleExtraChange(key, e.target.value)}
                />

                <button
                  className='btnagrag'
                  onClick={() => handleAgregarPedido(key, plato)}
                >
                  Agregar el pedido
                </button>
              </li>
            );
          })}
        </ul>

      </section>

    

      {/* Modal carrito */}
      {modalVisible && (
        <div
          onClick={() => setModalVisible(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            color: ' #6f00ff'
          }}
        >
          <div
            onClick={e => e.stopPropagation()} // evitar que cierre al hacer click dentro
            style={{
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 10,
              maxWidth: '90%',
              maxHeight: '80%',
              overflowY: 'auto',
              width: '400px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setModalVisible(false)}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'transparent',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer'
              }}
              aria-label="Cerrar carrito"
            >
              ×
            </button>

            <h2>Carrito de Pedidos</h2>

            {ordenes.length === 0 ? (
              <p>No hay pedidos agregados.</p>
            ) : (
             
               <div  className='conteordene'  >
           
           
             <ul style={{ listStyle: 'none', padding: 0 }}>
                {ordenes.map(item => (
                  <li key={item.id} style={{ marginBottom: 10, borderBottom: '1px solid #ccc', paddingBottom: 10 }}>
                    <strong  className='brdpltyo'  >{item.nombre}</strong>
                    {item.detalle && <p style={{ margin: '4px 0' }}>Detalle: {item.detalle}</p>}
                    <small style={{ color: '#555' }}>Tipo: {item.tipo}</small>
                  </li>
                ))}
            
            
            
              </ul>
            
            
                 <button onClick={enviarOrden}     className='btnenviarpedo'>
          enviar orden
         </button>
            
              </div>
            )}
         
         
    
          </div>
        
        
        
        
        
        
        
        </div>
      )}

      <Navar />
    </article>
  );
};

export default Pedidoshome;
