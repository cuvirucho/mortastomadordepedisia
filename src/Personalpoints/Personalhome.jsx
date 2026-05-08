import React, { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../Firebase/Firebase";
import Navar from "../utilidales/Navar";

const METAS = [
  { puntos: 550, nivel: 1, label: "Pase Dorado Bronce", emoji: "🥉" },
  { puntos: 900, nivel: 2, label: "Pase Dorado Plata", emoji: "🥈" },
  { puntos: 1200, nivel: 3, label: "Pase Dorado ORO", emoji: "🏆" },
];

const Personalhome = () => {
  const [puntos, setPuntos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const personalRef = doc(db, "personal", "principamorasadmi");
    const unsub = onSnapshot(personalRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const hoy = new Date();
        const mesActual = `${hoy.getFullYear()}-${hoy.getMonth() + 1}`;

        // Reset el día 7 de cada mes si aún no se ha hecho este mes
        if (hoy.getDate() === 7 && data.lastReset !== mesActual) {
          await updateDoc(personalRef, { puntos: 50, lastReset: mesActual });
          setPuntos(50);
        } else {
          setPuntos(data.puntos ?? 0);
        }
      } else {
        setPuntos(0);
      }
      setCargando(false);
    });
    return () => unsub();
  }, []);

  const metaActual =
    METAS.find((m) => puntos < m.puntos) ?? METAS[METAS.length - 1];
  const metaAnterior =
    METAS.find(
      (m) =>
        puntos >= m.puntos &&
        METAS.indexOf(m) ===
          METAS.findIndex(
            (x) => puntos >= x.puntos && METAS.indexOf(x) === METAS.length - 1,
          ),
    ) ?? null;

  // Calcular progreso para la barra de la meta actual
  const metaIndex = METAS.findIndex((m) => puntos < m.puntos);
  const metaObjetivo =
    metaIndex === -1 ? METAS[METAS.length - 1] : METAS[metaIndex];
  const puntosBase = metaIndex <= 0 ? 0 : METAS[metaIndex - 1].puntos;
  const progreso = Math.min(
    ((puntos - puntosBase) / (metaObjetivo.puntos - puntosBase)) * 100,
    100,
  );

  return (
    <section className="personal-page">
      <article className="HEDER">
        <img
          className="LOGOIMG"
          src="https://res.cloudinary.com/db8e98ggo/image/upload/v1731124196/Que_esperas_._dqfhgg.png"
          alt="Moritas"
        />
      </article>

      <div className="personal-body">
        {cargando ? (
          <p className="personal-cargando">Cargando puntos...</p>
        ) : (
          <>
            {/* Tarjeta principal de puntos */}
            <div className="personal-card-puntos">
              <p className="personal-label-pts">Puntos acumulados</p>
              <p className="personal-numero-pts">{puntos}</p>
              <p className="personal-label-pts">pts</p>
            </div>

            {/* Barra de progreso hacia siguiente meta */}
            {metaIndex !== -1 && (
              <div className="personal-progreso-wrap">
                <div className="personal-progreso-header">
                  <span>Próxima meta: {metaObjetivo.puntos} pts</span>
                  <span>{Math.round(progreso)}%</span>
                </div>
                <div className="personal-barra-fondo">
                  <div
                    className="personal-barra-relleno"
                    style={{ width: `${progreso}%` }}
                  />
                </div>
                <p className="personal-faltan">
                  Te faltan {metaObjetivo.puntos - puntos} puntos para{" "}
                  {metaObjetivo.label} {metaObjetivo.emoji}
                </p>
              </div>
            )}

            {/* Metas / logros */}
            <h3 className="personal-subtitulo">Metas de puntos</h3>
            <div className="personal-metas-lista">
              {METAS.map((meta) => {
                const desbloqueado = puntos >= meta.puntos;
                return (
                  <div
                    key={meta.nivel}
                    className={`personal-meta-card ${desbloqueado ? "desbloqueada" : "bloqueada"}`}
                  >
                    <div className="personal-meta-izq">
                      <span className="personal-meta-emoji">{meta.emoji}</span>
                      <div>
                        <p className="personal-meta-nombre">{meta.label}</p>
                        <p className="personal-meta-pts">
                          {meta.puntos} puntos
                        </p>
                      </div>
                    </div>
                    <div className="personal-meta-estado">
                      {desbloqueado ? (
                        <span className="personal-badge-oro">
                          ✅ Desbloqueado
                        </span>
                      ) : (
                        <span className="personal-badge-lock">
                          🔒 Bloqueado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pase dorado si alcanzó alguna meta */}
            {puntos >= METAS[0].puntos && (
              <div className="personal-pase-dorado">
                <div className="personal-pase-brillo" />
                <p className="personal-pase-titulo">🎖️ PASE DORADO</p>
                <p className="personal-pase-nivel">
                  {[...METAS].reverse().find((m) => puntos >= m.puntos)?.label}
                </p>
                <p className="personal-pase-sub">¡Sigue acumulando puntos!</p>
              </div>
            )}
          </>
        )}
      </div>

      <Navar />
    </section>
  );
};

export default Personalhome;
