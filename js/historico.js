// ---------------------------------------------------------------
// FASE 5 — Histórico real desde Firebase
// ---------------------------------------------------------------
// Este archivo NO sabe cómo dibujar la gráfica — eso es trabajo de
// chart.js. Su única responsabilidad es: leer /historico, convertir
// los números en puntos de un path SVG, y entregárselos a chart.js
// mediante window.actualizarMetricaConDatosReales().
//
// La precipitación no se actualiza aquí a propósito: no viene del
// sensor (decisión tomada en el plan original), así que sigue usando
// el dato de ejemplo de chart.js hasta la Fase 6 (API de pronóstico).
// ---------------------------------------------------------------

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, query, orderByKey, limitToLast, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

// Reutiliza la misma app que ya haya sido inicializada por script.js,
// en vez de inicializar Firebase dos veces en la misma página.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getDatabase(app);

// Trae los últimos 24 puntos guardados. Con el ESP32 escribiendo a
// /historico cada 30 minutos (Fase 2), esto cubre ~12 horas — coincide
// con el título que ya trae la gráfica por defecto.
const historicoQuery = query(ref(db, "/historico"), orderByKey(), limitToLast(24));

// ---- Geometría del SVG (debe coincidir con el viewBox de index.html) ----
const ANCHO = 760;
const MARGEN_SUPERIOR = 30;  // qué tan cerca del techo puede llegar la línea
const MARGEN_INFERIOR = 190; // qué tan cerca del piso puede llegar la línea

// ---- Rangos de referencia para escalar cada métrica al alto del SVG ----
const RANGOS = {
  temperatura: { min: 10, max: 35 },
  humedad: { min: 0, max: 100 }
};

onValue(historicoQuery, (snapshot) => {
  const datos = snapshot.val();
  if (!datos) return; // todavía no hay histórico guardado, no hay nada que dibujar

  // Object.values() respeta el orden de inserción de las claves de push
  // de Firebase, que ya vienen ordenadas cronológicamente.
  const registros = Object.values(datos);

  const temperaturas = registros
    .map((r) => r.temperatura)
    .filter((v) => typeof v === "number");

  const humedades = registros
    .map((r) => r.humedad)
    .filter((v) => typeof v === "number");

  if (temperaturas.length >= 2) {
    const path = valoresAPathSVG(temperaturas, RANGOS.temperatura);
    window.actualizarMetricaConDatosReales(
      "temperatura",
      path,
      "Evolución — Temperatura (en vivo)"
    );
  }

  if (humedades.length >= 2) {
    const path = valoresAPathSVG(humedades, RANGOS.humedad);
    window.actualizarMetricaConDatosReales(
      "humedad",
      path,
      "Evolución — Humedad (en vivo)"
    );
  }
});

// ---------------------------------------------------------------
// Convierte un arreglo de números en un path SVG suave (curva, no
// líneas rectas) usando Catmull-Rom convertido a curvas Bézier —
// el mismo tipo de curva que ya se usaba en los paths de ejemplo.
// ---------------------------------------------------------------
function valoresAPathSVG(valores, rango) {
  const puntos = valoresAPuntos(valores, rango.min, rango.max);
  return puntosASVGSuave(puntos);
}

function valoresAPuntos(valores, min, max) {
  const paso = ANCHO / (valores.length - 1);
  return valores.map((valor, i) => {
    const valorAcotado = Math.max(min, Math.min(max, valor));
    const proporcion = (valorAcotado - min) / (max - min);
    const y = MARGEN_INFERIOR - proporcion * (MARGEN_INFERIOR - MARGEN_SUPERIOR);
    return [i * paso, y];
  });
}

function puntosASVGSuave(puntos) {
  if (puntos.length < 2) return "";

  let d = `M${puntos[0][0]},${puntos[0][1]}`;

  for (let i = 0; i < puntos.length - 1; i++) {
    const p0 = puntos[i === 0 ? i : i - 1];
    const p1 = puntos[i];
    const p2 = puntos[i + 1];
    const p3 = puntos[i + 2 < puntos.length ? i + 2 : i + 1];

    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }

  return d;
}