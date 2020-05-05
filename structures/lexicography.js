// ESLint global variables
/* global sum standardDeviation mean standardRatio */

/**
 * RÉFLEXION EN AMONT
 *
 * rq: sum(txFq[]) / n = average(txFq[]);
 *
 * nb : nombre d'occurrences
 * fq : fréquence
 * std : écart-type de la répartition
 * spe : spécificité du mot (dans le texte, relatif à un texte, woSpe[tx])
 * dis : caractère discriminant du mot (relatif à un mot, woDis)
 *
 * wo : un mot (word), par mot
 * alWo : tous les mots (all) (pluriel de wo) (rajouter al- signifie que c'est un tableau des éléments qui suivent)
 * tx : par texte
 * gl : global (tous les textes pris d'un seul coup ensemble)
 *
 * txNb : nombre de texte
 * txSz[tx] : nombre de mots dans le texte
 * woTxNb[tx] : nombre d'occurrences du mot dans chaque texte, par texte
 * woTxFq[tx] : fréquence du mot dans chaque texte (= woTxNb / txSz) (ie. on pondère le nombre d'occurrences par le volume du texte)
 * alWoTxFq[woTxFq[tx]] : fréquences de chaque mot dans chaque texte
 *
 * woDis = woTxFqStd = std(woTxFq[]) : écart-type de la répartition des fréquences du mot entre les textes
 * (ie. y a-t-il des textes où ce mot est très présent alors que dans d'autres il ne l'est pas du tout ?
 * ou au contraire est-il régulièrement présent à la même fréquence ?
 * ce mot est-il très discriminant entre les textes ?
 * caractère discriminant proportionnel à l'écart-type)
 *
 * alWoTxFqStd[woTxFqStd] : tableau des stdWoTxFq pour chaque mot, écart-types de chaque groupe de fréquences de chaque mot dans chaque texte
 * rq: On doit comparer les valeurs de stdWoTxFq, pour avoir la valeur relative du caractère discriminant entre les textes du mot
 *
 * woGlFq : fréquence du mot dans l'ensemble des textes (= n_wo / n)
 * alWoGlFq[woGlFq] : fréquences de chaque mot dans l'ensemble des textes
 * woGlFqStd : (inutile)
 *
 * woSpe[tx] = woTxFq[tx] - (woTxFq[g\tx])^2 : spécificité du mot dans le texte donné.
 * rq: On met au ^2 la seconde partie pour éviter qu'un mot peu fréquent dans le texte et absent ailleurs ai le même woSpe qu'un mot très fréquent dans le texte et un peu moins fréquent ailleurs
 * woSpe[tx] = woTxFq[tx] - ( (sum(woTxNb[alTx]) - woTxNb[tx]) / (sum(txSz[alTx]) - txSz[tx]) )^2
 *
 */

