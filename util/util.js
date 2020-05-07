// ESLint global variables
/* global */

/**
 * Clone an object (any JavaScript object, including arrays...).
 * @param {*} obj JavaScript object to clone
 * @returns Cloned object.
 * @see Also https://github.com/angus-c/just/blob/db33a21672e9051d6689fff9b1fbcf939c44ae2c/packages/collection-clone/index.js
 */
function clone(obj) {
  if (obj == null || typeof obj != "object") {
    return obj;
  }
  const copy = obj.constructor();
  for (const attr in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, attr)) {
      copy[attr] = obj[attr];
    }
  }
  return copy;
}

/**
 * Deep clone an array using .map() (to avoid referencing).
 * @param {array} array Array to clone.
 * @returns {array} Cloned array.
 * @ref https://dev.to/samanthaming/how-to-deep-clone-an-array-in-javascript-3cig
 */
function _clone(array) {
  return array.map(item => Array.isArray(item) ? clone(item) : item);
}

/*
 * Set every element of array in an array to match matrix syntax
 * @example from [1,2,3] to  [[1],[2],[3]]
 * @param array
 * @return array of arrays
 * @ref https://stackoverflow.com/questions/33665514/set-values-by-only-columns-in-google-apps-script
 */
function toColumnVector(array) {
  if (array.constructor !== Array) {
    throw("typeError", "The object is not an array");
  }
  const output = [];
  for (let i = 0; i < array.length; i++) {
    output.push([array[i]]);
    // if (typeof array[i] !== "number" && typeof array[i] !== "string"){
    // throw("typeError", "The element is not a number or string");
    // }
  }
  return output;
}

/**
 * Compute the edit distance between the two given strings
 * @param {string} a First string
 * @param {string} b Second string
 * @src https://gist.github.com/andrei-m/982927
 * @copyright Copyright (c) 2011 Andrei Mackenzie
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
function getEditDistance(a, b) {
  if (a.length == 0) return b.length;
  if (b.length == 0) return a.length;

  const matrix = [];

  // increment along the first column of each row
  let i;
  for (i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // increment each column in the first row
  let j;
  for (j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      }
      else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
          Math.min(matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1)); // deletion
      }
    }
  }

  return matrix[b.length][a.length];
}