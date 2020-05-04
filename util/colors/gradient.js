// ESLint global variables
/* global clone subtractMatrice divideMatrice addMatrice matrice_forEach rgbToHex */

/**
 * @param {2* integer[2]} 2 integers to set the size [colN x rowN] = [width x height]
 * @param {4* integer[3]} 4 rgbArrays of 3 integers each
 * @returns {[][]} Matrice of colors in hex string
 * rq: Les tableaux de triplets RGB sont traités par les fonctions matricielles, pour autant ce sont des tableaux à une ligne (d'où on récupère le premier index)
 */
function genColorMatrice(colN, rowN, topLeft, topRight, botLeft, botRight) {

  // Initialisation de la matrice de retour
  let matrice = [];
  for (let i = 0, l = rowN; i < l; i++) {
    matrice[i] = [];
    for (let j = 0, m = colN; j < m; j++) {
      matrice[i][j] = null;
    }
  }

  // 1) Remplissage des quatre coins initiaux
  matrice[0][0] = clone(topLeft); // rq: Fn clone() changed, didn't check
  matrice[0][colN - 1] = clone(topRight);
  matrice[rowN - 1][0] = clone(botLeft);
  matrice[rowN - 1][colN - 1] = clone(botRight);


  // 2) Remplissage des colonnes de gauche et de droite reliant les deux couples de coins latéraux
  const deltaVerticalLeft = subtractMatrice(botLeft, topLeft)[0]; // Nécessaire de clone au préalable avec la fonction subtract, sans quoi il multiplie par -1 la valeur source (pourquoi ?)
  const deltaVerticalRight = subtractMatrice(botRight, topRight)[0];

  const incrementVerticalLeft = divideMatrice(deltaVerticalLeft, rowN)[0];
  const incrementVerticalRight = divideMatrice(deltaVerticalRight, rowN)[0];

  for (let i = 1, l = rowN - 1; i < l; i++) {
    matrice[i][0] = addMatrice(matrice[i - 1][0], incrementVerticalLeft)[0];
    matrice[i][colN - 1] = addMatrice(matrice[i - 1][colN - 1], incrementVerticalRight)[0];
  }


  // 3) Remplissage du centre, ligne par ligne, reliant les deux colonnes extrêmes
  for (let i = 0, l = rowN; i < l; i++) {

    const lastCol = clone(matrice[i][colN - 1]);
    const firstCol = clone(matrice[i][0]);

    const deltaHorizontal = subtractMatrice(lastCol, firstCol)[0]; // Nécessaire de clone au préalable avec la fonction subtract, sans quoi il multiplie par -1 la valeur source (pourquoi ?)
    const incrementHorizontal = divideMatrice(deltaHorizontal, colN)[0];

    for (let j = 1, m = colN - 1; j < m; j++) {
      matrice[i][j] = addMatrice(matrice[i][j - 1], incrementHorizontal)[0];
    }
  }

  matrice = matrice_forEach(matrice, rgbToHex);
  return matrice;
}