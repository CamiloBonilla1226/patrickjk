// Ficha de producto: el panel que se abre al tocar una tarjeta (en Inicio o
// en Menú) con la foto grande, el estado, y — si el producto tiene sabores
// (ver productos.js) — el selector de sabor obligatorio antes de poder
// agregarlo al carrito. Es el mismo panel en las dos pantallas: cada una
// solo necesita tener su propio bloque de HTML oculto (ver el comentario
// "Ficha de producto" en menu.html / index.html) y cargar este archivo.
//
// Al igual que carrito.js, todas estas funciones buscan sus elementos por
// id y no hacen nada si no los encuentran — así es igual de seguro cargar
// este archivo en cualquier pantalla.

const FICHA_FEEDBACK_MS = 1500; // cuánto dura el "¡Agregado!" antes de volver a "Agregar al carrito"

let productoAbiertoEnFicha = null; // el producto completo (de productos.js) que muestra la ficha ahora mismo
let saborSeleccionadoEnFicha = null;
let elementoConFocoAntesDeLaFicha = null;

function elementosFicha() {
  return {
    overlay: document.getElementById('ficha-overlay'),
    sheet: document.getElementById('ficha-sheet'),
    cerrar: document.getElementById('ficha-cerrar'),
    imagen: document.getElementById('ficha-imagen'),
    nombre: document.getElementById('ficha-nombre'),
    estadoTexto: document.getElementById('ficha-estado-texto'),
    estadoSpan: document.getElementById('ficha-estado'),
    categoria: document.getElementById('ficha-categoria'),
    saboresGrupo: document.getElementById('ficha-sabores-grupo'),
    saborHint: document.getElementById('ficha-sabor-hint'),
    optRow: document.getElementById('ficha-opt-row'),
    precio: document.getElementById('ficha-precio'),
    agregarBtn: document.getElementById('ficha-agregar-btn'),
  };
}

/** Pinta el contenido de la ficha para `producto` (llamada al abrir y cada vez que cambia el sabor elegido). */
function pintarFicha(producto) {
  const els = elementosFicha();
  const disponible = producto.estado === 'disponible';
  const requiereSabor = Boolean(producto.sabores && producto.sabores.length);

  els.imagen.src = producto.imagen || '';
  els.imagen.alt = producto.nombre;
  els.nombre.textContent = producto.nombre;
  els.categoria.textContent = producto.categoria;
  els.precio.textContent = formatPrice(producto.precio);

  els.estadoTexto.textContent = disponible ? 'Disponible' : 'Agotado';
  els.estadoSpan.className = 'status' + (disponible ? ' ok' : '');

  if (requiereSabor) {
    els.saboresGrupo.hidden = false;
    els.saborHint.hidden = Boolean(saborSeleccionadoEnFicha);

    els.optRow.innerHTML = '';
    producto.sabores.forEach(function (sabor) {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'ficha-opt';
      boton.setAttribute('role', 'radio');
      boton.setAttribute('aria-checked', String(sabor === saborSeleccionadoEnFicha));
      boton.textContent = sabor;
      boton.addEventListener('click', function () {
        saborSeleccionadoEnFicha = sabor;
        pintarFicha(producto);
      });
      els.optRow.appendChild(boton);
    });
  } else {
    els.saboresGrupo.hidden = true;
  }

  const faltaElegirSabor = requiereSabor && !saborSeleccionadoEnFicha;
  els.agregarBtn.disabled = !disponible || faltaElegirSabor;
  els.agregarBtn.textContent = !disponible ? 'Agotado' : 'Agregar al carrito';
}

/** Abre la ficha del producto con este id (de productos.js). No hace nada si el id no existe o la página no tiene el panel de ficha. */
function abrirFichaProducto(productId) {
  const els = elementosFicha();
  if (!els.overlay) return;

  const producto = productos.find(function (p) {
    return p.id === productId;
  });
  if (!producto) return;

  productoAbiertoEnFicha = producto;
  saborSeleccionadoEnFicha = null;
  pintarFicha(producto);

  elementoConFocoAntesDeLaFicha = document.activeElement;
  els.overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  els.cerrar.focus();
}

function cerrarFichaProducto() {
  const els = elementosFicha();
  if (!els.overlay) return;

  els.overlay.hidden = true;
  document.body.style.overflow = '';
  productoAbiertoEnFicha = null;

  if (elementoConFocoAntesDeLaFicha) elementoConFocoAntesDeLaFicha.focus();
}

function manejarAgregarDesdeFicha() {
  if (!productoAbiertoEnFicha) return;
  const requiereSabor = Boolean(productoAbiertoEnFicha.sabores && productoAbiertoEnFicha.sabores.length);
  if (productoAbiertoEnFicha.estado === 'agotado') return;
  if (requiereSabor && !saborSeleccionadoEnFicha) return;

  agregarAlCarrito({
    id: productoAbiertoEnFicha.id,
    nombre: productoAbiertoEnFicha.nombre,
    precio: productoAbiertoEnFicha.precio,
    estado: productoAbiertoEnFicha.estado,
    sabor: requiereSabor ? saborSeleccionadoEnFicha : undefined,
  });

  if (typeof mostrarToast === 'function') {
    mostrarToast(productoAbiertoEnFicha.nombre + ' agregado al carrito');
  }

  const els = elementosFicha();
  const productoAgregado = productoAbiertoEnFicha;
  els.agregarBtn.disabled = true;
  els.agregarBtn.textContent = '¡Agregado!';
  saborSeleccionadoEnFicha = null;

  setTimeout(function () {
    // Si el cliente ya cerró la ficha (o abrió otro producto) para cuando
    // se cumple el tiempo, no hay que pintar nada encima de lo nuevo.
    if (productoAbiertoEnFicha === productoAgregado) pintarFicha(productoAgregado);
  }, FICHA_FEEDBACK_MS);
}

document.addEventListener('DOMContentLoaded', function () {
  const els = elementosFicha();
  if (!els.overlay) return; // esta página no tiene el panel de ficha

  els.cerrar.addEventListener('click', cerrarFichaProducto);
  els.agregarBtn.addEventListener('click', manejarAgregarDesdeFicha);

  // Clic en el fondo oscuro para cerrar (el overlay ocupa toda la pantalla;
  // el "fondo" es cualquier clic que no caiga dentro de la tarjeta .ficha-sheet).
  els.overlay.addEventListener('click', function (e) {
    if (e.target === els.overlay) cerrarFichaProducto();
  });

  document.addEventListener('keydown', function (e) {
    if (els.overlay.hidden) return;

    if (e.key === 'Escape') {
      cerrarFichaProducto();
      return;
    }

    if (e.key !== 'Tab') return;
    const focosPosibles = els.sheet.querySelectorAll('button:not([disabled]), a[href]');
    if (focosPosibles.length === 0) return;
    const primero = focosPosibles[0];
    const ultimo = focosPosibles[focosPosibles.length - 1];

    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  });
});
