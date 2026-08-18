// Animación de entrada de los medidores circulares (dato de ejemplo, fijo).
// circunferencia = 2 * PI * r, con r=72 -> ~452.4
const CIRC = 452;

function setDial(id, percent) {
  const el = document.getElementById(id);
  const offset = CIRC - (CIRC * percent / 100);
  requestAnimationFrame(() => {
    el.style.strokeDashoffset = offset;
  });
}

// Temperatura 24.5 sobre un máximo de referencia de 40°C
setDial('dial-temp', (24.5 / 40) * 100);
// Humedad relativa directa
setDial('dial-hum', 58);
// Probabilidad de lluvia directa
setDial('dial-rain', 70);

// Reloj de "última actualización" — en esta fase es solo la hora local,
// en Fase 4 este texto vendrá del timestamp real de Firebase.
function actualizarReloj() {
  const ahora = new Date();
  const hh = String(ahora.getHours()).padStart(2, '0');
  const mm = String(ahora.getMinutes()).padStart(2, '0');
  document.getElementById('clock-text').textContent = `Última actualización: ${hh}:${mm}`;
}

actualizarReloj();