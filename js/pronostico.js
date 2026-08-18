// ---------------------------------------------------------------
// FASE 6 — Pronóstico desde una API externa (OpenWeatherMap)
// ---------------------------------------------------------------
// Este archivo NO depende de Firebase ni del ESP32 — por eso es la
// parte del proyecto en la que puedes avanzar sin esperar a nadie más.
// Llena: la tarjeta de "Precipitación", el gauge de "Prob. lluvia"
// y las 4 tarjetas de pronóstico por día.
// ---------------------------------------------------------------

// 1. Crea una cuenta gratis en https://openweathermap.org/api
// 2. Ve a "My API keys" y copia tu clave (puede tardar hasta 2 horas
//    en activarse después de crearla — si el fetch falla al inicio,
//    espera un rato antes de asumir que el código está mal).
const API_KEY = "093bd720b8eb448068ddf624f21dfec7";

// Coordenadas de Ciudad de México (más preciso que buscar por nombre).
const LAT = 19.4326;
const LON = -99.1332;

const URL_PRONOSTICO =
  `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}` +
  `&units=metric&lang=es&appid=${API_KEY}`;

// ---- Mapeo de condición climática -> emoji (mismo set que ya usa tu spec) ----
function emojiParaClima(main) {
  const mapa = {
    Clear: "☀️",
    Clouds: "⛅",
    Rain: "🌧️",
    Drizzle: "🌦️",
    Thunderstorm: "⛈️",
    Snow: "❄️",
    Mist: "🌫️",
    Fog: "🌫️",
    Haze: "🌫️"
  };
  return mapa[main] || "🌡️";
}

const DIAS_SEMANA = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
];

async function cargarPronostico() {
  try {
    const respuesta = await fetch(URL_PRONOSTICO);

    if (!respuesta.ok) {
      throw new Error(`API respondió ${respuesta.status}`);
    }

    const datos = await respuesta.json();
    const diasAgrupados = agruparPorDia(datos.list);

    renderizarTarjetasPronostico(diasAgrupados);
    renderizarPrecipitacionYGauge(diasAgrupados[0]);
  } catch (error) {
    console.error("Error cargando el pronóstico:", error);
    mostrarEstadoError();
  }
}

// ---------------------------------------------------------------
// La API regresa un punto cada 3 horas (8 por día). Los agrupamos
// por fecha para poder mostrar un resumen por día en vez de 40 puntos.
// ---------------------------------------------------------------
function agruparPorDia(lista) {
  const porFecha = {};

  lista.forEach((item) => {
    const fecha = item.dt_txt.split(" ")[0]; // "2026-08-17 15:00:00" -> "2026-08-17"
    if (!porFecha[fecha]) porFecha[fecha] = [];
    porFecha[fecha].push(item);
  });

  const fechasOrdenadas = Object.keys(porFecha).sort();

  return fechasOrdenadas.slice(0, 4).map((fecha, indice) => {
    const entradasDelDia = porFecha[fecha];

    // Para el ícono/temperatura representativos, usamos la entrada más
    // cercana al mediodía en vez de un promedio — un promedio entre
    // "soleado a las 9am" y "lluvia a las 6pm" no representa nada real.
    const entradaMediodia = entradasDelDia.reduce((mejor, actual) => {
      const horaMejor = Number(mejor.dt_txt.split(" ")[1].split(":")[0]);
      const horaActual = Number(actual.dt_txt.split(" ")[1].split(":")[0]);
      return Math.abs(horaActual - 14) < Math.abs(horaMejor - 14) ? actual : mejor;
    });

    const probabilidadMaxima = Math.max(...entradasDelDia.map((e) => e.pop || 0));
    const mmAcumulados = entradasDelDia.reduce(
      (suma, e) => suma + (e.rain ? e.rain["3h"] || 0 : 0),
      0
    );

    return {
      etiqueta: etiquetaParaDia(indice, fecha),
      emoji: emojiParaClima(entradaMediodia.weather[0].main),
      descripcion: entradaMediodia.weather[0].description,
      temperatura: Math.round(entradaMediodia.main.temp),
      humedad: Math.round(entradaMediodia.main.humidity),
      probabilidadLluvia: Math.round(probabilidadMaxima * 100),
      mmAcumulados: mmAcumulados
    };
  });
}

function etiquetaParaDia(indice, fechaISO) {
  if (indice === 0) return "Hoy";
  if (indice === 1) return "Mañana";
  const fecha = new Date(fechaISO + "T12:00:00");
  return DIAS_SEMANA[fecha.getDay()];
}

// ---------------------------------------------------------------
// Render: 4 tarjetas de pronóstico
// ---------------------------------------------------------------
function renderizarTarjetasPronostico(dias) {
  const contenedor = document.getElementById("forecast-grid");

  contenedor.innerHTML = dias
    .map(
      (dia, indice) => `
    <div class="forecast-card ${indice === 0 ? "today" : ""}">
      <div class="forecast-day">${dia.etiqueta}</div>
      <div class="forecast-icon">${dia.emoji}</div>
      <div class="forecast-temp">${dia.temperatura}°C</div>
      <div class="forecast-meta">
        <span>💧 ${dia.humedad}%</span>
        <span>🌧 ${dia.probabilidadLluvia}%</span>
      </div>
    </div>
  `
    )
    .join("");
}

// ---------------------------------------------------------------
// Render: tarjeta de "Precipitación" y gauge de "Prob. lluvia",
// ambos con el dato de HOY únicamente.
// ---------------------------------------------------------------
function renderizarPrecipitacionYGauge(hoy) {
  document.getElementById("precip-value").textContent = hoy.mmAcumulados.toFixed(1);
  document.getElementById("precip-estado").textContent =
    hoy.descripcion.charAt(0).toUpperCase() + hoy.descripcion.slice(1);
  document.getElementById("precip-sub").textContent =
    `Probabilidad hoy: ${hoy.probabilidadLluvia}% · fuente: OpenWeatherMap`;

  document.getElementById("dial-rain-value").textContent = `${hoy.probabilidadLluvia}%`;

  const CIRC = 452;
  const offset = CIRC - (CIRC * hoy.probabilidadLluvia) / 100;
  document.getElementById("dial-rain").style.strokeDashoffset = offset;
}

function mostrarEstadoError() {
  document.getElementById("forecast-grid").innerHTML =
    `<div class="forecast-card"><div class="forecast-day">Sin datos de pronóstico — revisa tu API key o la consola (F12)</div></div>`;
  document.getElementById("precip-estado").textContent = "Sin datos";
}

cargarPronostico();