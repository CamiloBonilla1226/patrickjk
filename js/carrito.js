// Estado del carrito de compras — funciones simples de JS plano, sin
// clases ni Context/reducer (eso es un patrón de React, aquí no aplica).
//
// ¿Por qué localStorage? En React, el carrito vivía solo en memoria (un
// estado de la app) porque la página nunca se recargaba de verdad: React
// controla la navegación entre pantallas sin volver a cargar el HTML. Aquí
// cada pantalla es un archivo .html distinto — ir de Menú a Carrito SÍ
// recarga el navegador por completo, así que cualquier variable normal se
// perdería en cada cambio de pantalla (o si el cliente cierra el navegador
// a medio pedido). localStorage es memoria del navegador que sobrevive a
// recargar la página y a cerrar/abrir el navegador, así que guardamos ahí
// el carrito cada vez que cambia, y lo volvemos a leer apenas carga
// cualquier página.

const CARRITO_STORAGE_KEY = 'patricksjk_carrito';

// Se lee UNA vez, al cargar este script, y desde ahí se trabaja siempre
// sobre esta variable en memoria — no hace falta leer localStorage en cada
// función, solo hay que recordar escribirlo de nuevo cada vez que cambia.
let itemsCarrito = cargarCarritoDesdeStorage();

/**
 * Lee el carrito guardado en localStorage. Si no hay nada guardado (primera
 * visita) o el dato guardado está corrupto, empieza con un carrito vacío en
 * vez de romper la página.
 */
function cargarCarritoDesdeStorage() {
  const guardado = localStorage.getItem(CARRITO_STORAGE_KEY);
  if (!guardado) return [];
  try {
    return JSON.parse(guardado);
  } catch (error) {
    console.error('El carrito guardado estaba corrupto, se reinicia vacío.', error);
    return [];
  }
}

/** Vuelve a escribir el carrito actual en localStorage, como texto JSON
 * (localStorage solo puede guardar strings, por eso JSON.stringify). */
function guardarCarritoEnStorage() {
  localStorage.setItem(CARRITO_STORAGE_KEY, JSON.stringify(itemsCarrito));
}

/**
 * Agrega un producto al carrito (o le suma 1 a la cantidad si ya estaba).
 * `producto` puede ser un producto de productos.js (con más campos) o
 * cualquier objeto que al menos tenga { id, nombre, precio } — solo esos
 * tres datos se guardan en el carrito.
 */
function agregarAlCarrito(producto) {
  if (producto.estado === 'agotado') {
    console.warn('No se puede agregar un producto agotado:', producto.nombre);
    return;
  }

  const itemExistente = itemsCarrito.find(function (item) {
    return item.id === producto.id;
  });

  if (itemExistente) {
    itemExistente.cantidad += 1;
  } else {
    itemsCarrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1,
    });
  }

  guardarCarritoEnStorage();
  actualizarVistaDelCarrito();
}

/**
 * Resta 1 a la cantidad de un producto en el carrito. Si llega a 0, lo
 * elimina del arreglo por completo (no se queda una fila en "0").
 */
function quitarDelCarrito(id) {
  const item = itemsCarrito.find(function (i) {
    return i.id === id;
  });
  if (!item) return;

  item.cantidad -= 1;
  if (item.cantidad <= 0) {
    itemsCarrito = itemsCarrito.filter(function (i) {
      return i.id !== id;
    });
  }

  guardarCarritoEnStorage();
  actualizarVistaDelCarrito();
}

/** Vacía el carrito por completo. */
function vaciarCarrito() {
  itemsCarrito = [];
  guardarCarritoEnStorage();
  actualizarVistaDelCarrito();
}

/** Devuelve el arreglo actual de items del carrito. */
function obtenerCarrito() {
  return itemsCarrito;
}

/** Suma precio × cantidad de todos los items — el único lugar del proyecto
 * que calcula el subtotal, para no repetir esta cuenta en cada pantalla. */
function calcularSubtotal() {
  return itemsCarrito.reduce(function (suma, item) {
    return suma + item.precio * item.cantidad;
  }, 0);
}

/**
 * Punto único que se llama al final de cada función que modifica el
 * carrito, para refrescar cualquier indicador visual que esté en pantalla
 * en ese momento. Por ahora, el único indicador es la lista del propio
 * Carrito — si más adelante se agrega un contador en la tab de abajo, este
 * es el lugar donde se actualizaría también.
 */
