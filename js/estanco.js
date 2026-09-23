// Pinta la carta del punto físico (estanco.html) a partir de
// productosEstanco (ver js/productos-estanco.js) — agrupada por categoría,
// con un salto rápido arriba para ir directo a cada una. Es una sola
// pantalla sin más interacción que esos saltos: no hay carrito ni fichas,
// así que no hace falta nada de lo que ya existe en carrito.js/ficha.js.

// Las categorías del catálogo (Cervezas, Aperitivos, Mecato, Bebidas,
// Alcohol) no tienen tildes ni caracteres raros, así que alcanza con pasar
// a minúsculas — no hace falta la limpieza de acentos que sí necesita
// normalizarTexto en menu.js (ese compara texto libre escrito por el
// cliente en el buscador).
function idParaCategoria(categoria) {
  return 'estanco-cat-' + categoria.toLowerCase();
}

function crearFilaEstanco(producto) {
  const fila = document.createElement('div');
  fila.className = 'estanco-item';

  const subtitulo = producto.sabores && producto.sabores.length
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

function pintarCartaEstanco() {
  const nav = document.getElementById('estanco-nav');
  const contenido = document.getElementById('estanco-contenido');
  if (!nav || !contenido) return;

  nav.innerHTML = '';
  contenido.innerHTML = '';

  categoriasEstanco.forEach(function (categoria) {
    const idCategoria = idParaCategoria(categoria);

    const link = document.createElement('a');
    link.href = '#' + idCategoria;
    link.textContent = categoria;
    nav.appendChild(link);

    const seccion = document.createElement('div');
    seccion.className = 'estanco-seccion';
    seccion.id = idCategoria;

    const titulo = document.createElement('div');
    titulo.className = 'block-title';
    titulo.innerHTML = '<h2></h2>';
    titulo.querySelector('h2').textContent = categoria;
    seccion.appendChild(titulo);

    const lista = document.createElement('div');
    lista.className = 'estanco-lista';
    productosEstanco
      .filter(function (producto) {
        return producto.categoria === categoria;
      })
      .forEach(function (producto) {
        lista.appendChild(crearFilaEstanco(producto));
      });
    seccion.appendChild(lista);

    contenido.appendChild(seccion);
  });
}

document.addEventListener('DOMContentLoaded', pintarCartaEstanco);
