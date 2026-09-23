// Catálogo de precios del punto físico (el estanco) — se muestra en
// carta.html, la carta que se escanea por QR en el local.
//
// A propósito es un archivo y un arreglo SEPARADOS de productos.js: aunque
// varios productos se llaman igual, varios precios son distintos a los que
// se manejan a domicilio (por ejemplo Gatorade, Smirnoff, Agua), y hay dos
// bebidas que solo existen en el punto físico (Bomba Patrick's y Bomba
// JK) — mezclar los dos catálogos en un solo arreglo habría obligado a que
// todo producto tuviera un precio "de domicilio" y uno "del estanco", lo
// cual complica sin necesidad los otros archivos (carrito, ficha, admin)
// que nunca necesitan saber nada del estanco.
//
// Esta carta es solo para mostrar — no hay carrito ni botón de agregar acá,
// así que no hace falta un `id` único por producto ni un `estado`
// (disponible/agotado): es un menú de precios, no un catálogo para comprar.
//
// Forma de cada producto:
// {
//   nombre: string,
//   precio: number,
//   categoria: string,
//   sabores: string[] (opcional — se muestra como lista de opciones, sin selector)
// }

const productosEstanco = [
  // Alcohol
  { nombre: 'José Cuervo', precio: 130000, categoria: 'Alcohol' },
  { nombre: 'José Cuervo Media', precio: 70000, categoria: 'Alcohol' },
  { nombre: 'Baileys', precio: 120000, categoria: 'Alcohol' },
  { nombre: 'Old Parr', precio: 260000, categoria: 'Alcohol' },
  { nombre: "Buchanan's Deluxe", precio: 280000, categoria: 'Alcohol' },
  { nombre: "Buchanan's Máster", precio: 340000, categoria: 'Alcohol' },
  { nombre: 'Aguardiente Antioqueño', precio: 80000, categoria: 'Alcohol' },
  { nombre: 'Aguardiente Antioqueño Media', precio: 37000, categoria: 'Alcohol' },
  { nombre: 'Aguardiente Caucano', precio: 60000, categoria: 'Alcohol' },
  { nombre: 'Aguardiente Caucano Media', precio: 35000, categoria: 'Alcohol' },
  { nombre: 'Aguardiente Amarillo', precio: 85000, categoria: 'Alcohol' },
  { nombre: 'Aguardiente Amarillo Media', precio: 40000, categoria: 'Alcohol' },
  { nombre: 'Smirnoff Tamarindo', precio: 80000, categoria: 'Alcohol' },
  { nombre: 'Smirnoff Lulo', precio: 80000, categoria: 'Alcohol' },
  { nombre: 'Smirnoff Lulo Media', precio: 45000, categoria: 'Alcohol' },
  { nombre: 'Ron Tradicional', precio: 85000, categoria: 'Alcohol' },
  { nombre: 'Ron Tradicional Media', precio: 45000, categoria: 'Alcohol' },
  { nombre: 'Ron Esencial', precio: 70000, categoria: 'Alcohol' },
  { nombre: 'Ron Esencial Media', precio: 40000, categoria: 'Alcohol' },

  // Cervezas
  { nombre: 'Poker', precio: 5000, categoria: 'Cervezas' },
  { nombre: 'Corona', precio: 8000, categoria: 'Cervezas' },
  { nombre: 'Coronita', precio: 5000, categoria: 'Cervezas' },
  { nombre: 'Águila Light', precio: 5000, categoria: 'Cervezas' },
  { nombre: 'Águila Original', precio: 5000, categoria: 'Cervezas' },
  { nombre: 'Club Colombia Dorada', precio: 5000, categoria: 'Cervezas' },
  { nombre: 'Costeñita', precio: 4000, categoria: 'Cervezas' },
  { nombre: 'Heineken', precio: 5000, categoria: 'Cervezas' },
  { nombre: 'Budweiser', precio: 5000, categoria: 'Cervezas' },
  { nombre: 'Tecate', precio: 4000, categoria: 'Cervezas' },

  // Aperitivos
  { nombre: 'Cuates', precio: 6000, categoria: 'Aperitivos', sabores: ['Rojo', 'Amarillo', 'Verde'] },
  { nombre: 'Smirnoff', precio: 12000, categoria: 'Aperitivos', sabores: ['Manzana Verde', 'Original'] },
  { nombre: "Redd's", precio: 5000, categoria: 'Aperitivos', sabores: ['Rose', 'Verde'] },
  { nombre: 'Like', precio: 5000, categoria: 'Aperitivos', sabores: ['Blueberry', 'Citrus', 'Mango', 'Fresh Apple'] },

  // Mecato
  { nombre: 'Bombones', precio: 1000, categoria: 'Mecato' },
  { nombre: 'Maní Moto', precio: 2500, categoria: 'Mecato' },
  { nombre: 'Traidet', precio: 3000, categoria: 'Mecato' },
  { nombre: 'Chao', precio: 2500, categoria: 'Mecato' },
  { nombre: 'De Toditos', precio: 5000, categoria: 'Mecato', sabores: ['Mix', 'BBQ', 'Limón', 'Natural', 'Pollo'] },
  { nombre: 'Margarita', precio: 5000, categoria: 'Mecato', sabores: ['Limón', 'Natural', 'Pollo'] },
  { nombre: 'Onduladas', precio: 5000, categoria: 'Mecato', sabores: ['Mayonesa', 'Tomate'] },
  { nombre: 'Cheetos', precio: 5000, categoria: 'Mecato' },
  { nombre: 'Natuchips', precio: 5000, categoria: 'Mecato' },
  { nombre: 'Doritos', precio: 5000, categoria: 'Mecato' },
  { nombre: 'Chochitos Medianos', precio: 10000, categoria: 'Mecato' },
  { nombre: 'Chochitos Grandes', precio: 5000, categoria: 'Mecato' },
  { nombre: 'Chochitos Pequeños', precio: 3000, categoria: 'Mecato' },

  // Bebidas
  { nombre: 'Electrolit', precio: 12000, categoria: 'Bebidas', sabores: ['Uva', 'Fresa Kiwi', 'Jamaica', 'Maracuyá'] },
  { nombre: 'Gatorade', precio: 8000, categoria: 'Bebidas', sabores: ['Rojo', 'Azul', 'Naranja'] },
  { nombre: 'Soda Grande', precio: 7000, categoria: 'Bebidas' },
  { nombre: 'Soda Pequeña', precio: 5000, categoria: 'Bebidas' },
  { nombre: 'Agua', precio: 3000, categoria: 'Bebidas' },
  { nombre: "Bomba Patrick's", precio: 18000, categoria: 'Bebidas', descripcion: 'Electrolit + Bon Fiest' },
  { nombre: 'Bomba JK', precio: 13000, categoria: 'Bebidas', descripcion: 'Soda + Bon Fiest + Limón' },
  { nombre: 'Vive 100', precio: 5000, categoria: 'Bebidas', sabores: ['Original', 'Sandía'] },
];

// Categorías derivadas del catálogo (en el orden en que aparecen), igual
// que en productos.js — para no mantener una lista aparte que se pueda
// desincronizar.
const categoriasEstanco = [];
productosEstanco.forEach(function (producto) {
  if (categoriasEstanco.indexOf(producto.categoria) === -1) {
    categoriasEstanco.push(producto.categoria);
  }
});
