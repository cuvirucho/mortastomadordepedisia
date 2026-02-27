import React from "react";

// Versión ultra-simple - La animación es 100% CSS
// Solo renderiza o no renderiza el div
const AuraReactiva = React.memo(({ hablando }) => {
  if (!hablando) return null;
  return <div className="aura-reactiva" />;
});

AuraReactiva.displayName = "AuraReactiva";

export default AuraReactiva;
