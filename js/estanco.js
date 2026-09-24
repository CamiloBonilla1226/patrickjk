// Pinta la carta del punto físico (carta1.html) a partir de
// productosEstanco (ver js/productos-estanco.js). Mismo patrón de subtabs
// que categoriaActiva en menu.js: se muestra SOLO la categoría elegida a la
// vez, no todo el catálogo de un tirón — con muchos productos, una sola
// página larga era difícil de leer desde el celular en el punto físico.

var categoriaActivaEstanco = categoriasEstanco[0];

function crearFilaEstanco(producto) {
  var fila = document.createElement('div');
  fila.className = 'estanco-item';

  var subtitulo = producto.sabores && producto.sabores.length
    ? producto.sabores.join(', ')
    : producto.descripcion || '';

  fila.innerHTML =
    '<div class="estanco-item-info">' +
      '<div class="estanco-item-nombre"></div>' +
      (subtitulo ? '<div class="estanco-item-sabores"></div>' : '') +
    '</div>' +
    '<div class="estanco-item-precio"></div>';

  fila.querySelector('.estanco-item-nombre').textContent = producto.nombre;
  if (subtitulo) {
    fila.querySelector('.estanco-item-sabores').textContent = subtitulo;
  }
  fila.querySelector('.estanco-item-precio').textContent = formatPrice(producto.precio);

  return fila;
}

function renderizarListaEstanco() {
  var lista = document.getElementById('estanco-lista');
  var titulo = document.getElementById('estanco-titulo');
  if (!lista) return;

  if (titulo) titulo.textContent = categoriaActivaEstanco;

  lista.innerHTML = '';
  productosEstanco
    .filter(function (producto) {
      return producto.categoria === categoriaActivaEstanco;
    })
    .forEach(function (producto) {
      lista.appendChild(crearFilaEstanco(producto));
    });
}

function seleccionarCategoriaEstanco(categoria) {
  categoriaActivaEstanco = categoria;
  document.querySelectorAll('#estanco-subtabs button').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.categoria === categoria);
  });
  renderizarListaEstanco();
}

function pintarSubtabsEstanco() {
  var contenedor = document.getElementById('estanco-subtabs');
  if (!contenedor) return;

  categoriasEstanco.forEach(function (categoria) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.categoria = categoria;
    btn.textContent = categoria;
    if (categoria === categoriaActivaEstanco) btn.classList.add('active');
    btn.addEventListener('click', function () {
      seleccionarCategoriaEstanco(categoria);
    });
    contenedor.appendChild(btn);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  pintarSubtabsEstanco();
  renderizarListaEstanco();
});
