// ESLint global variables
/* global clearHtmlForXml getElementsByClassName getElementsByTagName trimString */

/**
 * https://sites.google.com/site/scriptsexamples/learn-by-example/parsing-html
 * https://developers.google.com/apps-script/guides/html/
 *
 */

const legifranceRoot = "https://www.legifrance.gouv.fr";

/**
 * 1) Effectuer la recherche souhaitée sur https://www.legifrance.gouv.fr/rechTexte.do?page=i
 * 2) Copier-coller le code source de chaque page de résultat sur searchPage.html, l'un à la suite de l'autre
 *
 * La fonction récupère l'hyperlien de la "version originale" de chaque article trouvé en résultat de la recherche
 *
 */
function fetchUrls() {

  // On récupère le document HTML pour le convertir en fichier XML sur lequel utiliser XmlService
  let html = HtmlService.createHtmlOutputFromFile('searchPage').getContent();
  html = clearHtmlForXml(html);
  const doc = XmlService.parse(html);
  html = doc.getRootElement();

  // On récupère l'élement de chaque résultat
  const elements = getElementsByClassName(html, "resultat1").concat(getElementsByClassName(html, "resultat2")); // Alternance entre 1 et 2 sur la page
  const links = [];

  // On récupère et formate le lien pour chaque élément
  for (let i = 0, l = elements.length; i < l; i++) {
    const linkEl = getElementsByTagName(elements[i], "a")[0];
    const link = legifranceRoot + linkEl.getAttribute("href").getValue().slice(2);
    links.push(link);
  }

  return links;
}

function getDesiredContent(page) {

  let pageContentAsString = page.getContentText();
  pageContentAsString = clearHtmlForXml(pageContentAsString);
  const doc = XmlService.parse(pageContentAsString);
  const html = doc.getRootElement();

  let title = getElementsByClassName(html, "titreMenu")[0];
  title = title ? title.getValue() : "";

  let fullTitle = getElementsByClassName(html, "enteteTexte")[0];
  fullTitle = fullTitle ? fullTitle.getValue() : "";

  let articleContent = getElementsByClassName(html, "article")[0];
  articleContent = articleContent ? articleContent.getValue() : pageContentAsString.match(/<!-- end notice -->\s*<div>([^]*)<\/div>\s*<!-- end visas -->/)[1];

  const content = [title, fullTitle, articleContent].map(v => trimString(v)); // Has been change with map(), didn't check
  return content;
}

function fetchData() {

  const links = fetchUrls();
  const pages = UrlFetchApp.fetchAll(links);
  const data = [];

  for (let i = 0, l = pages.length; i < l; i++) {
    // Logger.log(links[i]); // Pour débuguer les pages qui posent problème
    data[i] = [];
    data[i].push(links[i]);
    data[i] = data[i].concat(getDesiredContent(pages[i]));
  }

  return data;
}

function fillSheet() {

  const sheet = SpreadsheetApp.getActive().getSheetByName("data"); // .getActiveSheet();

  /* / On récupère le nom des en-tête (Non nécessaire)
  var headersNames = sheet.getRange(1, 1, 1, sheetLastColumn).getValues();
  var linkColIndex = headersNames[0].indexOf("Lien");
  var titleColIndex = headersNames[0].indexOf("Titre");
  var fullTitleColIndex = headersNames[0].indexOf("Titre complet");
  var articleContentColIndex = headersNames[0].indexOf("Contenu de l'article");
  if (! (linkColIndex+1 && titleColIndex+1 && fullTitleColIndex+1 && articleContentColIndex+1) ) return 0; //+1 car index non trouvé == -1 //*/

  const data = fetchData(); // toColumnVector(fetchUrls()); //fetchData();
  const rng = sheet.getRange(4, 1, data.length, data[0].length);
  rng.setValues(data);
}

