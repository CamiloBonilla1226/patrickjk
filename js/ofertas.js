// Pantalla pública de Ofertas: lee de la tabla `ofertas` en Supabase (solo
// lectura, con la misma "anon key" pública que ya usa el resto del
// proyecto — ver config-supabase.js) y pinta las que estén activas.
//
// También se carga en index.html (Inicio) por cargarOfertaDestacada: la
// UNA oferta que el admin eligió para mostrar ahí (ver el panel de admin), con
// respaldo automático a la más antigua si no ha elegido ninguna.
//
// Es un módulo de JavaScript (type="module") por la misma razón que
// ruleta.js: así se puede usar `import` para traer el cliente de Supabase
// desde un CDN sin agregar un build step al proyecto.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config-supabase.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// La fila de la ruleta (ver js/ruleta.js) nunca debe aparecer como "oferta
// destacada" genérica — ya tiene su propio banner en Inicio.
const CODIGO_RULETA = 'ruleta';

function crearTarjetaOferta(oferta) {
  const tarjeta = document.createElement('div');
  tarjeta.className = 'oferta-card';
  tarjeta.innerHTML =
    '<svg class="ico oferta-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
      '<path d="M20.6 12.3 12.7 20.2a1.5 1.5 0 0 1-2.1 0L3.8 13.4a1.5 1.5 0 0 1 0-2.1l7.9-7.9c.3-.3.7-.5 1.1-.5h6a1.5 1.5 0 0 1 1.5 1.5v6c0 .4-.2.8-.5 1.1Z" />' +
      '<circle cx="15.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />' +
    '</svg>' +
    '<div class="oferta-texto">' +
      '<h3></h3>' +
      '<p></p>' +
    '</div>';
  tarjeta.querySelector('h3').textContent = oferta.titulo;
  const descripcionEl = tarjeta.querySelector('p');
  if (oferta.descripcion) {
    descripcionEl.textContent = oferta.descripcion;
  } else {
    descripcionEl.remove();
  }
  return tarjeta;
}

async function cargarOfertas() {
  const lista = document.getElementById('ofertas-lista');
  const vacio = document.getElementById('ofertas-vacio');
  const cargando = document.getElementById('ofertas-cargando');
  if (!lista || !vacio || !cargando) return;

  // Sin .order() a propósito — mismo motivo que en el admin (admin.js /
  // cargarPedidos): pedir que ordene por una columna cuyo nombre exacto no
  // conocemos con certeza (creado_en, created_at...) hace fallar TODA la
  // consulta si no existe. Se trae todo sin ordenar y se ordena aquí mismo.
  const { data, error } = await supabase.from('ofertas').select('*').eq('activa', true);

  cargando.hidden = true;

  if (error) {
    console.error('No se pudieron cargar las ofertas:', error);
    vacio.hidden = false;
    vacio.textContent = 'No se pudieron cargar las ofertas en este momento. Intenta de nuevo más tarde.';
    return;
  }

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
    lista.appendChild(crearTarjetaOferta(oferta));
  });
}

/**
 * De una lista de ofertas (ya filtrada por `activa`), devuelve la primera
 * que no sea la fila especial de la ruleta — o null si no queda ninguna.
 */
function primeraNoRuleta(ofertas) {
  const validas = (ofertas || []).filter(function (o) {
    return o.codigo !== CODIGO_RULETA;
  });
  return validas.length > 0 ? validas[0] : null;
}

/**
 * Pinta en Inicio la UNA oferta que debe destacarse: primero busca la que
 * el admin marcó como `destacada` (desde el panel de admin); si no hay ninguna (o la
 * consulta falla), usa como respaldo la oferta activa más antigua — así
 * Inicio siempre muestra algo mientras exista al menos una oferta activa,
 * sin que el admin tenga que elegir una a la fuerza.
 *
 * En Inicio solo debe verse UN aviso de promoción a la vez: si la ruleta
 * está activa, ya tiene su propio banner (ver actualizarBannerRuleta en
 * inicio.js) y esta tarjeta se queda oculta aunque exista una oferta
 * destacada — mostrar los dos juntos es justo el bug que se reportó.
 *
 * Sin importar cómo termine, avisa con marcarPromoCheckListo (definida en
 * js/navegacion.js) — es la otra de las dos consultas que #promo-skeleton
 * espera antes de dejar de reservar espacio en la pantalla.
 */
async function cargarOfertaDestacada() {
  const contenedor = document.getElementById('oferta-destacada');
  if (!contenedor) {
    if (typeof marcarPromoCheckListo === 'function') marcarPromoCheckListo();
    return; // esta página no tiene el bloque de oferta destacada
  }

  try {
    if (typeof ruletaEstaActiva === 'function') {
      try {
        const ruletaActiva = await ruletaEstaActiva();
        if (ruletaActiva) {
          contenedor.hidden = true;
          return;
        }
      } catch (error) {
        console.error('No se pudo verificar si la ruleta está activa antes de mostrar la oferta destacada:', error);
      }
    }

    let oferta = null;

    const { data: destacadas, error: errorDestacada } = await supabase
      .from('ofertas')
      .select('*')
      .eq('activa', true)
      .eq('destacada', true)
      .limit(5);

    if (errorDestacada) {
      console.error('No se pudo cargar la oferta destacada:', errorDestacada);
    } else {
      oferta = primeraNoRuleta(destacadas);
    }

    if (!oferta) {
      // Sin .order() a propósito — ver el comentario en cargarOfertas más
      // arriba. Se trae todo lo activo y se elige la más antigua aquí mismo.
      const { data: primeras, error: errorPrimera } = await supabase
        .from('ofertas')
        .select('*')
        .eq('activa', true)
        .limit(20);

      if (errorPrimera) {
        console.error('No se pudo cargar ninguna oferta de respaldo:', errorPrimera);
      } else {
        const ordenadas = (primeras || []).slice().sort(function (a, b) {
          const fechaA = a.creado_en || a.created_at || '';
          const fechaB = b.creado_en || b.created_at || '';
          return fechaA < fechaB ? -1 : fechaA > fechaB ? 1 : 0;
        });
        oferta = primeraNoRuleta(ordenadas);
      }
    }

    if (!oferta) {
      contenedor.hidden = true;
      return;
    }

    contenedor.querySelector('.oferta-destacada-titulo').textContent = oferta.titulo;
    const descripcionEl = contenedor.querySelector('.oferta-destacada-desc');
    if (oferta.descripcion) {
      descripcionEl.hidden = false;
      descripcionEl.textContent = oferta.descripcion;
    } else {
      descripcionEl.hidden = true;
    }
    contenedor.hidden = false;
  } finally {
    if (typeof marcarPromoCheckListo === 'function') marcarPromoCheckListo();
  }
}

document.addEventListener('DOMContentLoaded', function () {
  cargarOfertas();
  cargarOfertaDestacada();
});