function actualizarVistaDelCarrito() {
  if (typeof renderizarCarrito === 'function') {
    renderizarCarrito();
  }
}

// ============================================================
// Pintado de la pantalla Carrito (carrito.html)
// ============================================================
// Estas funciones solo hacen algo si los elementos de carrito.html existen
// en la página actual — en menu.html o index.html simplemente no encuentran
// nada y no pasa nada, así que es seguro cargar este archivo en todas
// las pantallas para tener siempre disponibles agregarAlCarrito, etc.

function crearFilaCartItem(item) {
  const fila = document.createElement('div');
  fila.className = 'cart-item';

  fila.innerHTML =
    '<div class="row1">' +
      '<h3></h3>' +
      '<span class="cart-item-subtotal"></span>' +
    '</div>' +
    '<div class="cart-item-row2">' +
      '<span class="cart-item-unit"></span>' +
      '<div class="qty-controls">' +
        '<button type="button" class="qty-btn qty-minus" aria-label="Quitar una unidad de ' + item.nombre + '">−</button>' +
        '<span class="qty-value"></span>' +
        '<button type="button" class="qty-btn qty-plus" aria-label="Agregar una unidad de ' + item.nombre + '">+</button>' +
      '</div>' +
    '</div>';

  fila.querySelector('h3').textContent = item.nombre;
  fila.querySelector('.cart-item-subtotal').textContent = formatPrice(item.precio * item.cantidad);
  fila.querySelector('.cart-item-unit').textContent = formatPrice(item.precio) + ' c/u';
  fila.querySelector('.qty-value').textContent = item.cantidad;

  fila.querySelector('.qty-minus').addEventListener('click', function () {
    quitarDelCarrito(item.id);
  });
  // El botón "+" de una fila que ya está en el carrito reutiliza
  // agregarAlCarrito con los mismos datos que ya tiene guardados el item
  // (no necesita volver a consultar productos.js).
  fila.querySelector('.qty-plus').addEventListener('click', function () {
    agregarAlCarrito({ id: item.id, nombre: item.nombre, precio: item.precio, estado: 'disponible' });
  });

  return fila;
}

function renderizarCarrito() {
  const vacio = document.getElementById('carrito-vacio');
  const contenido = document.getElementById('carrito-contenido');
  const lista = document.getElementById('carrito-lista');
  const totalEl = document.getElementById('carrito-total');
  // Si estos elementos no existen, no estamos en carrito.html — no hay
  // nada que pintar en esta página.
  if (!vacio || !contenido || !lista || !totalEl) return;

  const items = obtenerCarrito();

  if (items.length === 0) {
    vacio.hidden = false;
    contenido.hidden = true;
    return;
  }

  vacio.hidden = true;
  contenido.hidden = false;

  lista.innerHTML = '';
  items.forEach(function (item) {
    lista.appendChild(crearFilaCartItem(item));
  });

  totalEl.textContent = formatPrice(calcularSubtotal());
}

// ---- Modal de confirmación para "Vaciar carrito" ----
// Un modal casero con <div> + CSS en vez de confirm() del navegador, que el
// enunciado de la tarea pide evitar porque bloquea la página y se ve feo.
function abrirModalVaciar() {
  const modal = document.getElementById('modal-vaciar');
  if (modal) modal.hidden = false;
}

function cerrarModalVaciar() {
  const modal = document.getElementById('modal-vaciar');
  if (modal) modal.hidden = true;
}

document.addEventListener('DOMContentLoaded', function () {
  renderizarCarrito();

  const btnVaciar = document.getElementById('btn-vaciar-carrito');
  const btnCancelar = document.getElementById('modal-cancelar');
  const btnConfirmar = document.getElementById('modal-confirmar');
  const modal = document.getElementById('modal-vaciar');

  if (btnVaciar) btnVaciar.addEventListener('click', abrirModalVaciar);
  if (btnCancelar) btnCancelar.addEventListener('click', cerrarModalVaciar);
  if (btnConfirmar) {
    btnConfirmar.addEventListener('click', function () {
      vaciarCarrito();
      cerrarModalVaciar();
    });
  }
  // Cerrar el modal tocando el fondo oscuro, igual que un modal normal.
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) cerrarModalVaciar();
    });
  }
});
