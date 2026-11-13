import "./App.css";
import Mesashome from "./Mesas/Mesashome";
import Home from "./Pantallaprincipal/Home";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Pedidoshome from "./pedidos/Pedidoshome";
import Comprashome from "./Compras/Comprashome";
import Cajahome from "./Caja/Cajahome";
import Homefactura from "./Facturas/Homefactura";
import Personalhome from "./Personalpoints/Personalhome";
import { useEffect } from "react";
import { escucharPedidosMesas } from "./Firebase/PedidosMesa";

function App() {
  useEffect(() => escucharPedidosMesas(), []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mesa/:numero" element={<Mesashome />} />
        <Route path="/factura/:numero" element={<Homefactura />} />
        <Route path="/personal" element={<Personalhome />} />

        <Route path="/ordentradi/:numero" element={<Pedidoshome />} />
        <Route path="/compras" element={<Comprashome />} />
        <Route path="/caja" element={<Cajahome />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
