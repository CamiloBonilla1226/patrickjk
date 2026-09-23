// Ruleta de descuentos + conexión a Supabase.
//
// Este archivo SÍ es un módulo de JavaScript (`type="module"` en el
// <script> que lo carga), a diferencia del resto del proyecto — es la
// única forma de usar `import` para traer el cliente de Supabase desde un
// CDN sin agregar un build step (Vite, Webpack, etc.) al proyecto.
//
// Las funciones que otras pantallas necesitan (carrito.html, entrega.html)
// se cuelgan explícitamente de `window` al final del archivo: un módulo NO
// comparte sus variables con los demás <script> normales solo por estar en
// la misma página, así que sin ese paso ni carrito.js ni entrega.js
// podrían llamarlas.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config-supabase.js';
import { PREMIOS_RULETA_A, PREMIOS_RULETA_B } from './premiosRuleta.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// Reglas de negocio (elegibilidad, sorteo, dispositivo)
// ============================================================

export const RULETA_MIN_SUBTOTAL = 70000;

const DEVICE_ID_KEY = 'device_id';
const YA_JUGO_KEY = 'ruleta_ya_jugo';
const SIGUE_INTENTANDO = 'Sigue intentando';

/**
 * Identificador de dispositivo para el control de "un giro por
 * dispositivo" de la ruleta. Es SOLO un control de abuso liviano guardado
 * en localStorage (para que no sea trivial jugar varias veces) — no es un
 * mecanismo de seguridad fuerte ni una autenticación real: cualquiera que
 * borre el localStorage de su navegador puede jugar de nuevo. Se genera
 * una sola vez por navegador con crypto.randomUUID() y se reutiliza
 * mientras no se borre.
 */
export function obtenerDeviceId() {
  const existente = localStorage.getItem(DEVICE_ID_KEY);
  if (existente) return existente;

  const nuevo = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, nuevo);
  return nuevo;
}

// Una vez que Supabase confirma que el dispositivo ya jugó, esa respuesta
// nunca puede volver a "no ha jugado" — se cachea en localStorage para no
// tener que repetir la consulta de red cada vez que el cliente arma otro
// pedido.
function dispositivoYaJugoLocal() {
  return localStorage.getItem(YA_JUGO_KEY) === '1';
}

function marcarDispositivoComoJugadoLocal() {
  localStorage.setItem(YA_JUGO_KEY, '1');
}

/**
 * true si este dispositivo ya tiene una fila registrada en la tabla
 * dispositivos_ruleta de Supabase.
 */
export async function verificarSiYaJugo() {
  if (dispositivoYaJugoLocal()) return true;

  const deviceId = obtenerDeviceId();
  const { data, error } = await supabase
    .from('dispositivos_ruleta')
    .select('device_id')
    .eq('device_id', deviceId)
    .maybeSingle();

  if (error) {
    // Si Supabase falla (sin internet, servicio caído, etc.) se asume que
    // el dispositivo NO ha jugado — lo contrario bloquearía la ruleta para
    // todo el mundo cada vez que hay un problema de red, y esto es solo un
    // control de abuso liviano, no algo que valga la pena romperle la
    // compra al cliente.
    console.error('No se pudo verificar si el dispositivo ya jugó la ruleta:', error);
    return false;
  }

  const yaJugo = data !== null;
  if (yaJugo) marcarDispositivoComoJugadoLocal();
  return yaJugo;
}

/**
 * La ruleta en sí es una "oferta" más en la tabla `ofertas` (con el código
 * fijo 'ruleta', para distinguirla de las ofertas normales que el admin
 * crea desde admin.html) — el admin la activa o desactiva desde ahí, igual
 * que cualquier otra oferta. Si esa fila no existe o Supabase falla, se
 * asume APAGADA (lo contrario de verificarSiYaJugo arriba): esto no es un
 * control de abuso, es una promoción que el dueño del negocio prende o
 * apaga a propósito, así que por defecto se respeta "apagada" en vez de
 * arriesgarse a mostrar una promo que el admin ya quitó.
 */
