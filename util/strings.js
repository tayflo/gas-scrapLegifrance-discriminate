// ESLint global variables
/* global */

/**
 * @deprecated
 * stringFunction
 * @param {function} function La fonction d'origine à gérer
 * @param {string|string[]} input L'entrée à traiter par la fonction
 * @return {string|string[]}
 *
 * Permet de
 * 1) convertir les entrées en chaîne de caractères, si elle ne le sont pas
 * 2) process sur chaque élément et renvoyer un tableau, si l'entrée est un tableau
 *
 * Utiliser comme suit :
 * déclarer fn_(input) {...} // Process à appliquer sur chaque élément
 * puis fn(input) { return stringFunction(input, fn_); }
 *
 */
function stringFunction(input, fn) {
  const inputIsArray = Array.isArray(input);
  const output = [];
  if (!inputIsArray) { input = [input]; }
  for (let i = 0, l = input.length; i < l; i++) {
    if (typeof input[i] != 'string') { input[i] += "" ; } // Conversion
    output.push(fn(input[i]));
  }
  return inputIsArray ? output : output[0];
}

/**
 * @deprecated
 * Supprime les espaces et les retours à la ligne
 */
function trimString(string) {
  return stringFunction(string, trimString_);
}
function trimString_(string) {
  if (string.constructor !== String) {
    throw("typeError", "The object is not a string");
  }
  string = string.replace(/\s+/g, " ").trim();
  return string;
}