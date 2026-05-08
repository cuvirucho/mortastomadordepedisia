// Navar.jsx
import React, { useState } from "react";
import { NavLink } from "react-router-dom";

export const Navar = () => {
  return (
    <nav
      className="bottom-nav"
      role="navigation"
      aria-label="Barra de navegación inferior"
    >
      <NavLink to="/" className="itemnab">
        <span className="icon" aria-hidden>
          📋{" "}
        </span>
        <span className="label"> Ordenes</span>
      </NavLink>

      <NavLink to="/compras" className="itemnab">
        <span className="icon">🧾</span>
        <span className="label">Compras</span>
      </NavLink>

      <NavLink to="/caja" className="itemnab">
        <span className="icon">🏠</span>
        <span className="label">Caja</span>
      </NavLink>

      <NavLink to="/personal" className="itemnab">
        <span className="icon">🎉</span>
        <span className="label">Puntos</span>
      </NavLink>
    </nav>
  );
};

export default Navar;