export async function ruletaEstaActiva() {
  const { data, error } = await supabase.from('ofertas').select('activa').eq('codigo', 'ruleta').maybeSingle();

  if (error) {
    console.error('No se pudo verificar si la promoción de la ruleta está activa:', error);
    return false;
  }
  if (!data) return false;
  return data.activa === true;
}

/** Un carrito es elegible a la ruleta si su subtotal alcanza el mínimo, la promoción está activa Y el dispositivo no ha jugado antes. */
export async function deviceEsElegibleParaRuleta(subtotal) {
  if (subtotal < RULETA_MIN_SUBTOTAL) return false;
  const activa = await ruletaEstaActiva();
  if (!activa) return false;
  const yaJugo = await verificarSiYaJugo();
  return !yaJugo;
}

/** Sortea 50/50 cuál de las dos ruletas de 12 premios le toca al cliente. */
export function elegirRuletaAleatoria() {
  return Math.random() < 0.5 ? PREMIOS_RULETA_A : PREMIOS_RULETA_B;
}

// Si el azar cae en un premio "raro" (hoy: $30.000 y 1 Six), solo se
// mantiene esta fracción de las veces; el resto se vuelve a sortear entre
// las casillas no-raras. Se decide ANTES de empezar a girar, para que la
// rueda nunca gire hacia un premio y termine anunciando otro.
const PROBABILIDAD_MANTENER_RARO = 0.2;

function elegirIndiceObjetivo(lista) {
  const indice = Math.floor(Math.random() * lista.length);
  if (!lista[indice].raro || Math.random() < PROBABILIDAD_MANTENER_RARO) {
    return indice;
  }
  const indicesNoRaros = lista.map(function (_, i) { return i; }).filter(function (i) {
    return !lista[i].raro;
  });
  return indicesNoRaros[Math.floor(Math.random() * indicesNoRaros.length)];
}

/**
 * Sortea a qué casilla de `lista` (una de las dos ruletas de
 * premiosRuleta.js) debe ir la rueda, respetando el filtro de "raro".
 * Devuelve tanto el índice (para saber a dónde animar la rueda) como el
 * premio de esa casilla.
 */
export function sortearPremio(lista) {
  const indice = elegirIndiceObjetivo(lista);
  return { indice: indice, premio: lista[indice] };
}

/**
 * Extrae el número de un texto de premio tipo "10% en el total de la
 * cuenta" (10). La tabla dispositivos_ruleta exige un porcentaje numérico
 * por cada giro, aunque no todos los premios sean un % de descuento — para
 * cualquier otro premio se guarda 0.
 */
function extraerPorcentaje(texto) {
  const match = texto.match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? Number(match[1]) : 0;
}

/**
 * Registra en Supabase que este dispositivo ya giró la ruleta, con el
 * premio obtenido. Se debe llamar UNA SOLA VEZ, apenas termina la
 * animación de la rueda y se conoce el premio — nunca cuando el cliente
 * presiona "Continuar" (ver la regla estricta explicada en el mensaje de
 * la Tarea 4: si se registrara solo al presionar "Continuar", cerrando el
 * modal antes con Escape/clic afuera/X el cliente podría jugar de nuevo).
 */
export async function registrarGiro(premio) {
  const deviceId = obtenerDeviceId();
  const { error } = await supabase.from('dispositivos_ruleta').insert({
    device_id: deviceId,
    premio: premio.texto,
    porcentaje: extraerPorcentaje(premio.texto),
  });

  if (error) {
    console.error('No se pudo registrar el giro de la ruleta en Supabase:', error);
    return;
  }
  marcarDispositivoComoJugadoLocal();
}

/**
 * Arma el código corto que identifica el premio ganado, para usarlo en el
 * mensaje de WhatsApp en vez del texto legible del premio — así, aunque el
 * cliente edite el mensaje antes de enviarlo, no puede hacerse pasar por
 * otro premio sin adivinar un código que además coincida con la fecha de
 * hoy (quien atiende lo revisa contra una tabla física, fuera de la app).
 *
 * Formato: DD-PJK{codigo}-MM-XX
 *   DD = día de hoy, MM = mes de hoy, XX = 2 dígitos al azar generados una
 *   sola vez en el momento del giro (fijos de ahí en adelante).
 *
 * `codigo` es null para "Perdiste" y "Sigue intentando" — en ese caso esta
 * función también devuelve null (no hay nada que codificar).
 */
