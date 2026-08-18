// Controla el panel lateral en pantallas angostas: se abre como un
// panel deslizante sobre el contenido, en vez de ocupar espacio fijo
// como en escritorio (donde ni siquiera se ejecuta esta lógica, ya
// que el botón .menu-toggle está oculto por CSS).

const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menu-toggle");
const overlay = document.getElementById("sidebar-overlay");

function abrirMenu() {
  sidebar.classList.add("open");
  overlay.classList.add("open");
}

function cerrarMenu() {
  sidebar.classList.remove("open");
  overlay.classList.remove("open");
}

menuToggle.addEventListener("click", abrirMenu);
overlay.addEventListener("click", cerrarMenu);

// Al elegir una sección del menú, filtra qué tarjetas/paneles se muestran
// usando el atributo data-section de cada elemento — no hay páginas
// separadas, todo vive en el mismo index.html, solo se oculta/muestra.
const navItems = document.querySelectorAll(".nav-item");
const metricGrid = document.getElementById("metric-grid");
const gaugeRow = document.getElementById("gauge-row");

function mostrarSeccion(nombreSeccion) {
  // :not(.nav-item) es la corrección clave: los botones del menú también
  // tienen data-section (para saber qué representan), pero no deben
  // ocultarse a sí mismos al filtrar el contenido.
  document.querySelectorAll("[data-section]:not(.nav-item)").forEach((el) => {
    const secciones = el.dataset.section.split(",");
    el.style.display = secciones.includes(nombreSeccion) ? "" : "none";
  });

  // En vistas filtradas (no "dashboard") suele quedar una sola tarjeta
  // visible dentro de un grid pensado para 3 — sin esto, la tarjeta se
  // ve descentrada dentro de columnas vacías.
  const esDashboard = nombreSeccion === "dashboard";
  metricGrid.classList.toggle("filtrado", !esDashboard);
  gaugeRow.classList.toggle("filtrado", !esDashboard);

  // Si la vista corresponde a una métrica con gráfica histórica,
  // sincroniza chart.js para que muestre esa métrica automáticamente.
  const metricasConGrafica = ["temperatura", "humedad", "precipitacion"];
  if (metricasConGrafica.includes(nombreSeccion) && window.mostrarMetrica) {
    window.mostrarMetrica(nombreSeccion);
  }
}

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    navItems.forEach((otro) => otro.classList.remove("active"));
    item.classList.add("active");

    mostrarSeccion(item.dataset.section);
    cerrarMenu();
  });
});

// Vista inicial al cargar la página
mostrarSeccion("dashboard");