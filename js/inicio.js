// Lógica específica de la pantalla Inicio: carrusel de "Más pedidos" y
// grilla de categorías. Tocar una tarjeta del carrusel abre la ficha del
// producto (ver ficha.js) — igual que en el proyecto React, el carrusel de
// Inicio no tiene botón "+" propio, solo abre la ficha.

var FEATURED_COUNT = 5;

var CATEGORY_ICONS = {
  Cervezas:
    '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
      '<path d="M5.5 7.5h9V19a1.2 1.2 0 0 1-1.2 1.2H6.7A1.2 1.2 0 0 1 5.5 19V7.5Z" />' +
      '<path d="M14.5 9.5h1.8a2 2 0 0 1 2 2v2.6a2 2 0 0 1-2 2h-1.8" />' +
      '<path d="M5.5 7.5c0-1.8 1.4-3.7 3.2-4" />' +
      '<path d="M8 4.3c.4-.9 1.7-1.4 2.6-.7" />' +
      '<path d="M7 11.5h6" />' +
    '</svg>',
  Aperitivos:
    '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
      '<path d="M4.5 4.5h15L12.8 13v6" />' +
      '<path d="M9.3 19h5.4" />' +
      '<circle cx="15.2" cy="6.6" r="1" fill="currentColor" stroke="none" />' +
    '</svg>',
  Mecato:
    '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
      '<path d="M7.3 3.5 6 5.3l1.3 1.3-1.3 1.4h11.4L16 6.6l1.3-1.3-1.3-1.8" />' +
      '<path d="M6 7v11.5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />' +
      '<path d="M9.5 11.5c.9.7 1.6.7 2.5 0s1.6-.7 2.5 0" />' +
      '<path d="M9.5 15c.9.7 1.6.7 2.5 0s1.6-.7 2.5 0" />' +
    '</svg>',
  Alcohol:
    '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
      '<path d="M9 2h6v4l3 4v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10l3-4V2Z" />' +
      '<path d="M6.5 14h11" />' +
    '</svg>',
};

function crearTarjetaCarrusel(producto) {
  var wrap = document.createElement('div');
  wrap.className = 'rail-card-wrap';
  wrap.innerHTML =
    '<button class="rail-card" type="button">' +
      '<div class="cupwrap">' +
        '<img src="' + producto.imagen + '" alt="' + producto.nombre + '" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy" decoding="async">' +
      '</div>' +
      '<h3></h3>' +
      '<div class="price">' + formatPrice(producto.precio) + '</div>' +
    '</button>';
  wrap.querySelector('h3').textContent = producto.nombre;
  wrap.querySelector('.rail-card').addEventListener('click', function () {
    abrirFichaProducto(producto.id);
  });
  return wrap;
}

function pintarCarrusel() {
  var track = document.getElementById('carousel-track');
  if (!track) return;
  var destacados = productos.filter(function (p) {
    return p.estado === 'disponible';
  }).slice(0, FEATURED_COUNT);

  destacados.forEach(function (producto) {
    track.appendChild(crearTarjetaCarrusel(producto));
  });
}

function pintarCategorias() {
  var grid = document.getElementById('cat-grid');
  if (!grid) return;
  var categoriasDestacadas = categorias.filter(function (c) {
    return c !== 'Bebidas';
  });

  categoriasDestacadas.forEach(function (categoria) {
    var count = productos.filter(function (p) {
      return p.categoria === categoria;
    }).length;

    var btn = document.createElement('button');
    btn.className = 'cat-tile';
    btn.type = 'button';
    btn.innerHTML =
      (CATEGORY_ICONS[categoria] || CATEGORY_ICONS.Alcohol) +
      '<span><b></b><span></span></span>';
    btn.querySelector('b').textContent = categoria;
    btn.querySelector('span > span').textContent = count + (count === 1 ? ' producto' : ' productos');
    btn.addEventListener('click', function () {
      window.location.href = 'menu.html?categoria=' + encodeURIComponent(categoria);
    });
    grid.appendChild(btn);
  });
}

/**
 * entrega.js redirige aquí con "?pedido=enviado" justo después de mandar el
 * pedido por WhatsApp — se muestra un toast breve de confirmación y se
 * limpia la URL (con replaceState) para que recargar la página no lo
 * vuelva a mostrar.
 */
function avisarSiVieneDeUnPedido() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('pedido') !== 'enviado') return;

  mostrarToast('¡Pedido enviado! Revisa WhatsApp para confirmar.');
  window.history.replaceState({}, '', 'index.html');
}

document.addEventListener('DOMContentLoaded', function () {
  pintarCarrusel();
  pintarCategorias();
  avisarSiVieneDeUnPedido();
});