export function generarCodigoPremio(codigo, fecha) {
  if (!codigo) return null;
  fecha = fecha || new Date();
  const dd = String(fecha.getDate()).padStart(2, '0');
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const xx = String(Math.floor(Math.random() * 100)).padStart(2, '0');
  return dd + '-PJK' + codigo + '-' + mm + '-' + xx;
}

/**
 * Guarda el pedido completo en la tabla `pedidos` de Supabase. Se llama
 * justo antes de abrir WhatsApp (ver entrega.js) — si esta inserción falla
 * por cualquier razón, NO debe bloquear el envío del pedido por WhatsApp
 * (eso es lo prioritario): el error solo se deja en consola para poder
 * revisarlo después.
 *
 * Asume que la tabla `pedidos` tiene una columna `productos` (json) y una
 * `codigo_premio` (texto, puede ser nula) — si esas columnas todavía no
 * existen en Supabase, esta inserción falla pero, como se explica arriba,
 * eso no interrumpe nada para el cliente.
 */
export async function guardarPedidoSupabase(datosPedido) {
  const { error } = await supabase.from('pedidos').insert({
    device_id: obtenerDeviceId(),
    nombre: datosPedido.nombre,
    celular: datosPedido.celular,
    direccion: datosPedido.direccion,
    productos: datosPedido.productos,
    subtotal: datosPedido.subtotal,
    codigo_premio: datosPedido.codigoPremio || null,
  });

  if (error) {
    console.error('No se pudo guardar el pedido en Supabase:', error);
    return false;
  }
  return true;
}

// ============================================================
// Ruleta visual (el modal en carrito.html)
// ============================================================
// Igual que en menu.js/carrito.js, estas funciones buscan sus elementos
// por id y no hacen nada si no los encuentran — así es seguro cargar este
// archivo en cualquier página aunque solo carrito.html tenga el modal.

const EXTRA_SPINS = 5; // vueltas completas antes de frenar en el premio elegido
const SPIN_DURATION_MS = 4000;
const SEGMENT_COLORS = ['var(--cream-dim)', 'var(--amber)', 'var(--teal)'];

// Textos cortos SOLO para el rótulo que se ve encima de cada segmento de
// la rueda (para que quepa en el espacio angosto de un segmento) — el
// resultado que se muestra al terminar de girar, y lo que se guarda en
// Supabase, siempre usan el texto completo y exacto de premiosRuleta.js.
const TEXTO_CORTO_RUEDA = {
  'Ganaste 1 Poker': '1 Poker',
  'Ganaste $30.000': '$30.000',
  'Ganaste $10.000 redimible en punto físico': '$10.000 en punto físico',
  '10% en el total de la cuenta': '10% en la cuenta',
  'Ganaste un bombón': 'Un bombón',
  '10% descuento en un producto seleccionado': '10% en un producto',
  'Ganaste 1 Six': '1 Six',
  'Ganaste un agua': 'Un agua',
  '5% en el total de la cuenta': '5% en la cuenta',
  'Ganaste un premio sorpresa': 'Premio sorpresa',
};

function textoCortoParaRueda(texto) {
  return TEXTO_CORTO_RUEDA[texto] || texto;
}

// Estado de la partida actual: null mientras el modal está cerrado.
// fase: 'listo' | 'girando' | 'sigue' | 'resultado'
let estadoRuleta = null;
// Qué elemento tenía el foco antes de abrir el modal (normalmente el botón
// "Continuar pedido" del carrito) — para devolvérselo al cerrar.
let elementoConFocoAntesDeLaRuleta = null;

function elementosModal() {
  return {
    overlay: document.getElementById('ruleta-overlay'),
    sheet: document.getElementById('ruleta-sheet'),
    wheel: document.getElementById('ruleta-wheel'),
    cerrar: document.getElementById('ruleta-cerrar'),
    btnAccion: document.getElementById('ruleta-btn-accion'),
    resultado: document.getElementById('ruleta-resultado'),
  };
}

