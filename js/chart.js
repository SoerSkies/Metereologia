// Controla las pestañas de la gráfica histórica. Por ahora usa datos de
// ejemplo por métrica (mismo estilo que la Fase 3) — en la Fase 5, cuando
// conectemos /historico de Firebase, la función dibujarPath() es la única
// parte que cambia: en vez de leer de DATOS_EJEMPLO, va a generar el path
// a partir de las lecturas reales.

// Controla las pestañas de la gráfica histórica. Arranca con datos de
// ejemplo para que la gráfica nunca se vea vacía mientras Firebase responde.
// historico.js (Fase 5) llama a window.actualizarMetricaConDatosReales()
// para reemplazar estos valores por lecturas reales — chart.js no sabe
// nada de Firebase, solo sabe dibujar lo que le den.

let DATOS = {
  temperatura: {
    color: "#2DE2E6",
    linea: "M0,150 C60,140 90,110 140,105 C200,98 230,60 290,55 C350,50 380,80 440,75 C500,70 540,40 600,38 C660,36 700,55 760,50",
    titulo: "Evolución — Temperatura, últimas 12 horas"
  },
  humedad: {
    color: "#4C8DFF",
    linea: "M0,90 C60,100 90,95 140,110 C200,120 230,100 290,90 C350,80 380,95 440,100 C500,105 540,85 600,80 C660,75 700,90 760,85",
    titulo: "Evolución — Humedad, últimas 12 horas"
  },
  precipitacion: {
    color: "#3ADB8F",
    linea: "M0,180 C60,178 90,175 140,170 C200,165 230,120 290,90 C350,70 380,110 440,150 C500,170 540,175 600,178 C660,179 700,180 760,180",
    titulo: "Evolución — Precipitación (estimada, ver Fase 6)"
  }
};

let metricaActiva = "temperatura";

const tabs = document.querySelectorAll(".chart-tab");
const chartLine = document.getElementById("chart-line");
const chartArea = document.getElementById("chart-area");
const chartTitle = document.getElementById("chart-title");
const areaStopTop = document.getElementById("area-stop-top");
const areaStopBottom = document.getElementById("area-stop-bottom");

function mostrarMetrica(nombreMetrica) {
  const datos = DATOS[nombreMetrica];
  if (!datos) return;

  metricaActiva = nombreMetrica;

  // Línea y área comparten el mismo trazo, el área solo le agrega el
  // cierre hacia abajo (L760,200 L0,200 Z) para rellenar por debajo.
  chartLine.setAttribute("d", datos.linea);
  chartArea.setAttribute("d", `${datos.linea} L760,200 L0,200 Z`);

  chartLine.setAttribute("stroke", datos.color);
  areaStopTop.setAttribute("stop-color", datos.color);
  areaStopBottom.setAttribute("stop-color", datos.color);

  chartTitle.textContent = datos.titulo;

  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.metric === nombreMetrica);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => mostrarMetrica(tab.dataset.metric));
});

// Expuesto para que nav.js pueda sincronizar la gráfica cuando el usuario
// entra a la vista de "Temperatura", "Humedad" o "Precipitación" desde el
// menú — chart.js sigue sin saber nada de navegación, solo presta esta función.
window.mostrarMetrica = mostrarMetrica;

// Punto de entrada para historico.js (o cualquier otro archivo que traiga
// datos reales más adelante). No importa de dónde vengan los datos —
// chart.js solo necesita un path SVG ya calculado y un título.
window.actualizarMetricaConDatosReales = function (nombreMetrica, pathSVG, titulo) {
  if (!DATOS[nombreMetrica]) return;

  DATOS[nombreMetrica].linea = pathSVG;
  if (titulo) DATOS[nombreMetrica].titulo = titulo;

  // Si la pestaña que se acaba de actualizar es la que está visible,
  // redibuja de inmediato. Si el usuario está viendo otra métrica,
  // el dato ya quedó guardado y se mostrará en cuanto haga click ahí.
  if (metricaActiva === nombreMetrica) {
    mostrarMetrica(nombreMetrica);
  }
};