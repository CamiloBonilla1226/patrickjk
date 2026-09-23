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
 * cualquier objeto que al menos tenga { id, nombre, precio }; si tiene
 * `sabor`, esa fila del carrito queda ligada a ese sabor.
 *
 * Cada fila del carrito tiene su propio `id` (un identificador al azar,
 * distinto del id del producto) — hace falta porque un mismo producto con
 * dos sabores distintos ("Electrolit Uva" y "Electrolit Fresa Kiwi") deben
 * quedar en DOS filas separadas del carrito, no fusionarse en una. El id
 * del producto se guarda aparte, en `productId`, para poder identificar de
 * qué producto se trata sin depender del id de la fila.
 */
function agregarAlCarrito(producto) {
  if (producto.estado === 'agotado') {
    console.warn('No se puede agregar un producto agotado:', producto.nombre);
    return;
  }

  const sabor = producto.sabor || undefined;
  const itemExistente = itemsCarrito.find(function (item) {
    return item.productId === producto.id && item.sabor === sabor;
  });

  if (itemExistente) {
    itemExistente.cantidad += 1;
  } else {
    itemsCarrito.push({
      id: crypto.randomUUID(),
      productId: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1,
      sabor: sabor,
    });
  }

  guardarCarritoEnStorage();
  actualizarVistaDelCarrito();
}

/**
 * Resta 1 a la cantidad de una fila del carrito (identificada por el `id`
 * de la fila, no el del producto). Si llega a 0, la elimina del arreglo
 * por completo (no se queda una fila en "0").
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

/**
 * Cuántas unidades de este producto (con este sabor, si aplica) hay ahora
 * mismo en el carrito. Se usa en el Menú para pintar el control -/+ de cada
 * tarjeta con el número correcto apenas se carga la página.
 */
function obtenerCantidadEnCarrito(productId, sabor) {
  const item = itemsCarrito.find(function (i) {
    return i.productId === productId && i.sabor === (sabor || undefined);
  });
  return item ? item.cantidad : 0;
}

/**
 * Como quitarDelCarrito, pero identificando la fila por el id del PRODUCTO
 * (y su sabor) en vez del id de la fila — para pantallas como el Menú, que
 * no guardan el id interno de cada fila del carrito.
 */
function quitarUnidadDeProductoDelCarrito(productId, sabor) {
  const item = itemsCarrito.find(function (i) {
    return i.productId === productId && i.sabor === (sabor || undefined);
  });
  if (!item) return;
  quitarDelCarrito(item.id);
}

/** Vacía el carrito por completo. */
function vaciarCarrito() {
  itemsCarrito = [];
  guardarCarritoEnStorage();
  guardarCodigoPremio(null); // un carrito nuevo no arrastra el premio de una compra anterior
  actualizarVistaDelCarrito();
}

/** Devuelve el arreglo actual de items del carrito. */
function obtenerCarrito() {
  return itemsCarrito;
}

// ---- Código del premio de la ruleta (Tarea 4) ----
// El premio no es un producto, así que no vive dentro de itemsCarrito —
// pero igual necesita sobrevivir a la navegación de carrito.html a
// entrega.html, por la misma razón que el carrito: cada pantalla es un
// .html distinto, así que solo localStorage aguanta ese salto.
const PREMIO_STORAGE_KEY = 'patricksjk_premio_ruleta';
let codigoPremioActual = localStorage.getItem(PREMIO_STORAGE_KEY) || null;

/** Guarda el código de premio ganado en la ruleta (o lo borra, si se le pasa null/vacío). */
function guardarCodigoPremio(codigo) {
  codigoPremioActual = codigo || null;
  if (codigoPremioActual) {
    localStorage.setItem(PREMIO_STORAGE_KEY, codigoPremioActual);
  } else {
    localStorage.removeItem(PREMIO_STORAGE_KEY);
  }
}

