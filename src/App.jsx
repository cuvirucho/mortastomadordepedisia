
import './App.css'
import Homeiamor from './IAMOR/Homeiamor'
import Mesashome from './Mesas/Mesashome'
import Home from './Pantallaprincipal/Home'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Pedidoshome from './pedidos/Pedidoshome'
import Comprashome from './Compras/Comprashome'
import Cajahome from './Caja/Cajahome'
import Facturahome from './Facturas/facturahome'

function App() {


  return (
  <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />      
        <Route path="/ia/:numero" element={<Homeiamor />} />        
       <Route path="/mesa/:numero" element={ <Mesashome/> } />
       <Route path="/factura/:numero" element={ <Facturahome/> } />
     
     
     <Route path="/ordentradi/:numero" element={ <Pedidoshome/> } />
     <Route path="/compras" element={ <Comprashome  /> } />
     <Route path="/caja" element={ <Cajahome  /> } />




      </Routes>
    </BrowserRouter>
  )
}

export default App
