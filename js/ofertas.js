// Pantalla pública de Ofertas: lee de la tabla `ofertas` en Supabase (solo
// lectura, con la misma "anon key" pública que ya usa el resto del
// proyecto — ver config-supabase.js) y pinta las que estén activas.
//
// Es un módulo de JavaScript (type="module") por la misma razón que
// ruleta.js: así se puede usar `import` para traer el cliente de Supabase
// desde un CDN sin agregar un build step al proyecto.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config-supabase.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  const { data, error } = await supabase
    .from('ofertas')
    .select('id, titulo, descripcion')
    .eq('activa', true)
    .order('creado_en', { ascending: false });

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
  data.forEach(function (oferta) {
    lista.appendChild(crearTarjetaOferta(oferta));
  });
}

document.addEventListener('DOMContentLoaded', cargarOfertas);
