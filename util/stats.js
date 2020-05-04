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
  return sum(array) / array.length;
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
function std(array) {
  let v = variance(array);
  if (v < 0) v = 0; // Convert to 0 to avoid problems regarding machine imprecision
  if (v < 0) throw new Error(`Standard deviation calculus: Variance cannot be negative (is ${v}).`);
  return Math.sqrt(v);
}