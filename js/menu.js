// Lógica específica de la pantalla Menú: sub-tabs de categoría, buscador y
// pintado de las tarjetas de producto.
//
// La ficha de producto (al tocar una tarjeta) y el botón "+" para agregar al
// carrito son solo visuales por ahora — esa lógica se implementa en una
// tarea aparte, cuando exista el carrito.

var SEARCH_MAX_LENGTH = 60;

var categoriaActiva = CATEGORIES[0];
var busqueda = '';

// Quita tildes/acentos y pasa a minúsculas, para comparar texto sin que
// importe cómo lo haya escrito el cliente (con o sin acentos, mayúsculas...).
function normalizarTexto(texto) {
  var resultado = '';
  var normalizado = texto.normalize('NFD');
  for (var i = 0; i < normalizado.length; i++) {
    var codigo = normalizado.codePointAt(i);
    if (codigo >= 0x0300 && codigo <= 0x036f) continue;
    resultado += normalizado[i];
  }
  return resultado.toLowerCase();
}

function coincideConBusqueda(producto, texto) {
  var q = normalizarTexto(texto.trim());
  if (!q) return true;
  return normalizarTexto(producto.nombre).indexOf(q) !== -1;
}

function crearTarjetaProducto(producto) {
  var disponible = producto.estado === 'disponible';

  var card = document.createElement('div');
  card.className = 'card' + (disponible ? '' : ' is-out');

  var main = document.createElement('button');
  main.className = 'card-main';
  main.disabled = !disponible;
  main.innerHTML =
    '<div class="cupwrap">' +
      '<img class="product-image" src="' + producto.imagen + '" alt="' + producto.nombre + '" loading="lazy" decoding="async">' +
    '</div>' +
    '<div class="card-body">' +
      '<div class="card-top">' +
        '<h3></h3>' +
        '<div class="price">' + formatPrice(producto.precio) + '</div>' +
      '</div>' +
      '<p class="contains"></p>' +
      '<span class="status' + (disponible ? ' ok' : '') + '"><span class="dot"></span>' + (disponible ? 'Disponible' : 'Agotado') + '</span>' +
    '</div>' +
    '<div class="tapcue">›</div>';
  main.querySelector('h3').textContent = producto.nombre;
  main.querySelector('.contains').textContent = producto.categoria;
  card.appendChild(main);

  var quickAdd = document.createElement('button');
  quickAdd.type = 'button';
  quickAdd.className = 'quick-add';
  quickAdd.disabled = !disponible;
  quickAdd.setAttribute('aria-disabled', String(!disponible));
  quickAdd.setAttribute('aria-label', 'Agregar ' + producto.nombre + ' al carrito');
  quickAdd.innerHTML =
    '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<path d="M12 5v14M5 12h14" />' +
    '</svg>';
  card.appendChild(quickAdd);

  return card;
}

function renderizarProductos() {
  var panel = document.getElementById('catpanel');
  var contador = document.getElementById('cat-count');
  if (!panel || !contador) return;

  var buscando = busqueda.trim().length > 0;
  var productosBase = buscando ? PRODUCTS : PRODUCTS.filter(function (p) {
    return p.categoria === categoriaActiva;
  });
  var visibles = productosBase.filter(function (p) {
    return coincideConBusqueda(p, busqueda);
  });

  contador.textContent = buscando
    ? visibles.length + (visibles.length === 1 ? ' resultado' : ' resultados')
    : visibles.length + (visibles.length === 1 ? ' producto' : ' productos');

  panel.querySelectorAll('.card, .menu-empty').forEach(function (el) {
    el.remove();
  });

  if (visibles.length === 0) {
    var vacio = document.createElement('p');
    vacio.className = 'menu-empty';
    vacio.textContent = buscando
      ? 'No encontramos ningún producto con "' + busqueda.trim() + '".'
      : 'Por ahora no hay productos disponibles en ' + categoriaActiva.toLowerCase() + '.';
    panel.appendChild(vacio);
    return;
  }

  visibles.forEach(function (producto) {
    panel.appendChild(crearTarjetaProducto(producto));
  });
}

function seleccionarCategoria(categoria) {
  busqueda = '';
  categoriaActiva = categoria;
  var input = document.getElementById('search-input');
  if (input) input.value = '';
  document.querySelectorAll('.subtabs button').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.categoria === categoria);
  });
  renderizarProductos();
}

function pintarSubtabs() {
  var contenedor = document.getElementById('subtabs');
  if (!contenedor) return;
  CATEGORIES.forEach(function (categoria) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.categoria = categoria;
    btn.textContent = categoria;
    if (categoria === categoriaActiva) btn.classList.add('active');
    btn.addEventListener('click', function () {
      seleccionarCategoria(categoria);
    });
    contenedor.appendChild(btn);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search);
  var categoriaSolicitada = params.get('categoria');
  if (categoriaSolicitada && CATEGORIES.indexOf(categoriaSolicitada) !== -1) {
    categoriaActiva = categoriaSolicitada;
  }

  pintarSubtabs();
  renderizarProductos();

  var input = document.getElementById('search-input');
  if (input) {
    input.addEventListener('input', function (e) {
      busqueda = e.target.value;
      renderizarProductos();
    });
  }
});
