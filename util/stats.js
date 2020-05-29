/**
 * Sum elements of array.
 * D_f = ]- infinity ; + infinity[
 * @param {number[]}
 * @returns {number}
 */
function sum(array) {
  let s = 0;
  for (let i = 0, n = array.length; i < n; i++) {
    s += array[i];
  }
  return s;
}

/**
 * Mean of array.
 * @param {number[]} array
 * @returns {number}
 */
function mean(array) {
  return (sum(array) / array.length);
}

/**
 * Variance of array.
 * @param {number[]} array
 * @returns {number}
 */
function variance(array) {
  const n = array.length; // Count [0 ; + infinity[
  const s = sum(array); // Sum ]- infinity ; + infinity[
  const m = s / n; // Mean ]- infinity ; + infinity[
  let squareSum = 0;
  for (let i = 0; i < n; i++) {
    squareSum += Math.pow(array[i], 2); // [0 ; + infinity[
  }
  return (1 / n) * squareSum - Math.pow(m, 2);
}

/**
 * Standard deviation of array.
 * @param {number[]} array
 * @returns {number}
 */
function standardDeviation(array) {
  let v = variance(array);
  if (v < 0) v = 0; // Convert to 0 to avoid problems regarding machine imprecision
  if (v < 0) throw new Error(`Standard deviation calculus: Variance cannot be negative (is ${v}).`);
  return Math.sqrt(v);
}

/**
 * Standard ratio of array.
 * Mean of ratios between value and mean value.
 * rq: We don't ^2 and sqrt() to emphazise differences, nor count in same direction ratio >1 and <1 (as would do an absolute value in difference calculus)
 *
 * On utilise ici le ratio,
 * et non la différence comme c'est le cas pour le calcul d'un écart-type,
 * pour neutraliser l'effet de fréquence des termes :
 * en effet, certains termes sont beaucoup plus fréquents que d'autre,
 * ce qui donne lieu à des écart-types très différents.
 * En un sens, ce ratio constitue un écart-type normalisé.
 *
 * @param {number[]} array
 * @returns {number}
 */
function standardRatio(array) {
  const _mean = mean(array);
  const ratios = array.map(v => v / _mean);
  return mean(ratios);
}