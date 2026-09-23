// Lógica específica de la pantalla de Entrega: valida el formulario y, si
// todo está bien, arma el pedido y abre WhatsApp.

document.addEventListener('DOMContentLoaded', function () {
  // Si alguien llega aquí sin productos en el carrito (por ejemplo
  // escribiendo la URL directo), no tiene sentido mostrar el formulario —
  // se manda de vuelta al Menú.
  if (obtenerCarrito().length === 0) {
    window.location.href = 'menu.html';
    return;
  }

  const form = document.getElementById('form-entrega');
  form.addEventListener('submit', manejarEnvioFormulario);
});

async function manejarEnvioFormulario(e) {
  e.preventDefault();

  const campoNombre = document.getElementById('entrega-nombre');
  const campoCelular = document.getElementById('entrega-celular');
  const campoDireccion = document.getElementById('entrega-direccion');

  const nombre = campoNombre.value.trim();
  const celular = campoCelular.value.trim();
  const direccion = campoDireccion.value.trim();

  // Se validan los tres campos siempre (no se corta en el primer error),
  // para que el cliente vea de una vez todo lo que le falta corregir.
  const errorNombre = validarNombre(nombre);
  const errorCelular = validarCelular(celular);
  const errorDireccion = validarDireccion(direccion);

  mostrarErrorCampo('entrega-nombre', errorNombre);
  mostrarErrorCampo('entrega-celular', errorCelular);
  mostrarErrorCampo('entrega-direccion', errorDireccion);

  if (errorNombre || errorCelular || errorDireccion) return;

  // escaparHtml (definida en pedido.js) limpia el nombre y la dirección
  // antes de que se usen en cualquier parte — ver el comentario de esa
  // función para el porqué.
  const datosEntrega = {
    nombre: escaparHtml(nombre),
    celular: celular,
    direccion: escaparHtml(direccion),
  };

  const items = obtenerCarrito();
  const subtotal = calcularSubtotal();
  const codigoPremio = obtenerCodigoPremioCarrito();

  // Se intenta guardar el pedido en Supabase (tabla `pedidos`) ANTES de
  // abrir WhatsApp, pero sin dejar que un fallo ahí bloquee el envío del
  // pedido — eso es lo prioritario para el cliente. guardarPedidoSupabase
  // (definida en ruleta.js, expuesta en window) ya maneja sus propios
  // errores con console.error; este try/catch es una red de seguridad
  // extra por si el módulo no llegó a cargar a tiempo.
  if (typeof guardarPedidoSupabase === 'function') {
    try {
      await guardarPedidoSupabase({
        nombre: datosEntrega.nombre,
        celular: datosEntrega.celular,
        direccion: datosEntrega.direccion,
        productos: items,
        subtotal: subtotal,
        codigoPremio: codigoPremio,
      });
    } catch (error) {
      console.error('No se pudo guardar el pedido en Supabase:', error);
    }
  }

  abrirWhatsAppConPedido(datosEntrega, items, subtotal);

  // El pedido ya se mandó por WhatsApp — el carrito de esta compra queda
  // vacío (también se borra el código de premio, si había uno) y se vuelve
  // al Inicio con un aviso breve.
  vaciarCarrito();
  window.location.href = 'index.html?pedido=enviado';
}

/** '' si el nombre es válido, o el mensaje de error a mostrar. */
function validarNombre(valor) {
  if (!valor) return 'Escribe tu nombre completo.';
  return '';
}

/**
 * El celular solo puede tener números y espacios, y debe tener al menos
 * 10 dígitos (sin contar los espacios) — así se evita un celular con
 * letras o demasiado corto para ser un número real.
 */
function validarCelular(valor) {
  if (!valor) return 'Escribe tu celular.';
  if (!/^[0-9 ]+$/.test(valor)) return 'El celular solo puede tener números y espacios.';
  const soloDigitos = valor.replace(/\s/g, '');
  if (soloDigitos.length < 10) return 'El celular debe tener al menos 10 dígitos.';
  return '';
}

/** '' si la dirección es válida, o el mensaje de error a mostrar. */
function validarDireccion(valor) {
  if (!valor) return 'Escribe la dirección de entrega.';
  return '';
}

/**
 * Pinta (o limpia) el mensaje de error debajo de un campo, y marca el
 * input como inválido para lectores de pantalla mientras el error esté
 * visible.
 */
function mostrarErrorCampo(idCampo, mensajeError) {
  const input = document.getElementById(idCampo);
  const errorEl = document.getElementById(idCampo + '-error');
  if (!input || !errorEl) return;

  errorEl.textContent = mensajeError;
  input.setAttribute('aria-invalid', mensajeError ? 'true' : 'false');
}