function construirFondoConic(lista) {
  const segmentDeg = 360 / lista.length;
  const partes = lista.map(function (_, i) {
    const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
    return color + ' ' + i * segmentDeg + 'deg ' + (i + 1) * segmentDeg + 'deg';
  });
  return 'conic-gradient(' + partes.join(', ') + ')';
}

function pintarRueda(lista, wheel) {
  const segmentDeg = 360 / lista.length;
  wheel.style.background = construirFondoConic(lista);
  wheel.innerHTML = '';

  lista.forEach(function (premio, i) {
    // El conic-gradient mide sus ángulos desde arriba, pero cada rótulo
    // (antes de rotar) apunta hacia abajo — por eso +180°, si no el texto
    // quedaría sobre el segmento opuesto al que en verdad le corresponde.
    const anguloDiv = (i * segmentDeg + segmentDeg / 2 + 180) % 360;
    // Ese mismo giro deja el texto boca abajo en la mitad izquierda de la
    // rueda (entre 90° y 270°) — se corrige volteando solo el texto.
    const volteado = anguloDiv > 90 && anguloDiv < 270;

    const label = document.createElement('div');
    label.className = 'ruleta-label';
    label.style.transform = 'rotate(' + anguloDiv + 'deg)';

    const span = document.createElement('span');
    span.textContent = textoCortoParaRueda(premio.texto);
    if (volteado) span.style.transform = 'rotate(180deg)';

    label.appendChild(span);
    wheel.appendChild(label);
  });
}

/**
 * Calcula la rotación total (en grados, siempre creciente respecto a la
 * anterior) para que el segmento `targetIndex` quede exactamente bajo el
 * puntero fijo de arriba, después de dar varias vueltas completas.
 */
function calcularRotacion(rotacionActual, targetIndex, segmentDeg) {
  const centroSegmento = targetIndex * segmentDeg + segmentDeg / 2;
  const moduloObjetivo = (360 - centroSegmento + 360) % 360;
  const moduloActual = ((rotacionActual % 360) + 360) % 360;
  let delta = moduloObjetivo - moduloActual;
  if (delta <= 0) delta += 360;
  return rotacionActual + EXTRA_SPINS * 360 + delta;
}

/** Abre el modal con una ruleta (A o B, sorteada) lista para girar. */
export function abrirRuleta() {
  const els = elementosModal();
  if (!els.overlay) return; // esta página no tiene el modal de la ruleta

  const lista = elegirRuletaAleatoria();
  estadoRuleta = { fase: 'listo', lista: lista, targetIndex: null, rotacionActual: 0 };

  pintarRueda(lista, els.wheel);
  // Deja la rueda en 0° sin transición antes de mostrarla — si quedó
  // girada de una partida anterior, sin esto se vería "saltar" de golpe.
  els.wheel.style.transition = 'none';
  els.wheel.style.transform = 'rotate(0deg)';
  void els.wheel.offsetHeight; // fuerza al navegador a aplicar el cambio de arriba antes de reactivar la transición
  els.wheel.style.transition = '';

  els.resultado.textContent = '';
  els.btnAccion.textContent = 'Girar';
  els.btnAccion.disabled = false;
  els.cerrar.disabled = false;

  elementoConFocoAntesDeLaRuleta = document.activeElement;
  els.overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  els.cerrar.focus();
}

function cerrarRuleta() {
  // Mientras la rueda está girando no se deja cerrar (con nada: Escape,
  // clic afuera o la X) — si se cerrara a mitad de la animación, el giro
  // nunca terminaría de resolverse y el premio se perdería sin registrar.
  if (estadoRuleta && estadoRuleta.fase === 'girando') return;

  const els = elementosModal();
  if (els.overlay) els.overlay.hidden = true;
  document.body.style.overflow = '';

  if (elementoConFocoAntesDeLaRuleta) elementoConFocoAntesDeLaRuleta.focus();
}

