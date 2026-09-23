// Panel de administrador — Ofertas, Pedidos e Información, SIN login
// (decisión explícita del dueño del proyecto, con el riesgo ya advertido:
// cualquiera que tenga esta URL puede leer los pedidos de los clientes y
// agregar, activar/desactivar o borrar ofertas). La única barrera hoy es
// que la página vive en una URL larga y al azar sin ningún link público
// hacia ella (ver panel-72f9eb83e6cf.html) — eso NO protege los datos en
// sí: la llave pública de Supabase (config-supabase.js) es visible en el
// código de cualquier página del sitio, así que alguien con conocimientos
// técnicos puede leer/escribir en las tablas directamente sin pasar por
// aquí. Si en algún momento se agrega un login real (Supabase Auth), este
// archivo es el que hay que ajustar para que use la sesión del usuario en
// vez de la llave anónima directa, y ahí sí se puede cerrar RLS de verdad.
//
// Módulo de JavaScript (type="module") por la misma razón que ruleta.js y
// ofertas.js: así se puede usar `import` para traer el cliente de Supabase
// desde un CDN sin agregar un build step al proyecto. formatPrice viene de
// productos.js (cargado antes que este módulo en panel-72f9eb83e6cf.html).
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config-supabase.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// La fila de la ruleta (ver js/ruleta.js → ruletaEstaActiva) se identifica
// por este código fijo. Se puede activar/desactivar como cualquier otra
// oferta, pero no se puede borrar — sin ella, la ruleta quedaría rota en
// todo el sitio, no solo "sin mostrarse".
const CODIGO_RULETA = 'ruleta';

// Con el tiempo la tabla `pedidos` puede acumular muchísimas filas — listar
// TODAS de una vez cada vez que se abre el panel es lento y poco útil, así
// que por defecto solo se piden los de la última semana. "hoy" es la
// medianoche de hoy en la hora del navegador; "semana" y "mes" son 7 y 30
// días atrás desde este momento.
let filtroPedidosActual = 'semana';
let filtroInfoActual = 'semana';

// Por defecto se muestran solo los pendientes — al abrir Pedidos, lo
// primero que importa es lo que todavía falta por confirmar/entregar, no
// el historial completo.
let filtroEstadoPedidosActual = 'pendiente';

