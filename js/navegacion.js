// Lógica compartida por las tres pantallas (Inicio, Menú, Carrito):
// - el estado "Abierto/Cerrado" del encabezado superior
// - resaltar la pestaña activa en la barra inferior
//
// Cada archivo .html define window.PAGINA_ACTUAL ('inicio' | 'menu' | 'carrito')
// antes de cargar este script, para que sepamos qué botón marcar como activo.

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

document.addEventListener('DOMContentLoaded', function () {
  pintarEstadoAbierto();
  marcarTabActiva();
});
