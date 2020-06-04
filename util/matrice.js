// ESLint global variables
/* global clone */

/**
 * @param {number} height Number of rows
 * @param {number} width Number of columns
 * @param {any} filling The element with which we should fill this initial matrice
 */
function initMatrice(height, width, filling = undefined) {
  const res = [];
  for (let i = 0; i < height; i++) {
    res[i] = [];
    for (let j = 0; j < width; j++) {
      res[i][j] = filling;
    }
  }
  return res;
}

function fillUndefined(matrice) {
  for (let i = 0, l = matrice.length; i < l; i++) {
    for (let j = 0, m = matrice[i].length; j < m; j++) {
      if (matrice[i][j] == null) {
        matrice[i][j] = "";
      }
    }
  }
  return matrice;
}

function matrice_forEach(matrice, callback, ...args) {
  for (let i = 0, l = matrice.length; i < l; i++) {
    for (let j = 0, m = matrice[i].length; j < m; j++) {
      if (matrice[i][j] == null) continue;
      matrice[i][j] = callback(matrice[i][j], ...args);
    }
  }
  return matrice;
}

/**
 * Convert a matrice to an array. Useful to process.
 * @param {[][]} matrice
 * @returns {Object} res
 * @returns {array} res.array
 * @returns {Map.<number, number[]} res.indexes {arrayIndex: [matriceCol, matriceRow]} Object with coords in matrice paired with index in array.
 */
function matrice_toArray(matrice) {
  const array = [];
  const indexes = new Map();
  let k = 0;
  for (const [i, col] of matrice.entries()) {
    for (const [j, element] of col.entries()) {
      array.push(element);
      indexes.set(k, [i, j]);
      k++;
    }
  }
  const res = {
    array: array,
    indexes: indexes,
  };
  return res;
}

/**
 * Convert an array to a matrice, with given indexes.
 * @param {array} array
 * @param {Map.<number, number[]} indexes indexes {arrayIndex: [matriceCol, matriceRow]} Object with coords in matrice paired with index in array.
 * @returns {[][]} matrice
 */
function array_toMatrice(array, indexes) {

  const cols = Array.from(indexes, ([k, v]) => v[0]);
  const height = 1 + Math.max(...cols);

  const rows = Array.from(indexes, ([k, v]) => v[1]);
  const width = 1 + Math.max(...rows);

  const matrice = initMatrice(height, width);

  for (const [k, element] of array.entries()) {
    const index = indexes.get(k);
    const i = index[0];
    const j = index[1];
    matrice[i][j] = element;
  }

  return matrice;
}

/**
 * Algèbre
 */
function multiplyMatrice(scalar, matrice) {
  if (matrice[0].constructor != Array) matrice = [matrice]; // Si c'est un tableau simple en entrée, on l'interprète comme une matrice à une ligne
  for (let i = 0, h = matrice.length; i < h; i++) {
    for (let j = 0, w = matrice[0].length; j < w; j++) {
      matrice[i][j] *= scalar;
    }
  }
  return matrice;
}

function divideMatrice(matrice, scalar) {
  return multiplyMatrice((1 / scalar), matrice);
}

function addMatrice(m1, m2) {
  if (m1[0].constructor != Array) m1 = [m1]; // Si c'est un tableau simple en entrée, on l'interprète comme une matrice à une ligne
  if (m2[0].constructor != Array) m2 = [m2]; // Si c'est un tableau simple en entrée, on l'interprète comme une matrice à une ligne
  if (m1.length != m2.length) throw("Given matrices must have the same size (number of rows is different)");
  if (m1[0].length != m2[0].length) throw("Given matrices must have the same size (number of columns is different)");
  const result = [];
  for (let i = 0, h = m1.length; i < h; i++) {
    result[i] = [];
    for (let j = 0, w = m1[0].length; j < w; j++) {
      result[i][j] = m1[i][j] + m2[i][j];
    }
  }
  return result;
}

function subtractMatrice(m1, m2) {
  return addMatrice(m1, multiplyMatrice(-1, m2));
}


/* OKAOU // https://www.quora.com/What-is-the-code-to-develop-a-script-to-multiply-two-matrices-using-HTML-and-JavaScript
function multiplyMatrix(m1, m2) {
  var result = [];
    for(var j = 0; j < m2.length; j++) {
    result[j] = [];
    for(var k = 0; k < m1[0].length; k++) {
      var sum = 0;
      for(var i = 0; i < m1.length; i++) {
        sum += m1[i][k] * m2[j][i];
      }
      result[j].push(sum);
    }
  }
  return result;
}*/