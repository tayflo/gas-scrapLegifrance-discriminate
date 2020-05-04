/**
 * @param {string|integer} hexCode ex: "#ffffff" ou "ffffff" ou "000000" ou 000000
 * @returns {string} hexCode ex: "#ffffff"
 */
function formatHex(hexCode) {
  if (hexCode.constructor == Number) hexCode = hexCode.toString(10);
  if (hexCode.constructor !== String) throw("typeError", "The given hexCode is not a string nor a number");
  if (hexCode.slice(0, 1) != "#") hexCode = "#" + hexCode;
  if (hexCode.length != 7) throw("Invalid Hex Color Code (# apart, not 6 characters)");
  if (/[^0-9a-f]/.test(hexCode.slice(1))) throw("Invalid Hex Color Code (undesired characters)");
  return hexCode;
}

/**
 * @param { integer[] | string[] | string } rgbCode ex: [255,255,255] ou ["255","255","255"] ou "255,255,255"
 * @returns {integer[]} rgbCode ex: [255,255,255]
 */
function formatRgb(rgbCode) {
  if (rgbCode.constructor !== Array) {
    if (rgbCode.constructor !== String) throw("typeError", "The given rgbCode is not a string nor an array");
    rgbCode = rgbCode.trim().split(/[ ,;]+/);
  }
  if (rgbCode.length != 3) throw("Invalid Rgb Color Code (cannot find three elements)");
  for (let i = 0; i < 3; i++) {
    if (rgbCode[i].constructor == String) rgbCode[i] = parseInt(rgbCode[i], 10);
    if (Number.isNaN(rgbCode[i])) throw("Invalid Rgb Color Code (element is NaN)");
    if (rgbCode[i] < 0) {
      // console.warn("Element of Rgb Color Code inferior to 0");
      rgbCode[i] = 0;
    }
    if (rgbCode[i] > 255) {
      // console.warn("Element of Rgb Color Code superior to 255");
      rgbCode[i] = 255;
    }
    rgbCode[i] = Math.round(rgbCode[i]);
  }
  return rgbCode;
}

/**
 * @param {string|integer} hexCode ex: "#ffffff" ou "ffffff" ou "000000" ou 000000
 * @returns {integer[]} rgbCode ex: [255,255,255]
 * @note Maybe use Number() instead of parseInt() would be faster ?
 */
function hexToRgb(hexCode) {
  hexCode = formatHex(hexCode);
  const r = parseInt(hexCode.slice(1, 3), 16);
  const g = parseInt(hexCode.slice(3, 5), 16);
  const b = parseInt(hexCode.slice(5, 7), 16);
  const rgbCode = [r, g, b];
  return rgbCode;
}

/**
 * @param { integer[] | string[] | string } rgbCode ex: [255,255,255] ou ["255","255","255"] ou "255,255,255"
 * @returns {string} hexCode ex: "#ffffff"
 */
function rgbToHex(rgbCode) {
  rgbCode = formatRgb(rgbCode);
  let hexCode = [];
  for (let i = 0; i < 3; i++) {
    hexCode[i] = rgbCode[i].toString(16);
    if (hexCode[i].length == 1) hexCode[i] = "0" + hexCode[i];
  }
  hexCode = "#" + hexCode.join('');
  return hexCode;
}