function calcularFechaDesdeFiltro(filtro) {
  const ahora = new Date();
  if (filtro === 'hoy') {
    return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  }
  if (filtro === 'semana') {
    return new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (filtro === 'mes') {
    return new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  return null; // 'todos' — sin filtro de fecha
}

// ============================================================
// Cambiar entre "Ofertas", "Pedidos" e "Información"
// ============================================================
const TITULOS_SECCION = { ofertas: 'Ofertas', pedidos: 'Pedidos', info: 'Información' };

function cambiarSeccion(seccion) {
  document.getElementById('admin-seccion-ofertas').hidden = seccion !== 'ofertas';
  document.getElementById('admin-seccion-pedidos').hidden = seccion !== 'pedidos';
  document.getElementById('admin-seccion-info').hidden = seccion !== 'info';
  document.getElementById('admin-titulo-pantalla').textContent = TITULOS_SECCION[seccion] || '';

  document.querySelectorAll('#admin-subtabs button').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.seccion === seccion);
  });

  if (seccion === 'pedidos') cargarPedidos();
  if (seccion === 'info') cargarInformacion();
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
      '<div class="admin-oferta-top">' +
        '<h3></h3>' +
        '<span class="oferta-badge"></span>' +
      '</div>' +
      '<p></p>' +
    '</div>' +
    '<div class="admin-oferta-acciones">' +
      '<button type="button" class="admin-destacar-btn">★ Destacar en Inicio</button>' +
      '<button type="button" class="admin-toggle-btn"></button>' +
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

  const estaActiva = oferta.activa === true;
  const badge = fila.querySelector('.oferta-badge');
  badge.textContent = estaActiva ? 'Activa' : 'Inactiva';
  badge.className = 'oferta-badge' + (estaActiva ? ' es-activa' : '');

  // Un solo botón que hace lo contrario del estado actual, en vez de dos
  // botones activar/desactivar (uno siempre deshabilitado) — la insignia de
  // arriba ya dice el estado, este botón solo dice la acción a realizar.
  const botonToggle = fila.querySelector('.admin-toggle-btn');
  botonToggle.textContent = estaActiva ? 'Desactivar' : 'Activar';
  botonToggle.className = 'admin-toggle-btn ' + (estaActiva ? 'es-desactivar' : 'es-activar');
  botonToggle.addEventListener('click', function () {
    alternarOferta(oferta.id, !estaActiva);
  });

  const botonBorrar = fila.querySelector('.admin-borrar-btn');
  const botonDestacar = fila.querySelector('.admin-destacar-btn');

  if (esRuleta) {
    // La ruleta ya tiene su propio banner en Inicio — no tiene sentido que
    // además compita por ser "la oferta destacada" genérica.
    botonDestacar.remove();
    botonBorrar.disabled = true;
    botonBorrar.setAttribute('aria-label', 'La oferta de la ruleta no se puede borrar');
    botonBorrar.title = 'La ruleta no se puede borrar — solo activar o desactivar';
  } else {
    botonDestacar.disabled = oferta.destacada === true;
    botonDestacar.textContent = oferta.destacada ? '★ Destacada' : 'Destacar en Inicio';
    botonDestacar.addEventListener('click', function () {
      destacarOferta(oferta.id);
    });
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

  // Sin .order() a propósito — mismo motivo que en cargarPedidos: pedir que
  // ordene por una columna cuyo nombre exacto no conocemos con certeza
  // (creado_en, created_at...) hace fallar TODA la consulta si no existe.
  // Se trae todo sin ordenar y se ordena aquí mismo.
  const { data, error } = await supabase.from('ofertas').select('*');

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

  const ordenadas = data.slice().sort(function (a, b) {
    const fechaA = a.creado_en || a.created_at || '';
    const fechaB = b.creado_en || b.created_at || '';
    return fechaB < fechaA ? -1 : fechaB > fechaA ? 1 : 0;
  });

  ordenadas.forEach(function (oferta) {
    lista.appendChild(crearFilaOferta(oferta));
  });
}

async function alternarOferta(id, nuevaActiva) {
  // El ".select()" al final es lo que permite detectar el caso raro pero
  // real de RLS: si una política de Supabase bloquea la fila, el update NO
  // da error — simplemente actualiza 0 filas en silencio. Sin pedir de
  // vuelta la fila actualizada, no había forma de distinguir "sí funcionó"
  // de "RLS lo bloqueó calladito".
  const { data, error } = await supabase.from('ofertas').update({ activa: nuevaActiva }).eq('id', id).select();

  if (error) {
    console.error('No se pudo actualizar la oferta:', error);
    mostrarMensaje('No se pudo actualizar la oferta. Revisa la consola.', true);
    return;
  }
  if (!data || data.length === 0) {
    mostrarMensaje('Supabase no dejó actualizar esta oferta — revisa que exista la política de UPDATE en la tabla ofertas.', true);
    return;
  }

  // Cada vez que la ruleta se desactiva (desde aquí o automáticamente al
  // llegar al máximo de jugadas — ver MAX_JUGADAS_RULETA en ruleta.js) se
  // reinicia la tabla dispositivos_ruleta, para que la próxima vez que se
  // active todos los dispositivos puedan volver a jugar. Sin esto, un
  // dispositivo que ya jugó en un ciclo anterior de la ruleta se quedaba
  // bloqueado para siempre, aunque la ruleta llevara apagada mucho tiempo.
  const ofertaActualizada = data[0];
  if (ofertaActualizada.codigo === CODIGO_RULETA && !nuevaActiva) {
    const { error: errorReinicio } = await supabase.from('dispositivos_ruleta').delete().not('device_id', 'is', null);
    if (errorReinicio) {
      console.error('No se pudo reiniciar dispositivos_ruleta:', errorReinicio);
      mostrarMensaje('La ruleta se desactivó, pero no se pudo reiniciar la lista de quiénes ya jugaron. Revisa la consola.', true);
    }
  }

  cargarOfertas();
}