function girar() {
  if (!estadoRuleta || estadoRuleta.fase === 'girando') return;
  const els = elementosModal();
  const segmentDeg = 360 / estadoRuleta.lista.length;
  const sorteo = sortearPremio(estadoRuleta.lista);

  estadoRuleta.targetIndex = sorteo.indice;
  estadoRuleta.fase = 'girando';
  estadoRuleta.rotacionActual = calcularRotacion(estadoRuleta.rotacionActual, sorteo.indice, segmentDeg);

  els.resultado.textContent = '';
  els.btnAccion.disabled = true;
  els.btnAccion.textContent = 'Girando...';
  els.cerrar.disabled = true;

  els.wheel.style.transition = 'transform ' + SPIN_DURATION_MS + 'ms cubic-bezier(0.12, 0.67, 0.16, 1)';
  els.wheel.style.transform = 'rotate(' + estadoRuleta.rotacionActual + 'deg)';
}

function manejarFinDeGiro(e) {
  const els = elementosModal();
  if (e.target !== els.wheel || e.propertyName !== 'transform') return;
  if (!estadoRuleta || estadoRuleta.fase !== 'girando') return;

  const premio = estadoRuleta.lista[estadoRuleta.targetIndex];
  els.cerrar.disabled = false;

  if (premio.texto === SIGUE_INTENTANDO) {
    // "Sigue intentando" no cuenta como el giro del dispositivo (no es un
    // premio real) — se puede girar de nuevo de una vez, sin registrar
    // nada en Supabase.
    estadoRuleta.fase = 'sigue';
    els.resultado.textContent = premio.texto;
    els.btnAccion.disabled = false;
    els.btnAccion.textContent = 'Girar de nuevo';
    return;
  }

  // A partir de aquí (incluye "Perdiste", que sí cuenta como el giro del
  // dispositivo) se muestra el resultado y se registra el giro de una vez
  // — sin esperar a que el cliente presione "Continuar" (regla estricta de
  // la Tarea 4, ver el comentario de registrarGiro más arriba).
  estadoRuleta.fase = 'resultado';
  els.resultado.textContent = premio.texto;
  els.btnAccion.disabled = false;
  els.btnAccion.textContent = 'Continuar';

  if (premio.codigo) {
    const codigoGenerado = generarCodigoPremio(premio.codigo);
    // guardarCodigoPremio vive en carrito.js (cargado antes que este
    // módulo en carrito.html) — se cuelga como función global normal, así
    // que un módulo también puede llamarla como identificador suelto.
    guardarCodigoPremio(codigoGenerado);
  }

  // No se espera (`await`) esta llamada a propósito: no hay que bloquear
  // la interfaz por la red, el registro ya quedó disparado apenas se supo
  // el premio, que es lo único que exige la regla estricta.
  registrarGiro(premio);
}

function manejarClickBotonAccion() {
  if (!estadoRuleta) return;
  if (estadoRuleta.fase === 'listo' || estadoRuleta.fase === 'sigue') {
    girar();
  } else if (estadoRuleta.fase === 'resultado') {
    window.location.href = 'entrega.html';
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const els = elementosModal();
  if (!els.overlay) return; // esta página no tiene el modal de la ruleta

  els.wheel.addEventListener('transitionend', manejarFinDeGiro);
  els.btnAccion.addEventListener('click', manejarClickBotonAccion);
  els.cerrar.addEventListener('click', cerrarRuleta);

  // Clic en el fondo oscuro (fuera de la tarjeta del modal) para cerrar.
  els.overlay.addEventListener('click', function (e) {
    if (e.target === els.overlay) cerrarRuleta();
  });

  document.addEventListener('keydown', function (e) {
    if (els.overlay.hidden) return;

    if (e.key === 'Escape') {
      cerrarRuleta();
      return;
    }

    // Atrapa el foco de teclado (Tab) dentro del modal mientras está
    // abierto, para que no se pueda tabular hacia botones de detrás.
    if (e.key !== 'Tab') return;
    const focosPosibles = els.sheet.querySelectorAll('button:not([disabled])');
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

// ============================================================
// Exponer a window lo que necesitan carrito.js, entrega.js e inicio.js
// (scripts normales, no módulos) — ver el comentario al inicio del archivo.
// ============================================================
window.deviceEsElegibleParaRuleta = deviceEsElegibleParaRuleta;
window.ruletaEstaActiva = ruletaEstaActiva;
window.abrirRuleta = abrirRuleta;
window.guardarPedidoSupabase = guardarPedidoSupabase;
