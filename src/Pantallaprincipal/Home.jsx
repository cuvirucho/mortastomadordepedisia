import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { obtenerPlatosComplejos } from '../Firebase/PlatosComplejos';
import Navar from '../utilidales/Navar';
import Homepediweb from '../Pedidoweb/Homepediweb';

const Home = () => {
  const navigate = useNavigate();

  const irAIa = () => {
    navigate('/ia'); // Ruta que definiste en App
  };

  const mesas = [1, 2, 3, 4];

 /*
 borras local 
 
       <button onClick={() => {
        localStorage.removeItem("ingredientesAcumulados");
        localStorage.removeItem("pedidosRealizados");
        mesas.forEach(num => {
          localStorage.removeItem(`mesa${num}`);
        });
      }}>
        borrar localStorage
      </button>
      
 
 
 */






















  return (
    <section  className='contfllhome'  >
      

      <article className='HEDER'>
        <img
          className='LOGOIMG'
          src="https://res.cloudinary.com/db8e98ggo/image/upload/v1731124196/Que_esperas_._dqfhgg.png"
          alt=""
        />
      </article>

      <article className='bodyhome'>

         <h2 className="titulo"> Pedidos en el local </h2>

  
        <section className='mesasaconte'>
          {mesas.map((num) => {
            const pedidosMesa = JSON.parse(localStorage.getItem(`mesa${num}`)) || [];
            const tienePedidos = pedidosMesa.length > 0;

            return (
              <Link
                key={num}
                to={`/mesa/${num}`}
                className={`mesacard ${tienePedidos ? 'mesa-con-pedidos' : ''}`}
              >
                 <p>Mesa {num}</p>
                {tienePedidos && <p className="badge-pedido">Con pedido</p>}
              </Link>
            );
          })}
        </section>

        <section   >
          <Homepediweb />
        </section>


     
     
      </article>

      <Navar/>
      
    </section>
  );
};

export default Home;