/**
 * Marca esta oferta como la destacada de Inicio. Solo puede haber una a la
 * vez, así que primero se les quita el destacado a todas las demás y
 * después se enciende esta — dos pasos porque es más simple de leer que
 * armar una sola consulta condicional, y aquí no hay tantas ofertas como
 * para que la diferencia de rendimiento importe.
 */
async function destacarOferta(id) {
  const { error: errorLimpiar } = await supabase.from('ofertas').update({ destacada: false }).neq('id', id);
  if (errorLimpiar) {
    console.error('No se pudo quitar el destacado de las demás ofertas:', errorLimpiar);
    mostrarMensaje('No se pudo destacar la oferta. Revisa la consola.', true);
    return;
  }

  const { data, error } = await supabase.from('ofertas').update({ destacada: true }).eq('id', id).select();
  if (error) {
    console.error('No se pudo destacar la oferta:', error);
    mostrarMensaje('No se pudo destacar la oferta. Revisa la consola.', true);
    return;
  }
  if (!data || data.length === 0) {
    mostrarMensaje('Supabase no dejó destacar esta oferta — revisa que exista la política de UPDATE en la tabla ofertas.', true);
    return;
  }
  cargarOfertas();
}

async function borrarOferta(id, titulo) {
  const confirmado = window.confirm('¿Borrar la oferta "' + titulo + '"? Esta acción no se puede deshacer.');
  if (!confirmado) return;

  const { data, error } = await supabase.from('ofertas').delete().eq('id', id).select();

  if (error) {
    console.error('No se pudo borrar la oferta:', error);
    mostrarMensaje('No se pudo borrar la oferta. Revisa la consola.', true);
    return;
  }
  if (!data || data.length === 0) {
    mostrarMensaje('Supabase no dejó borrar esta oferta — revisa que exista la política de DELETE en la tabla ofertas.', true);
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

/**
 * La columna `productos` debería llegar ya como un array (columna jsonb en
 * Supabase), pero si en algún momento quedó guardada como texto plano
 * (columna tipo texto en vez de jsonb) esto la deja utilizable en vez de
 * mostrar el pedido vacío sin ninguna pista de por qué.
 */
function obtenerProductosPedido(pedido) {
  if (Array.isArray(pedido.productos)) return pedido.productos;
  if (typeof pedido.productos === 'string') {
    try {
      const parseado = JSON.parse(pedido.productos);
      if (Array.isArray(parseado)) return parseado;
    } catch (error) {
      console.error('No se pudo interpretar la columna productos de un pedido:', error);
    }
  }
  return [];
}

function lineasProductosHtml(productos) {
  return productos
    .map(function (item) {
      const nombreConSabor = item.nombre + (item.sabor ? ' (' + item.sabor + ')' : '');
      return '<div class="pedido-producto-linea">' + item.cantidad + 'x ' + nombreConSabor + '</div>';
    })
    .join('');
}

function crearFilaPedido(pedido) {
  const fila = document.createElement('div');
  fila.className = 'pedido-card';

  fila.innerHTML =
    '<div class="pedido-top">' +
      '<h3></h3>' +
      '<span class="pedido-badge"></span>' +
    '</div>' +
    '<p class="pedido-meta"></p>' +
    '<p class="pedido-fecha"></p>' +
    '<div class="pedido-total"><span>Total</span><b></b></div>' +
    '<button type="button" class="pedido-ver-btn">Ver pedido</button>' +
    '<div class="pedido-acciones">' +
      '<button type="button" class="admin-desactivar-btn pedido-confirmar-btn">Confirmar pedido</button>' +
      '<button type="button" class="admin-activar-btn pedido-pendiente-btn">Marcar pendiente</button>' +
      '<button type="button" class="admin-borrar-btn pedido-borrar-btn" aria-label="Borrar pedido">' +
        '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
          '<path d="M4 7h16" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />' +
          '<path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" /><path d="M10 11v6M14 11v6" />' +
        '</svg>' +
      '</button>' +
    '</div>';

  fila.querySelector('h3').textContent = pedido.nombre || '(sin nombre)';
  fila.querySelector('.pedido-meta').textContent = (pedido.celular || '') + ' · ' + (pedido.direccion || '');
  fila.querySelector('.pedido-fecha').textContent = formatearFecha(pedido.created_at || pedido.creado_en || pedido.fecha);
  fila.querySelector('.pedido-total b').textContent = formatPrice(pedido.subtotal || pedido.total || 0);

  fila.querySelector('.pedido-ver-btn').addEventListener('click', function () {
    abrirDetallePedido(pedido);
  });

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

  fila.querySelector('.pedido-borrar-btn').addEventListener('click', function () {
    borrarPedido(pedido.id, pedido.nombre || '(sin nombre)');
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

  // Sin .order() a propósito: no sabemos con certeza el nombre exacto de
  // la columna de fecha en tu tabla `pedidos` (created_at, creado_en...) —
  // pedir que ordene por una columna que no existe hace fallar TODA la
  // consulta. Se trae todo sin ordenar y se ordena aquí mismo, probando
  // los nombres más probables (ver formatearFecha más abajo). Los dos
  // filtros (fecha y estado) sí se mandan al servidor, para no traer de más.
  let consulta = supabase.from('pedidos').select('*');
  const desde = calcularFechaDesdeFiltro(filtroPedidosActual);
  if (desde) {
    consulta = consulta.gte('creado_en', desde.toISOString());
  }
  if (filtroEstadoPedidosActual !== 'todos') {
    consulta = consulta.eq('confirmado', filtroEstadoPedidosActual === 'confirmado');
  }
  const { data, error } = await consulta;

  cargando.hidden = true;

  if (error) {
    console.error('No se pudieron cargar los pedidos:', error);
    mostrarMensaje('No se pudieron cargar los pedidos. Revisa la consola.', true);
    return;
  }

  lista.innerHTML = '';
  if (!data || data.length === 0) {
    const textoEstado = filtroEstadoPedidosActual === 'pendiente'
      ? 'pendientes'
      : filtroEstadoPedidosActual === 'confirmado'
        ? 'confirmados'
        : '';
    vacio.textContent = filtroPedidosActual === 'todos' && filtroEstadoPedidosActual === 'todos'
      ? 'Todavía no hay pedidos.'
      : 'No hay pedidos ' + (textoEstado ? textoEstado + ' ' : '') + 'en este rango de fechas.';
    vacio.hidden = false;
    return;
  }

  const ordenados = data.slice().sort(function (a, b) {
    const fechaA = a.created_at || a.creado_en || a.fecha || '';
    const fechaB = b.created_at || b.creado_en || b.fecha || '';
    return fechaB < fechaA ? -1 : fechaB > fechaA ? 1 : 0;
  });

  ordenados.forEach(function (pedido) {
    lista.appendChild(crearFilaPedido(pedido));
  });
}

async function alternarConfirmacionPedido(id, nuevoConfirmado) {
  const { data, error } = await supabase.from('pedidos').update({ confirmado: nuevoConfirmado }).eq('id', id).select();

  if (error) {
    console.error('No se pudo actualizar el pedido:', error);
    mostrarMensaje('No se pudo actualizar el pedido. Revisa la consola.', true);
    return;
  }
  if (!data || data.length === 0) {
    mostrarMensaje('Supabase no dejó actualizar este pedido — revisa que exista la política de UPDATE en la tabla pedidos.', true);
    return;
  }
  cargarPedidos();
}

/** Borra el pedido de verdad de la tabla `pedidos` — no es un estado, desaparece por completo. */
async function borrarPedido(id, nombre) {
  const confirmado = window.confirm('¿Borrar el pedido de "' + nombre + '"? Esta acción no se puede deshacer.');
  if (!confirmado) return;

  const { data, error } = await supabase.from('pedidos').delete().eq('id', id).select();

  if (error) {
    console.error('No se pudo borrar el pedido:', error);
    mostrarMensaje('No se pudo borrar el pedido. Revisa la consola.', true);
    return;
  }
  if (!data || data.length === 0) {
    mostrarMensaje('Supabase no dejó borrar este pedido — revisa que exista la política de DELETE en la tabla pedidos.', true);
    return;
  }
  cargarPedidos();
}

// ============================================================
// Información (ventas confirmadas — para análisis, no para operar)
// ============================================================
/**
 * Trae los pedidos CONFIRMADOS del rango de fechas elegido y calcula todo
 * en el navegador (no hay tantos pedidos en un bar como para que esto
 * pese) — un pedido "pendiente" todavía no es una venta real, así que
 * nunca cuenta aquí, sin importar el filtro de fecha.
 */
async function cargarInformacion() {
  const cargando = document.getElementById('admin-info-cargando');
  const vacio = document.getElementById('admin-info-vacio');
  const contenido = document.getElementById('admin-info-contenido');
  if (!cargando || !vacio || !contenido) return;

  cargando.hidden = false;
  vacio.hidden = true;
  contenido.hidden = true;

  let consulta = supabase.from('pedidos').select('*').eq('confirmado', true);
  const desde = calcularFechaDesdeFiltro(filtroInfoActual);
  if (desde) {
    consulta = consulta.gte('creado_en', desde.toISOString());
  }
  const { data, error } = await consulta;

  cargando.hidden = true;

  if (error) {
    console.error('No se pudo cargar la información de ventas:', error);
    mostrarMensaje('No se pudo cargar la información de ventas. Revisa la consola.', true);
    return;
  }

  if (!data || data.length === 0) {
    vacio.hidden = false;
    return;
  }

  const totalVentas = data.length;
  const totalVendido = data.reduce(function (suma, pedido) {
    return suma + Number(pedido.total || pedido.subtotal || 0);
  }, 0);
  const conOferta = data.filter(function (pedido) {
    return !!pedido.codigo_premio;
  }).length;

  // Cuenta unidades por nombre de producto (con el sabor incluido en la
  // etiqueta, para no mezclar "Electrolit Uva" con "Electrolit Fresa Kiwi"
  // bajo un mismo conteo) sumando los productos de todos los pedidos del
  // rango.
  const unidadesPorProducto = {};
  let totalUnidades = 0;
  data.forEach(function (pedido) {
    obtenerProductosPedido(pedido).forEach(function (item) {
      const etiqueta = item.nombre + (item.sabor ? ' (' + item.sabor + ')' : '');
      const cantidad = Number(item.cantidad) || 0;
      unidadesPorProducto[etiqueta] = (unidadesPorProducto[etiqueta] || 0) + cantidad;
      totalUnidades += cantidad;
    });
  });

  document.getElementById('info-ventas').textContent = String(totalVentas);
  document.getElementById('info-total').textContent = formatPrice(totalVendido);
  document.getElementById('info-con-oferta').textContent = conOferta + ' de ' + totalVentas;
  document.getElementById('info-unidades').textContent = String(totalUnidades);

  const listaProductos = document.getElementById('info-productos-lista');
  listaProductos.innerHTML = '';
  Object.keys(unidadesPorProducto)
    .sort(function (a, b) {
      return unidadesPorProducto[b] - unidadesPorProducto[a];
    })
    .forEach(function (etiqueta) {
      const fila = document.createElement('div');
      fila.className = 'info-producto-fila';
      fila.innerHTML = '<span class="info-producto-nombre"></span><span class="info-producto-cantidad"></span>';
      fila.querySelector('.info-producto-nombre').textContent = etiqueta;
      fila.querySelector('.info-producto-cantidad').textContent = unidadesPorProducto[etiqueta] + ' und.';
      listaProductos.appendChild(fila);
    });

  contenido.hidden = false;
}

// ============================================================
// Detalle de un pedido (modal: productos completos + código de premio)
// ============================================================
// Mismo patrón de modal casero que .modal-vaciar en carrito.js: se puede
// cerrar con Escape, clic en el fondo o el botón X, y atrapa el foco de
// teclado mientras está abierto.
let elementoConFocoAntesDelDetalle = null;

function abrirDetallePedido(pedido) {
  const modal = document.getElementById('pedido-detalle-modal');
  if (!modal) return;

  document.getElementById('pedido-detalle-nombre').textContent = pedido.nombre || '(sin nombre)';
  document.getElementById('pedido-detalle-meta').textContent = (pedido.celular || '') + ' · ' + (pedido.direccion || '');
  document.getElementById('pedido-detalle-fecha').textContent = formatearFecha(pedido.created_at || pedido.creado_en || pedido.fecha);
  document.getElementById('pedido-detalle-total').textContent = formatPrice(pedido.subtotal || pedido.total || 0);

  const productos = obtenerProductosPedido(pedido);
  const contenedorProductos = document.getElementById('pedido-detalle-productos');
  contenedorProductos.innerHTML = productos.length > 0
    ? lineasProductosHtml(productos)
    : '<div class="pedido-producto-linea">No se guardaron los productos de este pedido.</div>';

  const premioEl = document.getElementById('pedido-detalle-premio');
  if (pedido.codigo_premio) {
    premioEl.hidden = false;
    premioEl.textContent = '🎡 Jugó la ruleta — código de premio: ' + pedido.codigo_premio;
  } else {
    premioEl.hidden = true;
  }

  elementoConFocoAntesDelDetalle = document.activeElement;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  document.getElementById('pedido-detalle-cerrar').focus();
}

function cerrarDetallePedido() {
  const modal = document.getElementById('pedido-detalle-modal');
  if (!modal) return;

  modal.hidden = true;
  document.body.style.overflow = '';

  if (elementoConFocoAntesDelDetalle) elementoConFocoAntesDelDetalle.focus();
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

  document.querySelectorAll('#admin-pedidos-filtros button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.dataset.filtro === filtroPedidosActual) return;
      filtroPedidosActual = btn.dataset.filtro;
      document.querySelectorAll('#admin-pedidos-filtros button').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
      cargarPedidos();
    });
  });

  document.querySelectorAll('#admin-pedidos-filtros-estado button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.dataset.filtroEstado === filtroEstadoPedidosActual) return;
      filtroEstadoPedidosActual = btn.dataset.filtroEstado;
      document.querySelectorAll('#admin-pedidos-filtros-estado button').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
      cargarPedidos();
    });
  });

  document.querySelectorAll('#admin-info-filtros button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.dataset.filtro === filtroInfoActual) return;
      filtroInfoActual = btn.dataset.filtro;
      document.querySelectorAll('#admin-info-filtros button').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
      cargarInformacion();
    });
  });

  const modalDetalle = document.getElementById('pedido-detalle-modal');
  const botonCerrarDetalle = document.getElementById('pedido-detalle-cerrar');
  if (botonCerrarDetalle) botonCerrarDetalle.addEventListener('click', cerrarDetallePedido);
  if (modalDetalle) {
    modalDetalle.addEventListener('click', function (e) {
      if (e.target === modalDetalle) cerrarDetallePedido();
    });
  }

  document.addEventListener('keydown', function (e) {
    const caja = document.getElementById('pedido-detalle-caja');
    if (!modalDetalle || modalDetalle.hidden || !caja) return;

    if (e.key === 'Escape') {
      cerrarDetallePedido();
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
