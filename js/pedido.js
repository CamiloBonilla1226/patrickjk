// Arma el mensaje de WhatsApp del pedido y abre el chat con el bar.
// No depende de nada de entrega.html en particular — cualquier pantalla
// que junte { nombre, celular, direccion } + los items del carrito puede
// usar estas funciones.

// ⚠️ NÚMERO DE WHATSAPP DEL BAR — confirmar antes de entregar el proyecto.
// Código de país + número, sin "+" ni espacios (formato que pide wa.me).
// Hoy tiene el mismo número que ya usa el resto del sitio (el que aparece
// en "Nosotros" de Inicio y en el proyecto en React) — si el bar cambia de
// número algún día, este es el único lugar del proyecto que hay que tocar.
const NUMERO_WHATSAPP_BAR = '573146032055';

/**
 * Reemplaza los caracteres que arman etiquetas HTML (<, >, &) por su
 * versión de texto segura. Es una limpieza defensiva: nada en este
 * proyecto vuelve a insertar el nombre/dirección como HTML (innerHTML), el
 * mensaje de WhatsApp ya viaja codificado con encodeURIComponent — pero
 * igual se limpia el texto ANTES de usarlo en cualquier parte, para que
 * quede escrito una sola vez y no se nos olvide si más adelante alguna
 * pantalla nueva sí lo muestra con innerHTML.
 */
function escaparHtml(texto) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Arma el texto del mensaje de WhatsApp con los datos de entrega, los
 * productos del carrito y el subtotal.
 *
 * @param {{nombre: string, celular: string, direccion: string}} datosEntrega
 * @param {{nombre: string, precio: number, cantidad: number}[]} itemsCarrito
 * @param {number} subtotal
 * @returns {string}
 */
function construirMensajePedido(datosEntrega, itemsCarrito, subtotal) {
  const lineas = [];

  lineas.push("🧾 *Nuevo pedido — Patrick's JK*");
  lineas.push('');
  lineas.push('👤 Nombre: ' + datosEntrega.nombre);
  lineas.push('📱 Celular: ' + datosEntrega.celular);
  lineas.push('📍 Dirección: ' + datosEntrega.direccion);
  lineas.push('');
  lineas.push('🛒 Productos:');

  itemsCarrito.forEach(function (item) {
    const subtotalLinea = item.precio * item.cantidad;
    lineas.push(
      '- ' + item.cantidad + 'x ' + item.nombre +
      ' — ' + formatPrice(item.precio) + ' c/u = ' + formatPrice(subtotalLinea)
    );
  });

  lineas.push('');

  // obtenerCodigoPremioCarrito vive en carrito.js — devuelve null si el
  // carrito no ganó premio (no fue elegible para la ruleta, o la ruleta
  // cayó en "Perdiste"). El mensaje NUNCA muestra el texto legible del
  // premio (ej. "10% en el total de la cuenta"), solo su código corto: así,
  // aunque el cliente edite este mensaje libremente antes de enviarlo, no
  // puede cambiarlo por otro premio sin adivinar un código válido (quien
  // atiende lo revisa contra una tabla física, fuera de la app).
  const codigoPremio = obtenerCodigoPremioCarrito();
  if (codigoPremio) {
    lineas.push('🎡 Premio de la ruleta: ' + codigoPremio);
    lineas.push('');
  }

  lineas.push('💰 Total: ' + formatPrice(subtotal));

  return lineas.join('\n');
}

/**
 * Arma el mensaje del pedido y abre WhatsApp en una pestaña nueva con ese
 * mensaje ya escrito, listo para que el cliente solo tenga que darle
 * enviar.
 */
function abrirWhatsAppConPedido(datosEntrega, itemsCarrito, subtotal) {
  const mensaje = construirMensajePedido(datosEntrega, itemsCarrito, subtotal);
  // encodeURIComponent convierte espacios, saltos de línea, tildes, etc. en
  // el formato que puede ir dentro de una URL (por ejemplo el espacio se
  // vuelve %20) — sin esto el link de WhatsApp quedaría roto.
  const mensajeCodificado = encodeURIComponent(mensaje);
  const link = 'https://wa.me/' + NUMERO_WHATSAPP_BAR + '?text=' + mensajeCodificado;
  window.open(link, '_blank', 'noopener,noreferrer');
}
