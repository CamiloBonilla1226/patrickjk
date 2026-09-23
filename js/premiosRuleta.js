// Mismos premios y mismo diseño de la ruleta que el proyecto en React (ver
// src/data/premiosRuleta.js ahí) — se copian tal cual, sin inventar pesos
// nuevos. Resumen del diseño (la explicación completa está en ese archivo):
//
// - Hay DOS ruletas de 12 premios cada una (A y B). Cuál le toca al
//   cliente se sortea 50/50 cada vez que se abre la ruleta (ver
//   elegirRuletaAleatoria en ruleta.js) — así no siempre es la misma.
// - La probabilidad de cada premio depende de cuántas veces se repite en
//   su lista (las 12 casillas de una ruleta tienen el mismo tamaño), salvo
//   los dos premios marcados `raro: true` ($30.000 y 1 Six): además de
//   tener una sola casilla, ruleta.js les aplica un sorteo adicional que
//   reduce su probabilidad real a 1 de cada 5 veces que el azar cae ahí.
// - `codigo` es el código corto de 3 letras que se usa en el mensaje de
//   WhatsApp en vez del texto completo del premio (ver generarCodigoPremio
//   en ruleta.js) — así, aunque el cliente edite el mensaje antes de
//   enviarlo, no puede inventarse un premio sin adivinar un código válido.
//   `codigo: null` en "Perdiste" y "Sigue intentando" porque ninguno de
//   los dos es un premio real que deba codificarse. Los premios repetidos
//   (por ejemplo "Ganaste 1 Poker" aparece dos veces en la ruleta A) usan
//   el mismo código — son la misma casilla de premio, solo se repite.
export const PREMIOS_RULETA_A = [
  { id: 'a1', texto: 'Ganaste 1 Poker', codigo: '1PK' },
  { id: 'a2', texto: 'Perdiste', codigo: null },
  { id: 'a3', texto: 'Ganaste $10.000 redimible en punto físico', codigo: '10K' },
  { id: 'a4', texto: 'Sigue intentando', codigo: null },
  { id: 'a5', texto: 'Ganaste un bombón', codigo: 'BOM' },
  { id: 'a6', texto: 'Perdiste', codigo: null },
  { id: 'a7', texto: '10% en el total de la cuenta', codigo: '10C' },
  { id: 'a8', texto: 'Ganaste 1 Poker', codigo: '1PK' },
  { id: 'a9', texto: 'Ganaste $30.000', codigo: '30K', raro: true },
  { id: 'a10', texto: 'Ganaste un bombón', codigo: 'BOM' },
  { id: 'a11', texto: '10% en el total de la cuenta', codigo: '10C' },
  { id: 'a12', texto: 'Ganaste $10.000 redimible en punto físico', codigo: '10K' },
];

export const PREMIOS_RULETA_B = [
  { id: 'b1', texto: 'Ganaste un premio sorpresa', codigo: 'SOR' },
  { id: 'b2', texto: 'Perdiste', codigo: null },
  { id: 'b3', texto: '10% descuento en un producto seleccionado', codigo: '10P' },
  { id: 'b4', texto: 'Sigue intentando', codigo: null },
  { id: 'b5', texto: 'Ganaste un agua', codigo: 'AGU' },
  { id: 'b6', texto: 'Perdiste', codigo: null },
  { id: 'b7', texto: '5% en el total de la cuenta', codigo: '5TC' },
  { id: 'b8', texto: 'Ganaste un premio sorpresa', codigo: 'SOR' },
  { id: 'b9', texto: 'Ganaste 1 Six', codigo: '1SX', raro: true },
  { id: 'b10', texto: 'Ganaste un agua', codigo: 'AGU' },
  { id: 'b11', texto: '5% en el total de la cuenta', codigo: '5TC' },
  { id: 'b12', texto: '10% descuento en un producto seleccionado', codigo: '10P' },
];
