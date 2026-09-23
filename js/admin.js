// Panel de administrador — Ofertas y Pedidos, SIN login (decisión
// explícita del dueño del proyecto, con el riesgo ya advertido: cualquiera
// que tenga esta URL puede leer los pedidos de los clientes y agregar,
// activar/desactivar o borrar ofertas). Si en algún momento se agrega un
// login real (Supabase Auth), este archivo es el que hay que ajustar para
// que use la sesión del usuario en vez de la llave anónima directa.
//
// Módulo de JavaScript (type="module") por la misma razón que ruleta.js y
// ofertas.js: así se puede usar `import` para traer el cliente de Supabase
// desde un CDN sin agregar un build step al proyecto. formatPrice viene de
// productos.js (cargado antes que este módulo en admin.html).
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config-supabase.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// La fila de la ruleta (ver js/ruleta.js → ruletaEstaActiva) se identifica
// por este código fijo. Se puede activar/desactivar como cualquier otra
// oferta, pero no se puede borrar — sin ella, la ruleta quedaría rota en
// todo el sitio, no solo "sin mostrarse".
const CODIGO_RULETA = 'ruleta';

// ============================================================
// Cambiar entre "Ofertas" y "Pedidos"
// ============================================================
function cambiarSeccion(seccion) {
  const esOfertas = seccion === 'ofertas';
  document.getElementById('admin-seccion-ofertas').hidden = !esOfertas;
  document.getElementById('admin-seccion-pedidos').hidden = esOfertas;
  document.getElementById('admin-titulo-pantalla').textContent = esOfertas ? 'Ofertas' : 'Pedidos';

  document.querySelectorAll('#admin-subtabs button').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.seccion === seccion);
  });

  if (!esOfertas) cargarPedidos();
}

// ============================================================
// Ofertas (agregar / activar / desactivar / borrar)
// ============================================================
function crearFilaOferta(oferta) {
  const esRuleta = oferta.codigo === CODIGO_RULETA;

  const fila = document.createElement('div');
  fila.className = 'admin-oferta-row';

  fila.innerHTML =
    '<div class="admin-oferta-info">' +
      '<h3></h3>' +
      '<p></p>' +
    '</div>' +
    '<div class="admin-oferta-acciones">' +
      '<button type="button" class="admin-activar-btn">Activar</button>' +
      '<button type="button" class="admin-desactivar-btn">Desactivar</button>' +
      '<button type="button" class="admin-borrar-btn" aria-label="Borrar oferta">' +
        '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
          '<path d="M4 7h16" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />' +
          '<path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" /><path d="M10 11v6M14 11v6" />' +
        '</svg>' +
      '</button>' +
    '</div>';

  fila.querySelector('h3').textContent = oferta.titulo + (esRuleta ? ' 🎡' : '');
  const descripcionEl = fila.querySelector('p');
  if (oferta.descripcion) {
    descripcionEl.textContent = oferta.descripcion;
  } else {
    descripcionEl.remove();
  }

  const botonActivar = fila.querySelector('.admin-activar-btn');
  const botonDesactivar = fila.querySelector('.admin-desactivar-btn');
  botonActivar.disabled = oferta.activa === true;
  botonDesactivar.disabled = oferta.activa === false;
  botonActivar.addEventListener('click', function () {
    alternarOferta(oferta.id, true);
  });
  botonDesactivar.addEventListener('click', function () {
    alternarOferta(oferta.id, false);
  });

  const botonBorrar = fila.querySelector('.admin-borrar-btn');
  if (esRuleta) {
    botonBorrar.disabled = true;
    botonBorrar.setAttribute('aria-label', 'La oferta de la ruleta no se puede borrar');
    botonBorrar.title = 'La ruleta no se puede borrar — solo activar o desactivar';
  } else {
    botonBorrar.addEventListener('click', function () {
      borrarOferta(oferta.id, oferta.titulo);
    });
  }

  return fila;
}

async function cargarOfertas() {
  const lista = document.getElementById('admin-ofertas-lista');
  const vacio = document.getElementById('admin-ofertas-vacio');
  if (!lista || !vacio) return;

  const { data, error } = await supabase
    .from('ofertas')
    .select('id, titulo, descripcion, activa, codigo')
    .order('creado_en', { ascending: false });

  if (error) {
    console.error('No se pudieron cargar las ofertas:', error);
    mostrarMensaje('No se pudieron cargar las ofertas. Revisa la consola.', true);
    return;
  }

  lista.innerHTML = '';
  if (!data || data.length === 0) {
    vacio.hidden = false;
    return;
  }
  vacio.hidden = true;
  data.forEach(function (oferta) {
    lista.appendChild(crearFilaOferta(oferta));
  });
}

async function alternarOferta(id, nuevaActiva) {
  const { error } = await supabase.from('ofertas').update({ activa: nuevaActiva }).eq('id', id);
  if (error) {
    console.error('No se pudo actualizar la oferta:', error);
    mostrarMensaje('No se pudo actualizar la oferta. Revisa la consola.', true);
    return;
  }
  cargarOfertas();
}

async function borrarOferta(id, titulo) {
  const confirmado = window.confirm('¿Borrar la oferta "' + titulo + '"? Esta acción no se puede deshacer.');
  if (!confirmado) return;

  const { error } = await supabase.from('ofertas').delete().eq('id', id);
  if (error) {
    console.error('No se pudo borrar la oferta:', error);
    mostrarMensaje('No se pudo borrar la oferta. Revisa la consola.', true);
    return;
  }
  cargarOfertas();
}

