// Lógica compartida por las tres pantallas (Inicio, Menú, Carrito):
// - el estado "Abierto/Cerrado" del encabezado superior
// - resaltar la pestaña activa en la barra inferior
// - deslizar con el dedo para cambiar de pantalla (ver el bloque de swipe
//   más abajo)
//
// Cada archivo .html define window.PAGINA_ACTUAL ('inicio' | 'menu' | 'carrito')
// antes de cargar este script, para que sepamos qué botón marcar como activo
// y a qué pantalla ir al deslizar.

// Jueves, viernes, sábado y domingo abren hasta la 1am (horario extendido).
var DIAS_TRASNOCHE = [4, 5, 6, 0];
var HORA_APERTURA = 17; // 5pm, igual todos los días

/**
 * true si a la hora de `fecha` el local está abierto, según:
 * - jueves, viernes, sábado y domingo: 5pm a 1am (del día siguiente)
 * - lunes, martes y miércoles: 5pm a 11pm
 */
function estaAbiertoAhora(fecha) {
  fecha = fecha || new Date();
  var dia = fecha.getDay();
  var hora = fecha.getHours();
  var diaAnterior = (dia + 6) % 7;

  if (hora >= HORA_APERTURA) {
    return DIAS_TRASNOCHE.indexOf(dia) !== -1 || hora < 23;
  }
  if (hora < 1 && DIAS_TRASNOCHE.indexOf(diaAnterior) !== -1) {
    return true;
  }
  return false;
}

function pintarEstadoAbierto() {
  var pill = document.querySelector('.openpill');
  if (!pill) return;
  var abierto = estaAbiertoAhora();
  pill.classList.toggle('openpill-closed', !abierto);
  var texto = pill.querySelector('.estado-texto');
  if (texto) texto.textContent = abierto ? 'Abierto' : 'Cerrado';
}

function marcarTabActiva() {
  var pagina = window.PAGINA_ACTUAL;
  var botones = document.querySelectorAll('.tabbar a[data-tab]');
  botones.forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.tab === pagina);
  });
}

// ---- Toast de confirmación ----
// Mensaje pequeño que aparece un par de segundos y desaparece solo, para
// confirmar una acción (como "agregado al carrito") sin usar alert(), que
// bloquea toda la página hasta que el cliente le da clic a "Aceptar".
var idTimeoutToast = null;

function mostrarToast(mensaje) {
  var toast = document.getElementById('toast');
  // El toast se crea la primera vez que se necesita, en vez de tenerlo
  // repetido en cada .html — así solo existe en las páginas que de verdad
  // lo usan.
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.querySelector('.app').appendChild(toast);
  }

  toast.textContent = mensaje;
  toast.classList.add('toast-visible');

  clearTimeout(idTimeoutToast);
  idTimeoutToast = setTimeout(function () {
    toast.classList.remove('toast-visible');
  }, 1600);
}

// ---- Deslizar para cambiar de pantalla (swipe) ----
// Mismo gesto que en el proyecto React (ver src/utils/useSwipeNavigation.js
// ahí): un arrastre horizontal de al menos SWIPE_THRESHOLD píxeles, más
// horizontal que vertical, cambia de pantalla. Como aquí cada pantalla es
// un archivo .html distinto (no una sola app que cambia de vista sin
// recargar), "cambiar de pantalla" simplemente navega a otro .html.
var SWIPE_THRESHOLD = 50; // px mínimos horizontales para contar como swipe
var DIRECTION_RATIO = 1.5; // qué tan horizontal debe ser el gesto frente a lo vertical

var TAB_ORDER = ['inicio', 'menu', 'ofertas', 'carrito'];
var TAB_URLS = { inicio: 'index.html', menu: 'menu.html', ofertas: 'ofertas.html', carrito: 'carrito.html' };

/** Navega a la pantalla siguiente (paso=1) o anterior (paso=-1) en TAB_ORDER; no hace nada si ya está en el extremo. */
function irAPantallaAdyacente(paso) {
  var indiceActual = TAB_ORDER.indexOf(window.PAGINA_ACTUAL);
  if (indiceActual === -1) return;
  var siguiente = TAB_ORDER[indiceActual + paso];
  if (siguiente) window.location.href = TAB_URLS[siguiente];
}

/**
 * Agrega el gesto de swipe horizontal a `elemento`. No dispara nada si el
 * arrastre empieza dentro de algo marcado `data-no-swipe` (el buscador del
 * Menú, el carrusel de Inicio — elementos que ya usan el toque para lo
 * suyo), ni si `opciones.estaDeshabilitado()` devuelve true (por ejemplo,
 * con la ficha de producto o algún modal abierto encima).
 */
