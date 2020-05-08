// ESLint global variables
/* global Corpus renderRichtext normalizeString matrice_forEach matrice_toArray array_toMatrice genColorMatrice splitByMotivesString */

/**
 * The event handler triggered when opening the spreadsheet.
 * @param {Event} event The onOpen event.
 */
function onOpen(event) {

  // Add a custom menu to the spreadsheet.
  SpreadsheetApp.getUi()
    .createMenu("Fonctions personnalisées")

    // Test
    .addItem("Test", 'test')

    /**
     * Accentuer les différences des textes sélectionnés (un texte par cellule)
     * en colorisant les mots selon leur caractère distinctif, en général et dans le texte en particulier.
     */
    .addItem("Accentuer les différences", 'colorizeText')

    .addItem("Uniformiser le texte", 'normalizeText')

    .addItem("Retour à la ligne à chaque exposé de motif", 'splitByMotives')

    .addToUi();
}

function test() {
  // const sheet = SpreadsheetApp.getActiveSheet();
  // const rng = sheet.getActiveRange();
}

function normalizeText() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const range = sheet.getActiveRange();
  const values = range.getValues();

  const res = matrice_forEach(values, normalizeString);

  range.setValues(res);
}

function splitByMotives() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const range = sheet.getActiveRange();
  const values = range.getValues();

  const res = matrice_forEach(values, splitByMotivesString);

  range.setValues(res);
}

function colorizeText() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const range = sheet.getActiveRange();
  const values = range.getValues();

  const a = matrice_toArray(values);
  const textsArray = a.array;
  const indexes = a.indexes;

  const topLeft = [0, 0, 190]; // Dark Blue
  const botLeft = [200, 210, 245]; // Ligth Blue // rq: alternative: [195, 225, 240]
  const topRight = [200, 0, 0]; // Dark Red
  const botRight = [245, 210, 200]; // Ligth Red
  const granularity = 101;
  const colorMatrice = genColorMatrice(granularity, granularity, topLeft, topRight, botLeft, botRight);

  const richTextValues = [];
  const corpus = new Corpus(textsArray);
  for (const text of corpus.texts) {
    richTextValues.push(renderRichtext(text, colorMatrice));
  }

  const res = array_toMatrice(richTextValues, indexes);
  range.setRichTextValues(res);
}