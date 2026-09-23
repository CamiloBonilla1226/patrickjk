// Panel de administrador de Ofertas — SIN login (decisión explícita del
// dueño del proyecto, con el riesgo ya advertido: cualquiera que tenga
// esta URL puede agregar o borrar ofertas). Si en algún momento se agrega
// un login real (Supabase Auth), este archivo es el que hay que ajustar
// para que use la sesión del usuario en vez de la llave anónima directa.
//
// Módulo de JavaScript (type="module") por la misma razón que ruleta.js y
// ofertas.js: así se puede usar `import` para traer el cliente de Supabase
// desde un CDN sin agregar un build step al proyecto.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config-supabase.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function crearFilaOferta(oferta) {
  const fila = document.createElement('div');
  fila.className = 'admin-oferta-row';

  fila.innerHTML =
    '<div class="admin-oferta-info">' +
      '<h3></h3>' +
      '<p></p>' +
    '</div>' +
    '<div class="admin-oferta-acciones">' +
      '<button type="button" class="admin-toggle-btn"></button>' +
      '<button type="button" class="admin-borrar-btn" aria-label="Borrar oferta">' +
        '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
          '<path d="M4 7h16" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />' +
          '<path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" /><path d="M10 11v6M14 11v6" />' +
        '</svg>' +
      '</button>' +
    '</div>';

  fila.querySelector('h3').textContent = oferta.titulo;
  const descripcionEl = fila.querySelector('p');
  if (oferta.descripcion) {
    descripcionEl.textContent = oferta.descripcion;
  } else {
    descripcionEl.remove();
  }

  const botonToggle = fila.querySelector('.admin-toggle-btn');
  botonToggle.textContent = oferta.activa ? 'Activa — ocultar' : 'Oculta — activar';
  botonToggle.className = 'admin-toggle-btn' + (oferta.activa ? ' is-activa' : '');
  botonToggle.addEventListener('click', function () {
    alternarOferta(oferta.id, !oferta.activa);
  });

  fila.querySelector('.admin-borrar-btn').addEventListener('click', function () {
    borrarOferta(oferta.id, oferta.titulo);
  });

  return fila;
}

async function cargarOfertasAdmin() {
  const lista = document.getElementById('admin-lista');
  const vacio = document.getElementById('admin-vacio');
  if (!lista || !vacio) return;

  const { data, error } = await supabase
    .from('ofertas')
    .select('id, titulo, descripcion, activa')
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
  cargarOfertasAdmin();
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
  cargarOfertasAdmin();
}

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
  cargarOfertasAdmin();

  const form = document.getElementById('admin-form');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const campoTitulo = document.getElementById('admin-titulo');
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
    cargarOfertasAdmin();
  });
});