function agregarSwipeHandlers(elemento, opciones) {
  var inicioToque = null;

  elemento.addEventListener(
    'touchstart',
    function (e) {
      if ((opciones.estaDeshabilitado && opciones.estaDeshabilitado()) || e.target.closest('[data-no-swipe]')) {
        inicioToque = null;
        return;
      }
      var touch = e.touches[0];
      inicioToque = { x: touch.clientX, y: touch.clientY };
    },
    { passive: true },
  );

  elemento.addEventListener(
    'touchend',
    function (e) {
      if (!inicioToque) return;
      var touch = e.changedTouches[0];
      var dx = touch.clientX - inicioToque.x;
      var dy = touch.clientY - inicioToque.y;
      inicioToque = null;

      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      if (Math.abs(dx) < Math.abs(dy) * DIRECTION_RATIO) return; // gesto más vertical que horizontal: scroll normal

      if (dx < 0) {
        if (opciones.onSwipeLeft) opciones.onSwipeLeft();
      } else if (opciones.onSwipeRight) {
        opciones.onSwipeRight();
      }
    },
    { passive: true },
  );

  elemento.addEventListener('touchcancel', function () {
    inicioToque = null;
  });
}

/** true si algún modal/ficha está abierto en la pantalla actual — el swipe se desactiva mientras tanto. */
function hayAlgunModalAbierto() {
  var overlaysAbiertos = document.querySelectorAll(
    '.modal-backdrop:not([hidden]), .ficha-overlay:not([hidden])',
  );
  return overlaysAbiertos.length > 0;
}

function configurarSwipeDePantalla() {
  var main = document.querySelector('main');
  if (main) {
    agregarSwipeHandlers(main, {
      estaDeshabilitado: hayAlgunModalAbierto,
      // En el Menú, deslizar primero recorre las categorías (avanzarCategoria/
      // retrocederCategoria, definidas en menu.js) y solo cambia de pantalla
      // al pasarse de la primera o la última categoría — por eso, si esas
      // funciones existen y devuelven true (ya manejaron el gesto), no se
      // navega a otra pantalla encima.
      onSwipeLeft: function () {
        if (typeof avanzarCategoria === 'function' && avanzarCategoria()) return;
        irAPantallaAdyacente(1);
      },
      onSwipeRight: function () {
        if (typeof retrocederCategoria === 'function' && retrocederCategoria()) return;
        irAPantallaAdyacente(-1);
      },
    });
  }

  // Deslizar sobre la barra de navegación de abajo siempre cambia de
  // pantalla directamente, sin pasar por las categorías del Menú.
  var tabbar = document.querySelector('.tabbar');
  if (tabbar) {
    agregarSwipeHandlers(tabbar, {
      onSwipeLeft: function () {
        irAPantallaAdyacente(1);
      },
      onSwipeRight: function () {
        irAPantallaAdyacente(-1);
      },
    });
  }
}

// ---- Insignia del carrito en la barra inferior ----
// Muestra la cantidad total de unidades en el carrito sobre el ícono de la
// tab "Carrito", en cualquier pantalla que tenga la barra inferior. Se
// actualiza desde actualizarVistaDelCarrito (js/carrito.js), el único punto
// por el que pasa cualquier cambio al carrito.
function calcularCantidadTotalCarrito() {
  if (typeof obtenerCarrito !== 'function') return 0;
  return obtenerCarrito().reduce(function (total, item) {
    return total + item.cantidad;
  }, 0);
}

function actualizarBadgeCarrito(animar) {
  var badge = document.getElementById('tab-carrito-badge');
  if (!badge) return;

  var cantidad = calcularCantidadTotalCarrito();
  badge.textContent = cantidad > 99 ? '99+' : String(cantidad);
  badge.hidden = cantidad === 0;

  if (animar && cantidad > 0) {
    // Quitar y volver a poner la clase (con un respiro de por medio) es lo
    // que permite que la animación se vuelva a disparar aunque ya estuviera
    // puesta de un agregado anterior — si solo se agregara la clase, el
    // navegador no la repite porque, a sus ojos, "no cambió nada".
    badge.classList.remove('tab-badge-animar');
    void badge.offsetWidth;
    badge.classList.add('tab-badge-animar');
  }
}

// ---- "Slot" de promoción en Inicio (banner de ruleta / oferta destacada) ----
// Dos módulos deciden, cada uno por su lado y por red, si algo se muestra
// ahí (actualizarBannerRuleta en inicio.js, cargarOfertaDestacada en
// ofertas.js). Mientras cualquiera de los dos sigue esperando respuesta de
// Supabase, #promo-skeleton reserva el espacio (ver esa clase en
// estilos.css) para que el resto de Inicio no salte de golpe cuando por fin
// se sabe si hay algo que mostrar. Cada uno avisa aquí cuando termina.
var promoChecksPendientes = 2;
function marcarPromoCheckListo() {
  promoChecksPendientes -= 1;
  if (promoChecksPendientes > 0) return;
  var skeleton = document.getElementById('promo-skeleton');
  if (skeleton) skeleton.hidden = true;
}

document.addEventListener('DOMContentLoaded', function () {
  pintarEstadoAbierto();
  marcarTabActiva();
  configurarSwipeDePantalla();
  actualizarBadgeCarrito(false);
});