/** Devuelve el código de premio guardado para esta compra, o null si no hay. */
function obtenerCodigoPremioCarrito() {
  return codigoPremioActual;
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

  const nombreConSabor = item.nombre + (item.sabor ? ' (' + item.sabor + ')' : '');

  fila.innerHTML =
    '<div class="row1">' +
      '<h3></h3>' +
      '<span class="cart-item-subtotal"></span>' +
    '</div>' +
    '<div class="cart-item-row2">' +
      '<span class="cart-item-unit"></span>' +
      '<div class="qty-controls">' +
        '<button type="button" class="qty-btn qty-minus" aria-label="Quitar una unidad de ' + nombreConSabor + '">−</button>' +
        '<span class="qty-value"></span>' +
        '<button type="button" class="qty-btn qty-plus" aria-label="Agregar una unidad de ' + nombreConSabor + '">+</button>' +
      '</div>' +
    '</div>';

  fila.querySelector('h3').textContent = nombreConSabor;
  fila.querySelector('.cart-item-subtotal').textContent = formatPrice(item.precio * item.cantidad);
  fila.querySelector('.cart-item-unit').textContent = formatPrice(item.precio) + ' c/u';
  fila.querySelector('.qty-value').textContent = item.cantidad;

  fila.querySelector('.qty-minus').addEventListener('click', function () {
    quitarDelCarrito(item.id);
  });
  // El botón "+" de una fila que ya está en el carrito reutiliza
  // agregarAlCarrito con los mismos datos que ya tiene guardados el item
  // (no necesita volver a consultar productos.js). item.productId || item.id
  // es por compatibilidad con carritos guardados antes de que existiera el
  // campo productId — si no está, el id de la fila ya hacía ese papel.
  fila.querySelector('.qty-plus').addEventListener('click', function () {
    agregarAlCarrito({
      id: item.productId || item.id,
      nombre: item.nombre,
      precio: item.precio,
      estado: 'disponible',
      sabor: item.sabor,
    });
  });

  return fila;
}

function renderizarCarrito() {
  const vacio = document.getElementById('carrito-vacio');
  const contenido = document.getElementById('carrito-contenido');
  const lista = document.getElementById('carrito-lista');
  const totalEl = document.getElementById('carrito-total');
  const btnContinuar = document.getElementById('btn-continuar');
  // Si estos elementos no existen, no estamos en carrito.html — no hay
  // nada que pintar en esta página.
  if (!vacio || !contenido || !lista || !totalEl) return;

  const items = obtenerCarrito();

  if (items.length === 0) {
    vacio.hidden = false;
    contenido.hidden = true;
    if (btnContinuar) btnContinuar.disabled = true;
    ocultarSugerencias();
    return;
  }

  vacio.hidden = true;
  contenido.hidden = false;

  lista.innerHTML = '';
  items.forEach(function (item) {
    lista.appendChild(crearFilaCartItem(item));
  });

  totalEl.textContent = formatPrice(calcularSubtotal());
  // "Continuar pedido" solo tiene sentido si hay al menos un producto.
  if (btnContinuar) btnContinuar.disabled = false;

  renderizarSugerencias();
}

// ---- "¿Quieres agregar algo más?" ----
// Una fila de productos baratos y disponibles, para que sea fácil
// completar el pedido sin volver al Menú. Solo aparece con el carrito con
// productos, y nunca repite algo que ya está en el carrito.
const SUGERENCIAS_PRECIO_MAX = 20000;
const SUGERENCIAS_CANTIDAD = 5;

// Se baraja una sola vez por visita a carrito.html (no cada vez que se
// agrega/quita un producto) para que la selección no cambie de golpe
// mientras el cliente sigue armando su pedido.
let productosSugeridosBase = null;

function barajarProductos(arreglo) {
  const resultado = arreglo.slice();
  for (let i = resultado.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temporal = resultado[i];
    resultado[i] = resultado[j];
    resultado[j] = temporal;
  }
  return resultado;
}

function obtenerProductosSugeridos() {
  if (!productosSugeridosBase) {
    const candidatos = (typeof productos !== 'undefined' ? productos : []).filter(function (p) {
      return p.estado === 'disponible' && p.precio < SUGERENCIAS_PRECIO_MAX;
    });
    productosSugeridosBase = barajarProductos(candidatos).slice(0, SUGERENCIAS_CANTIDAD);
  }
  return productosSugeridosBase;
}

function crearTarjetaSugerencia(producto) {
  const wrap = document.createElement('div');
  wrap.className = 'rail-card-wrap';
  wrap.innerHTML =
    '<button class="rail-card" type="button">' +
      '<div class="cupwrap">' +
        '<img src="' + producto.imagen + '" alt="' + producto.nombre + '" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy" decoding="async">' +
      '</div>' +
      '<h3></h3>' +
      '<div class="price">' + formatPrice(producto.precio) + '</div>' +
    '</button>' +
    '<button type="button" class="rail-quick-add" aria-label="Agregar ' + producto.nombre + ' al carrito">' +
      '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14" /></svg>' +
    '</button>';

  wrap.querySelector('h3').textContent = producto.nombre;

  wrap.querySelector('.rail-card').addEventListener('click', function () {
    if (typeof abrirFichaProducto === 'function') abrirFichaProducto(producto.id);
  });

  wrap.querySelector('.rail-quick-add').addEventListener('click', function () {
    // Igual que en el Menú: si el producto tiene sabores, el "+" rápido
    // abre la ficha en vez de agregar directo.
    if (producto.sabores && producto.sabores.length) {
      if (typeof abrirFichaProducto === 'function') abrirFichaProducto(producto.id);
      return;
    }
    agregarAlCarrito(producto);
    if (typeof mostrarToast === 'function') mostrarToast(producto.nombre + ' agregado al carrito');
    // Se vuelve a pintar todo el carrito (no solo las sugerencias): el
    // producto recién agregado debe desaparecer de aquí y aparecer en la
    // lista de arriba, con el total actualizado.
    renderizarCarrito();
  });

  return wrap;
}