const negativeWordRegex = /([^\s,.?!/;:«»<>""()])+/g; // Useless. Definition of a word by negative char set. rq: Prend les " - "
const wordRegex = /([A-ZÀ-ÖØ-ÞŒa-zà-öß-öø-ÿœ0-9-]+'?)/g;
// rq: "'s" for genetive english is problematic (word are divided with apostrophe linked to first coming word of the pair)

const toIgnore = ["la", "le", "les", "un", "des", "de", "du", "ce", "cette",
  "l'", "d'", "c'", "s'", "j'", "t'", "qu'", "n'",
  "à", "au", "aux", "dans", "par", "pour", "en", "vers", "avec", "sans", "sous", "sur", "chez", "contre",
  "et", "ou", "entre",
  "est", "a", "sont", "se",
  "il", "elle",
  "qui", "que", "quel", "quelle",
  "qu'elle", "qu'il", "qu'en",
  "al", "el", "the"];

class Corpus {
  /**
   * @param {string[]} textsArray
   */
  constructor(textsArray) {
    /**
     * Texts of the corpus.
     * @type {Text[]}
     */
    this.texts = [];
    for (const string of textsArray) {
      const text = new Text(this, string);
      this.texts.push(text);
    }

    /**
     * Every words of the corpus, unfiltered, in order of appearance.
     * @type {TextWord[]}
     */
    this.everyWords = [];
    for (const text of this.texts) {
      this.everyWords.push(...text.words);
    }

    /**
     * Number of (non-unique) words in the whole corpus.
     * @type {number}
     */
    this.size = this.everyWords.length;

    /**
     * Dictionary of the corpus (could also be called: lexicon, glossary, vocabulary).
     * Map of unique corpus words. Keyed by word value.
     * @type {Map<string:CorpusEntry>}
     */
    this.dictionary = new Map();
    for (const word of this.everyWords) {
      const wordStr = word.value.toLowerCase();
      // Keep only unique values.
      if (!this.dictionary.has(wordStr)) {
        this.dictionary.set(wordStr, new CorpusEntry(this, wordStr));
      }
      const corpusEntry = this.dictionary.get(wordStr);

      if (!word.textEntry.corpusEntry) {
        const textEntry = word.textEntry;
        // Update textEntry to reference the corpusEntry
        textEntry.corpusEntry = corpusEntry;
        // Store this text entry.
        corpusEntry.entries.push(textEntry);
      }

      // Document the word instance object with its dictionary entry counterpart.
      word.corpusEntry = corpusEntry;

      // Store this instance of the entry.
      corpusEntry.instances.push(word);
    }

    // Once everyting is set, we can make some calculation on the whole corpus.
    this.removeIgnoredWords();
    this.calculateStats();
  }

  removeIgnoredWords() {
    // Remove from corpus dictionary
    for (const word of this.dictionary) {
      if (toIgnore.includes(word.value)) {
        this.dictionary.delete(word.value);
      }
    }
    // Remove from each text by appending to next word and removing from array.
    // rq: Indexes (specificity) are not recalculated so we can append freelee
    for (const text of this.texts) {
      const words = text.words;
      let i = 0;
      do {
        const word = words[i];
        if (toIgnore.includes(word.value.toLowerCase())) {
          words[i + 1].start = word.start;
          // words[i + 1].value = word.value + " " + words[i + 1].value; // Presume they are linked by a space. No need, cauz word.end is fixed
          words.splice(i, 1);
          i--;
        }
        i++;
      } while (i < words.length - 1); // Ignore last word
    }
  }

  /**
   * Calculate statistics relative to the corpus, its texts and their entries.
   * rq: Getters re-calculate each time they are called. Fix their result once and for all result in significant performance gain.
   * rq: Size has already been calculated.
   */
  calculateStats() {

    this.dictionary.forEach(entry => entry.calculateStats());
    // rq: We calculate text stats here, not in text constructor, because some text-related stats take into account corpus-scope values. So we need to have defined these before.
    this.texts.forEach(text => text.calculateStats());

    this.frequencyMean = this.getFrequencyMean;
    this.dictionary.forEach(entry => entry.calculateStatsAdvanced());

    this.distinctivenessMax = this.getDistinctivenessMax;
    this.distinctivenessMin = this.getDistinctivenessMin;
    this.distinctivenessRange = this.getDistinctivenessRange;

    // These are useless.
    this.specificityMax = this.getSpecificityMax;
    this.specificityMin = this.getSpecificityMin;
    this.specificityRange = this.getSpecificityRange;
  }

  /**
   * Mean of text entries frequencies. (NOT mean of corpus entries frequencies.)
   * @type {number}
   */
  get getFrequencyMean() {
    const frequencies = [];
    const dictionaries = this.texts.map(text => text.dictionary);
    for (const dictionary of dictionaries) {
      frequencies.push(...Array.from(dictionary, ([k, textEntry]) => textEntry.frequency));
    }
    dictionaries.map(textEntry => textEntry.frequency);
    return mean(frequencies);
  }

  get getDistinctivenessMax() {
    const array = Array.from(this.dictionary, ([k, v]) => v.distinctiveness);
    return Math.max(...array);
  }

  get getDistinctivenessMin() {
    // See https://hackernoon.com/how-to-map-a-map-12c6ef1c5b2e
    // rq: Frequent that distinctivenessMin is NaN.
    // Because of a distinctiveness equals to NaN. When it happens, Math.min() returns NaN
    const array = Array.from(this.dictionary, ([k, v]) => v.distinctiveness);
    return Math.min(...array);
  }

  get getDistinctivenessRange() {
    return this.distinctivenessMax - this.distinctivenessMin;
  }

  // rq: Specificity is bound to a text. So no need to have its range for the corpus.
  get getSpecificityMax() {
    const specificities = this.texts.map(text => text.specificityMax);
    return Math.max(...specificities);
  }

  get getSpecificityMin() {
    const specificities = this.texts.map(text => text.specificityMin);
    return Math.min(...specificities);
  }

  get getSpecificityRange() {
    return this.specificityMax - this.specificityMin;
  }
}

class Text {
  /**
   * @param {Corpus} corpus
   * @param {string} string
   */
  constructor(corpus, string) {
    /**
     * Parent corpus.
     * @type {Corpus}
     */
    this.corpus = corpus;

    /**
     * @type {string}
     */
    this.value = string;

    // Initialize Text Words
    /**
     * @type {TextWord[]}
     */
    this.words = [];
    const matches = this.value.matchAll(wordRegex);
    for (const match of matches) {
      const word = new TextWord(this, match[0]);
      word.start = match.index;
      word.end = word.start + word.value.length;
      this.words.push(word);
    }

    /**
     * Dictionary of the text (could also be called: lexicon, glossary, vocabulary).
     * Map of unique text words. Keyed by word value.
     * @type {Map<string:TextEntry>}
     */
    this.dictionary = new Map();
    for (const word of this.words) {
      const wordStr = word.value.toLowerCase();
      // Keep only unique values.
      if (!this.dictionary.has(wordStr)) {
        this.dictionary.set(wordStr, new TextEntry(this, wordStr));
      }
      const textEntry = this.dictionary.get(wordStr);

      // Document the word instance object with its dictionary entry counterpart.
      word.textEntry = textEntry;

      // Store this instance of the entry.
      textEntry.instances.push(word);
    }
  }

  /**
   * Calculates statistics relative to this text and its entries.
   */
  calculateStats() {
    this.size = this.getSize;
    this.dictionary.forEach(entry => entry.calculateStats());
    this.specificityMax = this.getSpecificityMax;
    this.specificityMin = this.getSpecificityMin;
    this.specificityRange = this.getSpecificityRange;
  }

  /**
   * Size of this text, i.e. number of words in this text.
   * @type {number}
   */
  get getSize() {
    return this.words.length;
  }

  get getSpecificityMax() {
    const specificities = Array.from(this.dictionary, ([k, entry]) => entry.specificity);
    return Math.max(...specificities);
  }

  get getSpecificityMin() {
    const specificities = Array.from(this.dictionary, ([k, entry]) => entry.specificity);
    return Math.min(...specificities);
  }

  get getSpecificityRange() {
    return this.specificityMax - this.specificityMin;
  }
}

/**
 * Word instance in the text.
 */
class TextWord {
  /**
   * @param {Text} text
   * @param {string} value
   */
  constructor(text, value) {
    /**
     * Parent text.
     * @type {Text}
     */
    this.text = text;

    /**
     * Parent corpus.
     * @type {Corpus}
     */
    this.corpus = text.corpus;

    /**
     * @type {string}
     */
    this.value = value;

    /**
     * Start index of this word in the text.
     * (Defined on creation from text.)
     * @type {number}
     */
    this.start;

    /**
     * End index of this word in the text.
     * (Defined on creation from text.)
     * @type {number}
     */
    this.end;

    /**
     * Parent text entry, reference in text dictionary.
     * (Defined when processing the text dictionary.)
     * @type {TextEntry}
     */
    this.textEntry;

    /**
     * Parent corpus entry, reference in corpus dictionary.
     * (Defined when processing the corpus dictionary.)
     * @type {CorpusEntry}
     */
    this.corpusEntry;
  }
}

/**
 * An entry in a corpus dictionary or text dictionary.
 */
class Entry {
  /**
   * @param {Text|Corpus} parent
   * @param {string} value
   */
  constructor(parent, value) {
    /**
     * Parent map of words, text or corpus.
     * @type {Text|Corpus}
     */
    this.parent = parent;

    /**
     * Value of the word. Is the key in the dictionary.
     * @type {string}
     */
    this.value = value;

    /**
     * Every instance of this word in this corpus/text.
     * (Defined when making up dictionary.)
     * @type {TextWord[]}
     */
    this.instances = [];
  }

  /**
   * Calculate statistics relative to this entry (occurrence, frequency)
   * Beware that required properties have been already calculated on call.
   */
  calculateStats() {
    this.occurrence = this.getOccurrence;
    this.frequency = this.getFrequency;
  }

  /**
   * Number of occurrences of this word in this corpus/text.
   * @type {number}
   * @readonly
   */
  get getOccurrence() {
    return this.instances.length;
  }

  /**
   * Frequency of this word in this corpus/text.
   * @type {number}
   * @readonly
   */
  get getFrequency() {
    return (this.occurrence / this.parent.size);
  }
}

/**
 * An entry in the text dictionary.
 */
class TextEntry extends Entry {
  /**
   * @param {Text} text
   * @param {string} value
   */
  constructor(text, value) {
    super(text, value);

    /**
     * Corpus entry counterpart, reference in corpus dictionary.
     * (Defined when processing the corpus dictionary.)
     * @type {CorpusEntry}
     */
    this.corpusEntry;
  }

  /**
   * Calculate statistics relative to this entry (occurrence, frequency, specificity)
   */
  calculateStats() {
    super.calculateStats();
    this.specificity = this.getSpecificity;
  }

  /**
   * Specificity of the word for the text.
   * Ratio between frequency in this text, and mean frequency for this word in the whole corpus.
   * rq: Couldn't we use only the global frequency? The more frequent the word, the less revalating he is.
   *
   * Spécificité du mot dans le texte donné. Confère au texte un caractère singulier.
   * Ratio entre la fréquence du mot dans ce texte, et la fréquence du mot dans l'ensemble du corpus.
   * @type {number}
   */
  get getSpecificity() {
    return (this.frequency / this.corpusEntry.frequency); // D_f = ]0 ; +infinity[ (D_f(freq) = ]0 ; 1])
  }
}

/**
 * An entry in the corpus dictionary.
 */
class CorpusEntry extends Entry {
  /**
   * @param {Corpus} corpus
   * @param {string} value
   */
  constructor(corpus, value) {
    super(corpus, value);

    /**
     * Array of text entries for this corpus entry.
     * (Defined when processing the corpus dictionary.)
     * @useless
     */
    this.entries = [];
  }

  /**
   * Basic stats (occurrences, frequency).
   */
  calculateStats() {
    super.calculateStats();
  }

  /**
   * Advanced stats (distinctiveness)
   */
  calculateStatsAdvanced() {
    this.distinctiveness = this.getDistinctiveness;
  }

  /**
   * Distinctiveness, discrimination index of the word. Discriminance.
   * Standard ratio of its frequencies among every text.
   *
   * Caractère distinctif, discriminant du mot. Discriminance.
   * Ratio-type de la répartition des fréquences du mot entre les textes.
   * (ie. y a-t-il des textes où ce mot est très présent alors que dans d'autres il ne l'est pas du tout ?
   * ou au contraire est-il régulièrement présent à la même fréquence ?
   * ce mot est-il très discriminant entre les textes ?
   * le caractère discriminant est proportionnel au ratio-type)
   * rq: On pourrait aussi simplement utiliser la fréquence comme indice de distinctivité
   *
   * @type {number}
   */
  get getDistinctiveness() {
    const frequencies = this.entries.map(textEntry => textEntry.frequency);
    return (1 / standardRatio(frequencies));
  }
}