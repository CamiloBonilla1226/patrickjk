// Datos de ejemplo — reemplazar por una fuente de datos real (backend) más
// adelante. Mismo catálogo que el proyecto en React (mismos ids, nombres,
// precios, categorías y estados), solo que aquí es un arreglo plano cargado
// directo con una etiqueta <script>, en vez de un "import" — este proyecto
// no usa módulos ES ni build step, así que cualquier archivo .js que se
// cargue antes en el HTML deja sus variables disponibles para los que
// vienen después (por eso el orden de los <script> en cada .html importa).
//
// Forma de cada producto:
// {
//   id: string,
//   nombre: string,
//   precio: number,
//   categoria: string,
//   estado: 'disponible' | 'agotado',
//   sabores: string[] (opcional — si existe, el cliente debe elegir uno; no se usa todavía),
//   imagen: string (ruta relativa a la carpeta productos/, usada por el Menú y el Inicio)
// }

const productos = [
  // Cervezas — six packs
  { id: 'cerveza-sixpack-poker', nombre: 'Six Pack Poker', precio: 30000, categoria: 'Cervezas', estado: 'disponible', imagen: 'productos/cerveza-sixpack-poker.webp' },
  { id: 'cerveza-sixpack-aguila-light', nombre: 'Six Pack Águila Light', precio: 30000, categoria: 'Cervezas', estado: 'disponible', imagen: 'productos/cerveza-sixpack-aguila-light.webp' },
  { id: 'cerveza-sixpack-aguila-original', nombre: 'Six Pack Águila Original', precio: 30000, categoria: 'Cervezas', estado: 'disponible', imagen: 'productos/cerveza-sixpack-aguila-original.webp' },
  { id: 'cerveza-sixpack-budweiser', nombre: 'Six Pack Budweiser', precio: 30000, categoria: 'Cervezas', estado: 'disponible', imagen: 'productos/cerveza-sixpack-budweiser.webp' },
  { id: 'cerveza-sixpack-heineken', nombre: 'Six Pack Heineken', precio: 30000, categoria: 'Cervezas', estado: 'disponible', imagen: 'productos/cerveza-sixpack-heineken.webp' },

  // Cervezas — unidad
  { id: 'cerveza-poker', nombre: 'Poker', precio: 5000, categoria: 'Cervezas', estado: 'disponible', imagen: 'productos/cerveza-poker.webp' },
  { id: 'cerveza-corona', nombre: 'Corona', precio: 8000, categoria: 'Cervezas', estado: 'disponible', imagen: 'productos/cerveza-corona.webp' },
  { id: 'cerveza-coronita', nombre: 'Coronita', precio: 5000, categoria: 'Cervezas', estado: 'disponible', imagen: 'productos/cerveza-coronita.webp' },
  { id: 'cerveza-aguila-light', nombre: 'Águila Light', precio: 5000, categoria: 'Cervezas', estado: 'disponible', imagen: 'productos/cerveza-aguila-light.webp' },
  { id: 'cerveza-aguila-original', nombre: 'Águila Original', precio: 5000, categoria: 'Cervezas', estado: 'disponible', imagen: 'productos/cerveza-aguila-original.webp' },
  { id: 'cerveza-club-colombia-dorada', nombre: 'Club Colombia Dorada', precio: 5000, categoria: 'Cervezas', estado: 'disponible', imagen: 'productos/cerveza-club-colombia-dorada.webp' },
  { id: 'cerveza-costenita', nombre: 'Costeñita', precio: 4000, categoria: 'Cervezas', estado: 'disponible', imagen: 'productos/cerveza-costenita.webp' },
  { id: 'cerveza-heineken', nombre: 'Heineken', precio: 5000, categoria: 'Cervezas', estado: 'disponible', imagen: 'productos/cerveza-heineken.webp' },
  { id: 'cerveza-budweiser', nombre: 'Budweiser', precio: 5000, categoria: 'Cervezas', estado: 'disponible', imagen: 'productos/cerveza-budweiser.webp' },
  { id: 'cerveza-tecate', nombre: 'Tecate', precio: 4000, categoria: 'Cervezas', estado: 'disponible', imagen: 'productos/cerveza-tecate.webp' },

  // Aperitivos — cada uno aparece UNA sola vez y el cliente elige el sabor
  // en la ficha del producto (mismo patrón que Electrolit/Gatorade en
  // Bebidas), en vez de repetir el producto una vez por sabor.
  { id: 'aperitivo-cuates', nombre: 'Cuates', precio: 6000, categoria: 'Aperitivos', estado: 'disponible', sabores: ['Rojo', 'Amarillo', 'Verde'], imagen: 'productos/aperitivo-cuates-rojo.webp' },
  { id: 'aperitivo-smirnoff', nombre: 'Smirnoff', precio: 10000, categoria: 'Aperitivos', estado: 'disponible', sabores: ['Manzana Verde', 'Original'], imagen: 'productos/aperitivo-smirnoff-manzana-verde.webp' },
  { id: 'aperitivo-redds', nombre: "Redd's", precio: 5000, categoria: 'Aperitivos', estado: 'disponible', sabores: ['Rose', 'Verde'], imagen: 'productos/aperitivo-redds-rose.webp' },
  { id: 'aperitivo-like', nombre: 'Like', precio: 5000, categoria: 'Aperitivos', estado: 'disponible', sabores: ['Blueberry', 'Citrus', 'Mango', 'Fresh Apple'], imagen: 'productos/aperitivo-like-blueberry.webp' },

  // Mecato
  { id: 'mecato-bombones', nombre: 'Bombones', precio: 1000, categoria: 'Mecato', estado: 'disponible', imagen: 'productos/mecato-bombones.png' },
  { id: 'mecato-mani-moto', nombre: 'Maní Moto', precio: 2500, categoria: 'Mecato', estado: 'disponible', imagen: 'productos/mecato-mani-moto.webp' },
  { id: 'mecato-traidet', nombre: 'Traidet', precio: 3000, categoria: 'Mecato', estado: 'disponible', imagen: 'productos/mecato-trident.webp' },
  { id: 'mecato-chao', nombre: 'Chao', precio: 2500, categoria: 'Mecato', estado: 'disponible', imagen: 'productos/mecato-chao.webp' },
  { id: 'mecato-de-toditos', nombre: 'De Toditos', precio: 5000, categoria: 'Mecato', estado: 'disponible', sabores: ['Mix', 'BBQ', 'Limón', 'Natural', 'Pollo'], imagen: 'productos/mecato-de-toditos.webp' },
  { id: 'mecato-margarita', nombre: 'Margarita', precio: 5000, categoria: 'Mecato', estado: 'disponible', sabores: ['Limón', 'Natural', 'Pollo'], imagen: 'productos/mecato-margarita-limon.webp' },
  { id: 'mecato-onduladas', nombre: 'Onduladas', precio: 5000, categoria: 'Mecato', estado: 'disponible', sabores: ['Mayonesa', 'Tomate'], imagen: 'productos/mecato-onduladas-mayonesa.webp' },
  { id: 'mecato-cheetos', nombre: 'Cheetos', precio: 5000, categoria: 'Mecato', estado: 'disponible', imagen: 'productos/mecato-cheetos.webp' },
  { id: 'mecato-natuchips', nombre: 'Natuchips', precio: 5000, categoria: 'Mecato', estado: 'disponible', imagen: 'productos/mecato-natuchips.webp' },
  { id: 'mecato-doritos', nombre: 'Doritos', precio: 5000, categoria: 'Mecato', estado: 'disponible', imagen: 'productos/mecato-doritos.webp' },
  { id: 'mecato-chochitos-medianos', nombre: 'Chochitos Medianos', precio: 5000, categoria: 'Mecato', estado: 'disponible', imagen: 'productos/mecato-chochitos-medianos.webp' },
  { id: 'mecato-chochitos-grandes', nombre: 'Chochitos Grandes', precio: 10000, categoria: 'Mecato', estado: 'disponible', imagen: 'productos/mecato-chochitos-grandes.webp' },
  { id: 'mecato-chochitos-pequenos', nombre: 'Chochitos Pequeños', precio: 3000, categoria: 'Mecato', estado: 'disponible', imagen: 'productos/mecato-chochitos-pequenos.webp' },

  // Bebidas
  { id: 'bebida-electrolit', nombre: 'Electrolit', precio: 12000, categoria: 'Bebidas', estado: 'disponible', sabores: ['Uva', 'Fresa Kiwi', 'Jamaica', 'Maracuyá'], imagen: 'productos/bebida-electrolit.webp' },
  { id: 'bebida-gatorade', nombre: 'Gatorade', precio: 6000, categoria: 'Bebidas', estado: 'disponible', sabores: ['Rojo', 'Azul', 'Naranja'], imagen: 'productos/bebida-gatorade.webp' },
  { id: 'bebida-soda-grande', nombre: 'Soda Grande', precio: 7000, categoria: 'Bebidas', estado: 'disponible', imagen: 'productos/bebida-soda-grande.webp' },
  { id: 'bebida-soda-pequena', nombre: 'Soda Pequeña', precio: 5000, categoria: 'Bebidas', estado: 'disponible', imagen: 'productos/bebida-soda-pequena.webp' },
  { id: 'bebida-agua', nombre: 'Agua', precio: 2500, categoria: 'Bebidas', estado: 'disponible', imagen: 'productos/bebida-agua.webp' },
  { id: 'bebida-vive100', nombre: 'Vive 100', precio: 5000, categoria: 'Bebidas', estado: 'disponible', sabores: ['Original', 'Sandía'], imagen: 'productos/bebida-vive100.webp' },

  // Alcohol
  { id: 'alcohol-jose-cuervo', nombre: 'José Cuervo', precio: 90000, categoria: 'Alcohol', estado: 'disponible', imagen: 'productos/alcohol-jose-cuervo.webp' },
  { id: 'alcohol-jose-cuervo-media', nombre: 'José Cuervo Media', precio: 60000, categoria: 'Alcohol', estado: 'disponible', imagen: 'productos/alcohol-jose-cuervo-media.webp' },
  { id: 'alcohol-baileys', nombre: 'Baileys', precio: 110000, categoria: 'Alcohol', estado: 'disponible', imagen: 'productos/alcohol-baileys.webp' },
  { id: 'alcohol-old-parr', nombre: 'Old Parr', precio: 170000, categoria: 'Alcohol', estado: 'disponible', imagen: 'productos/alcohol-old-parr.webp' },
  { id: 'alcohol-buchanans-deluxe', nombre: "Buchanan's Deluxe", precio: 220000, categoria: 'Alcohol', estado: 'disponible', imagen: 'productos/alcohol-buchanans-deluxe.webp' },
  { id: 'alcohol-buchanans-master', nombre: "Buchanan's Máster", precio: 270000, categoria: 'Alcohol', estado: 'disponible', imagen: 'productos/alcohol-buchanans-master.webp' },
  { id: 'alcohol-aguardiente-antioqueno', nombre: 'Aguardiente Antioqueño', precio: 60000, categoria: 'Alcohol', estado: 'disponible', imagen: 'productos/alcohol-aguardiente-antioqueno.webp' },
  { id: 'alcohol-aguardiente-antioqueno-media', nombre: 'Aguardiente Antioqueño Media', precio: 35000, categoria: 'Alcohol', estado: 'disponible', imagen: 'productos/alcohol-aguardiente-antioqueno-media.webp' },
  { id: 'alcohol-aguardiente-caucano', nombre: 'Aguardiente Caucano', precio: 58000, categoria: 'Alcohol', estado: 'disponible', imagen: 'productos/alcohol-aguardiente-caucano.webp' },
  { id: 'alcohol-aguardiente-caucano-media', nombre: 'Aguardiente Caucano Media', precio: 30000, categoria: 'Alcohol', estado: 'disponible', imagen: 'productos/alcohol-aguardiente-caucano-media.webp' },
  { id: 'alcohol-aguardiente-amarillo', nombre: 'Aguardiente Amarillo', precio: 70000, categoria: 'Alcohol', estado: 'disponible', imagen: 'productos/alcohol-aguardiente-amarillo.webp' },
  { id: 'alcohol-aguardiente-amarillo-media', nombre: 'Aguardiente Amarillo Media', precio: 40000, categoria: 'Alcohol', estado: 'disponible', imagen: 'productos/alcohol-aguardiente-amarillo-media.webp' },
  { id: 'alcohol-smirnoff-tamarindo', nombre: 'Smirnoff Tamarindo', precio: 70000, categoria: 'Alcohol', estado: 'disponible', imagen: 'productos/alcohol-smirnoff-tamarindo.webp' },
  { id: 'alcohol-smirnoff-lulo', nombre: 'Smirnoff Lulo', precio: 70000, categoria: 'Alcohol', estado: 'disponible', imagen: 'productos/alcohol-smirnoff-lulo.webp' },
  { id: 'alcohol-smirnoff-lulo-media', nombre: 'Smirnoff Lulo Media', precio: 35000, categoria: 'Alcohol', estado: 'disponible', imagen: 'productos/alcohol-smirnoff-lulo-media.webp' },
  { id: 'alcohol-ron-tradicional', nombre: 'Ron Tradicional', precio: 70000, categoria: 'Alcohol', estado: 'disponible', imagen: 'productos/alcohol-ron-tradicional.webp' },
  { id: 'alcohol-ron-tradicional-media', nombre: 'Ron Tradicional Media', precio: 40000, categoria: 'Alcohol', estado: 'disponible', imagen: 'productos/alcohol-ron-tradicional-media.webp' },
  { id: 'alcohol-ron-esencial', nombre: 'Ron Esencial', precio: 68000, categoria: 'Alcohol', estado: 'disponible', imagen: 'productos/alcohol-ron-esencial.webp' },
  { id: 'alcohol-ron-esencial-media', nombre: 'Ron Esencial Media', precio: 38000, categoria: 'Alcohol', estado: 'disponible', imagen: 'productos/alcohol-ron-esencial-media.webp' },
];

// Categorías derivadas del catálogo (en el orden en que aparecen), para no
// mantener una lista aparte que se pueda desincronizar de los productos.
const categorias = [];
productos.forEach(function (producto) {
  if (categorias.indexOf(producto.categoria) === -1) {
    categorias.push(producto.categoria);
  }
});

// Formato de precio compartido por todas las pantallas que muestran precios.
function formatPrice(precio) {
  return '$' + precio.toLocaleString('es-CO');
}
