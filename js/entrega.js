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

  // IMPORTANTE: abrir WhatsApp es lo PRIMERO que se hace, todavía en el
  // mismo instante del clic — los navegadores bloquean window.open() (sin
  // avisar con ningún error) si no ocurre de inmediato en respuesta a la
  // interacción del cliente. Si esto fuera después de un `await` (como
  // guardar en Supabase), el navegador ya no lo cuenta como "resultado
  // directo del clic" y la ventana simplemente no se abre.
  abrirWhatsAppConPedido(datosEntrega, items, subtotal);

  // El guardado en Supabase (tabla `pedidos`) pasa DESPUÉS, sin bloquear
  // nada — si falla, el pedido por WhatsApp ya se envió de todos modos,
  // que es lo prioritario. guardarPedidoSupabase (definida en ruleta.js,
  // expuesta en window) ya maneja sus propios errores con console.error;
  // este try/catch es una red de seguridad extra por si el módulo no
  // llegó a cargar a tiempo. Se guarda si funcionó o no para avisar en
  // Inicio — antes esto fallaba en silencio (solo en la consola) y nadie
  // se enteraba de que el pedido no había quedado guardado para el admin.
  let guardadoOk = true;
  if (typeof guardarPedidoSupabase === 'function') {
    try {
      guardadoOk = await guardarPedidoSupabase({
        nombre: datosEntrega.nombre,
        celular: datosEntrega.celular,
        direccion: datosEntrega.direccion,
        productos: items,
        subtotal: subtotal,
        codigoPremio: codigoPremio,
      });
    } catch (error) {
      console.error('No se pudo guardar el pedido en Supabase:', error);
      guardadoOk = false;
    }
  }

  // El pedido ya se mandó por WhatsApp — el carrito de esta compra queda
  // vacío (también se borra el código de premio, si había uno) y se vuelve
  // al Inicio con un aviso breve. Si el guardado en Supabase falló, se
  // avisa también (ver avisarSiVieneDeUnPedido en inicio.js) — el pedido
  // por WhatsApp sí llegó, pero no va a aparecer en el panel de admin.
  vaciarCarrito();
  window.location.href = 'index.html?pedido=enviado' + (guardadoOk ? '' : '&guardado=no');
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