// ============================================================
// Pedidos (ver / confirmar / volver a pendiente)
// ============================================================
function formatearFecha(fechaTexto) {
  if (!fechaTexto) return '';
  const fecha = new Date(fechaTexto);
  if (isNaN(fecha.getTime())) return '';
  return fecha.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

function crearFilaPedido(pedido) {
  const fila = document.createElement('div');
  fila.className = 'pedido-card';

  const productos = Array.isArray(pedido.productos) ? pedido.productos : [];
  const lineasProductos = productos
    .map(function (item) {
      const nombreConSabor = item.nombre + (item.sabor ? ' (' + item.sabor + ')' : '');
      return '<div class="pedido-producto-linea">' + item.cantidad + 'x ' + nombreConSabor + '</div>';
    })
    .join('');

  fila.innerHTML =
    '<div class="pedido-top">' +
      '<h3></h3>' +
      '<span class="pedido-badge"></span>' +
    '</div>' +
    '<p class="pedido-meta"></p>' +
    '<p class="pedido-fecha"></p>' +
    '<div class="pedido-productos">' + lineasProductos + '</div>' +
    '<div class="pedido-premio" hidden></div>' +
    '<div class="pedido-total"><span>Total</span><b></b></div>' +
    '<div class="pedido-acciones">' +
      '<button type="button" class="admin-desactivar-btn pedido-confirmar-btn">Confirmar pedido</button>' +
      '<button type="button" class="admin-activar-btn pedido-pendiente-btn">Marcar pendiente</button>' +
    '</div>';

  fila.querySelector('h3').textContent = pedido.nombre || '(sin nombre)';
  fila.querySelector('.pedido-meta').textContent = (pedido.celular || '') + ' · ' + (pedido.direccion || '');
  fila.querySelector('.pedido-fecha').textContent = formatearFecha(pedido.created_at || pedido.creado_en);
  fila.querySelector('.pedido-total b').textContent = formatPrice(pedido.subtotal || 0);

  if (pedido.codigo_premio) {
    const premioEl = fila.querySelector('.pedido-premio');
    premioEl.hidden = false;
    premioEl.textContent = '🎡 Premio: ' + pedido.codigo_premio;
  }

  const confirmado = pedido.confirmado === true;
  const badge = fila.querySelector('.pedido-badge');
  badge.textContent = confirmado ? 'Confirmado' : 'Pendiente';
  badge.className = 'pedido-badge' + (confirmado ? ' es-confirmado' : '');

  const botonConfirmar = fila.querySelector('.pedido-confirmar-btn');
  const botonPendiente = fila.querySelector('.pedido-pendiente-btn');
  botonConfirmar.disabled = confirmado;
  botonPendiente.disabled = !confirmado;
  botonConfirmar.addEventListener('click', function () {
    alternarConfirmacionPedido(pedido.id, true);
  });
  botonPendiente.addEventListener('click', function () {
    alternarConfirmacionPedido(pedido.id, false);
  });

  return fila;
}

async function cargarPedidos() {
  const lista = document.getElementById('admin-pedidos-lista');
  const vacio = document.getElementById('admin-pedidos-vacio');
  const cargando = document.getElementById('admin-pedidos-cargando');
  if (!lista || !vacio || !cargando) return;

  cargando.hidden = false;
  vacio.hidden = true;

  const { data, error } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });

  cargando.hidden = true;

  if (error) {
    console.error('No se pudieron cargar los pedidos:', error);
    mostrarMensaje('No se pudieron cargar los pedidos. Revisa la consola.', true);
    return;
  }

  lista.innerHTML = '';
  if (!data || data.length === 0) {
    vacio.hidden = false;
    return;
  }
  data.forEach(function (pedido) {
    lista.appendChild(crearFilaPedido(pedido));
  });
}

async function alternarConfirmacionPedido(id, nuevoConfirmado) {
  const { error } = await supabase.from('pedidos').update({ confirmado: nuevoConfirmado }).eq('id', id);
  if (error) {
    console.error('No se pudo actualizar el pedido:', error);
    mostrarMensaje('No se pudo actualizar el pedido. Revisa la consola.', true);
    return;
  }
  cargarPedidos();
}

// ============================================================
// Utilidades compartidas
// ============================================================
function mostrarMensaje(texto, esError) {
  const mensaje = document.getElementById('admin-mensaje');
  if (!mensaje) return;
  mensaje.textContent = texto;
  mensaje.className = 'admin-mensaje' + (esError ? ' es-error' : ' es-exito');
  mensaje.hidden = false;
  setTimeout(function () {
    mensaje.hidden = true;
  }, 3000);
}

document.addEventListener('DOMContentLoaded', function () {
  cargarOfertas();

  document.querySelectorAll('#admin-subtabs button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      cambiarSeccion(btn.dataset.seccion);
    });
  });

  const form = document.getElementById('admin-form');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const campoTitulo = document.getElementById('admin-oferta-titulo');
    const campoDescripcion = document.getElementById('admin-descripcion');
    const titulo = campoTitulo.value.trim();
    const descripcion = campoDescripcion.value.trim();

    if (!titulo) {
      mostrarMensaje('Escribe un título para la oferta.', true);
      campoTitulo.focus();
      return;
    }

    const botonPublicar = document.getElementById('admin-publicar-btn');
    botonPublicar.disabled = true;

    const { error } = await supabase.from('ofertas').insert({
      titulo: titulo,
      descripcion: descripcion || null,
      activa: true,
    });

    botonPublicar.disabled = false;

    if (error) {
      console.error('No se pudo publicar la oferta:', error);
      mostrarMensaje('No se pudo publicar la oferta. Revisa la consola.', true);
      return;
    }

    campoTitulo.value = '';
    campoDescripcion.value = '';
    mostrarMensaje('Oferta publicada.', false);
    cargarOfertas();
  });
});