function ocultarSugerencias() {
  const bloque = document.getElementById('sugerencias-bloque');
  if (bloque) bloque.hidden = true;
}

function renderizarSugerencias() {
  const bloque = document.getElementById('sugerencias-bloque');
  const track = document.getElementById('sugerencias-track');
  if (!bloque || !track) return;

  const idsEnCarrito = {};
  obtenerCarrito().forEach(function (item) {
    idsEnCarrito[item.productId] = true;
  });

  const visibles = obtenerProductosSugeridos().filter(function (p) {
    return !idsEnCarrito[p.id];
  });

  if (visibles.length === 0) {
    bloque.hidden = true;
    return;
  }

  bloque.hidden = false;
  track.innerHTML = '';
  visibles.forEach(function (producto) {
    track.appendChild(crearTarjetaSugerencia(producto));
  });
}

// ---- Modal de confirmación para "Vaciar carrito" ----
// Un modal casero con <div> + CSS en vez de confirm() del navegador, que el
// enunciado de la tarea pide evitar porque bloquea la página y se ve feo.
// Se puede cerrar con Escape, clic en el fondo o el botón "Cancelar", y
// atrapa el foco de teclado mientras está abierto — igual que el modal de
// la ruleta en ruleta.js.
let elementoConFocoAntesDelModalVaciar = null;

function abrirModalVaciar() {
  const modal = document.getElementById('modal-vaciar');
  if (!modal) return;

  elementoConFocoAntesDelModalVaciar = document.activeElement;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';

  const btnCancelar = document.getElementById('modal-cancelar');
  if (btnCancelar) btnCancelar.focus();
}

function cerrarModalVaciar() {
  const modal = document.getElementById('modal-vaciar');
  if (!modal) return;

  modal.hidden = true;
  document.body.style.overflow = '';

  // Devuelve el foco a donde estaba antes de abrir el modal (el botón
  // "Vaciar carrito"), en vez de dejarlo perdido en el body.
  if (elementoConFocoAntesDelModalVaciar) elementoConFocoAntesDelModalVaciar.focus();
}

document.addEventListener('DOMContentLoaded', function () {
  renderizarCarrito();

  const btnVaciar = document.getElementById('btn-vaciar-carrito');
  const btnCancelar = document.getElementById('modal-cancelar');
  const btnConfirmar = document.getElementById('modal-confirmar');
  const modal = document.getElementById('modal-vaciar');
  const btnContinuar = document.getElementById('btn-continuar');

  if (btnContinuar) {
    btnContinuar.addEventListener('click', async function () {
      // El botón ya está deshabilitado si el carrito está vacío, pero se
      // valida de nuevo por si acaso (por ejemplo, si alguien lo habilita
      // manualmente desde las herramientas de desarrollador).
      if (obtenerCarrito().length === 0) return;

      // deviceEsElegibleParaRuleta (definida en ruleta.js) consulta
      // Supabase para saber si este dispositivo ya jugó — mientras se
      // espera esa respuesta, se deshabilita el botón para que no se
      // pueda hacer doble clic y mandar dos consultas a la vez.
      const textoOriginal = btnContinuar.textContent;
      btnContinuar.disabled = true;
      btnContinuar.textContent = 'Verificando...';

      try {
        const subtotal = calcularSubtotal();
        const esElegible = await deviceEsElegibleParaRuleta(subtotal);
        if (esElegible) {
          abrirRuleta();
        } else {
          window.location.href = 'entrega.html';
        }
      } catch (error) {
        // Si deviceEsElegibleParaRuleta falla (por ejemplo, js/ruleta.js no
        // llegó a cargar por algún bloqueo de red) el cliente no debe
        // quedarse atascado sin poder continuar su pedido — se salta la
        // ruleta y se va directo al formulario de entrega, igual que si no
        // fuera elegible.
        console.error('No se pudo verificar la elegibilidad para la ruleta, se continúa sin ella:', error);
        window.location.href = 'entrega.html';
      } finally {
        btnContinuar.disabled = false;
        btnContinuar.textContent = textoOriginal;
      }
    });
  }

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

  // Escape para cerrar, y Tab/Shift+Tab atrapado dentro del modal mientras
  // está abierto (no debe poder salir hacia el resto de la página).
  document.addEventListener('keydown', function (e) {
    const caja = document.getElementById('modal-vaciar-caja');
    if (!modal || modal.hidden || !caja) return;

    if (e.key === 'Escape') {
      cerrarModalVaciar();
      return;
    }

    if (e.key !== 'Tab') return;
    const focosPosibles = caja.querySelectorAll('button:not([disabled])');
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
