// ESLint global variables
/* global Corpus renderRichtext matrice_toArray array_toMatrice genColorMatrice */

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

    .addToUi();
}

function test() {
  // const sheet = SpreadsheetApp.getActiveSheet();
  // const rng = sheet.getActiveRange();
}

function colorizeText() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const range = sheet.getActiveRange();

  const values = range.getValues();

  const a = matrice_toArray(values);
  const textArray = a.array;
  const indexes = a.indexes;

  const topLeft = [0, 0, 190]; // Dark Blue
  const botLeft = [200, 210, 245]; // Ligth Blue
  const topRight = [200, 0, 0]; // Dark Red
  const botRight = [245, 210, 200]; // Ligth Red
  const granularity = 101;
  const colorMatrice = genColorMatrice(granularity, granularity, topLeft, topRight, botLeft, botRight);

  const richTextValues = [];
  const corpus = new Corpus(textArray);
  corpus.removeIgnoredWords();
  corpus.getMinMaxRange();
  for (const text of corpus.texts) {
    richTextValues.push(renderRichtext(text, colorMatrice));
  }

  const res = array_toMatrice(richTextValues, indexes);
  range.setRichTextValues(res);
}