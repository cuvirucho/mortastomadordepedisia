import React, { useEffect, useState } from 'react';
import { data, useNavigate, useParams } from "react-router-dom";
import jsPDF from 'jspdf';

import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../Firebase/Firebase';
import autoTable from 'jspdf-autotable';

const Homefactura = () => {
  const { numero } = useParams();

  // ----------------- Hooks -----------------
  const [factura, setFactura] = useState(null);

  const [pdfUrl, setPdfUrl] = useState("");

  // ----------------- Cargar factura -----------------
  
  

  useEffect(() => {
    const data = localStorage.getItem("facturaActual");
    if (data) setFactura(JSON.parse(data));
  }, []);





  const [form, setForm] = useState({
    nombre: "",
    producto: factura || "",
    numero: "",
    cedula: "",
  });







  // ----------------- Handlers -----------------
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };












const generarPDF = async () => {
  if (!form.nombre || !form.numero || !form.cedula) {
    alert("Completa todos los campos antes de generar la factura");
    return;
  }

  const doc = new jsPDF({ unit: "px", format: "a4" });

  const primaryColor = "blueviolet";
  const secondaryColor = "#ecf0f1";

  // ----------------- Logo y datos del local -----------------
  const logo = new Image();
  logo.src = "/logo.png"; // tu logo en public/
  logo.onload = async () => {
    doc.addImage(logo, "PNG", 40, 20, 80, 80);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(primaryColor);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Heramano Miguel y Calle Larga", 400, 60, { align: "right" });
    doc.text("Tel: 0963200325", 400, 75, { align: "right" });
    doc.text("RIMPE: 0105125124001", 400, 90, { align: "right" });

    // Línea separadora
    doc.setDrawColor(200);
    doc.line(40, 90, 550, 90);

    // ----------------- Datos del cliente -----------------
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text(`Cliente: ${form.nombre}`, 40, 110);
    doc.text(`Cédula: ${form.cedula}`, 40, 130);
    doc.text(`Mesa: ${numero}`, 40, 150);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 400, 150, { align: "right" });

    // ----------------- Tabla -----------------
    const bodyData = factura.pedido.map((p) => [
      p.nombre,
      `$${p.precioVenta.toFixed(2)}`,
      p.cantidad || 1,
      `$${(p.precioVenta * (p.cantidad || 1)).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 170,
      head: [["Producto", "Precio Unitario", "Cantidad", "Subtotal"]],
      body: bodyData,
      theme: "striped",
      headStyles: { fillColor: primaryColor, textColor: "#fff" },
      alternateRowStyles: { fillColor: secondaryColor },
      margin: { left: 40, right: 40 },
    });

    // ----------------- Totales -----------------
    const finalY = doc.lastAutoTable.finalY || 170;
    const total = factura.pedido.reduce(
      (acc, p) => acc + p.precioVenta * (p.cantidad || 1),
      0
    );

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`Subtotal: $${total.toFixed(2)}`, 400, finalY + 30, { align: "right" });
    doc.text(`IVA: $${factura.restante.toFixed(2)}`, 400, finalY + 50, { align: "right" });
    doc.text(`Total: $${(total + factura.restante).toFixed(2)}`, 400, finalY + 70, { align: "right" });

    // ----------------- Sello de aprobado -----------------
    const sello = new Image();
    sello.src = "/sello.png"; // imagen del sello en public/
    sello.onload = async () => {
      doc.addImage(sello,"PNG", 40, 400, 90, 90);

      // ----------------- Pie de página -----------------
      doc.setFontSize(11);
      doc.setFont("helvetica", "italic");
      doc.text("Gracias por su compra. ¡Vuelva pronto!", 400, 450 + 30, { align: "right" });

      // ----------------- Guardar/Subir -----------------
      const pdfBlob = doc.output("blob");

      try {
        const storageRef = ref(storage, `facturas/factura_${Date.now()}.pdf`);
        await uploadBytes(storageRef, pdfBlob);
        const url = await getDownloadURL(storageRef);
        setPdfUrl(url);
        alert("Factura generada y subida con éxito 🚀");
      } catch (error) {
        console.error("Error subiendo PDF:", error);
        alert("Ocurrió un error al subir la factura");
      }
    };
  };
};











 const enviarWhatsApp = () => {
  if (!pdfUrl) {
    alert("Primero genera la factura antes de enviar por WhatsApp");
    return;
  }

  if (!form.numero) {
    alert("Ingresa el número de WhatsApp del cliente");
    return;
  }

  // Limpiamos el número para que WhatsApp lo acepte
  const numeroLimpio = form.numero.replace(/\D/g, ""); // quita todo lo que no sea dígito

  const mensaje = `Hola ${form.nombre}, aquí tienes tu factura: ${pdfUrl}`;
  const whatsappURL = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;

  window.open(whatsappURL, "_blank");
};





  const navigate = useNavigate();



const canselR = () => {


    navigate(`/mesa/${numero}`);
  
}



  // ----------------- Render -----------------
  if (!factura) return <p>No hay datos de factura</p>;





return (
<div className="facturahomeapp">
  
  
  
        <article className="HEDER">
          <img
            className="LOGOIMG"
            src="https://res.cloudinary.com/db8e98ggo/image/upload/v1731124196/Que_esperas_._dqfhgg.png"
            alt=""
          />
        </article>

  
  
  
  <h1 className="facturahome-title">Generador de Facturas</h1>





{
  pdfUrl?
   <img
            className="imgfccreas"
            src="https://res.cloudinary.com/db8e98ggo/image/upload/v1758753875/Caf%C3%A9_2_medialunas_Paga_solo_uno._n0w6ny.png"
            alt=""
          />
  :
  

  <form className="facturahomeform">
   
   
   <div>


   
   {form.nombre===""?null
    :
    <label  className='lspbinpu'   >Nombre del cliente</label>
   }
    <input
      className="facturahome-input"
      type="text"
      name="nombre"
      placeholder="Nombre del cliente"
      value={form.nombre}
      onChange={handleChange}
      />

    </div>


<div>

{form.cedula===""?null
:

   <label className='lspbinpu'  >Cedula del cliente</label>
}



    <input
      className="facturahome-input"
      type="text"
      name="cedula"
      placeholder="Cédula"
      value={form.cedula}
      onChange={handleChange}
      />


 </div>


<div>


{form.numero===""?null
:

<label className='lspbinpu'   >Número del cliente</label>
}





    <input
      className="facturahome-input"
      type="number"
      name="numero"
      placeholder="Número"
      value={form.numero}
      onChange={handleChange}
      />
 
 
  </div>
 
 
 
 
  </form>


}










  {pdfUrl ? (
    <div>
      <a
        className="facturahomelink"
        href={pdfUrl}
        target="_blank"
        rel="noreferrer"
      >
        Ver Factura
      </a>
      <button
        className="facturahome-button facturahome-button-secondary"
        onClick={enviarWhatsApp}
      >
        Enviar por WhatsApp
      </button>
    </div>
  )
:

  <button className="facturahome-button" onClick={generarPDF}>
    Generar PDF
  </button>

}







  <div className="facturahome-factura">
    <h2 className="facturahome-title"   >Detalles de la factura Mesa {factura.mesa}</h2>
 
 
 


 {
  pdfUrl?
  <div>
  
   <p>
  Nombre: {form.nombre}
 </p>
 
 <p>
  Numero: {form.numero}
 </p>
 
 <p>
  Cedula: {form.cedula}
 </p>
 
  
  
  </div>
  :
  null
 }







    <ul  className='facturahome-facturaul'     >
      {factura.pedido.map((p) => (
        <li className='facturahome-facturali'  key={p.id}>
          {p.nombre} - ${p.precioVenta}
        </li>
      ))}
    </ul>
  
  
  
    <p>Subtotal: ${factura.total}</p>
    <p>Iva: $0</p>
    <p>Total: {factura.total}</p>







  </div>


<button  onClick={canselR}         className='btnfindpi'   >
  Cancelar
</button>


</div>

  );
};

export default Homefactura;
