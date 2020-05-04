// ESLint global variables
/* global sum std */

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
 * woTxFq[tx] : fréquence du mot dans chaque texte (= woTxNb / txSz) (ie. on pondère le nombre d'occurences par le volume du texte)
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

const wordRegex = /([^\s,.?!/;:«»<>""()])+/g; // rq: Prend les " - "

const toIgnore = ["la", "le", "les", "un", "des", "de", "du", "en", "à", "aux", "et", "est", "a", "que", "par", "sont", "sur", "ce", "cette", "dans", "ou", "qu'elle", "qu'il", "qu'en", "sous", "al", "el", "the"];

class Corpus {
  /**
   * @param {string[]} textArray
   */
  constructor(textArray) {
    /**
     * @type {Text[]}
     */
    this.texts = [];
    for (const string of textArray) {
      const text = new Text(this, string);
      this.texts.push(text);
    }

    // Setting up the dictionary. Process every words.
    /**
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
    this.length = this.everyWords.length;

    /**
     * Dictionary (or lexicon, glossary, vocabulary). Map of unique corpus words. Keyed by word value.
     * @type {Map<string:CorpusWord>}
     */
    this.dictionary = new Map();
    for (const textWord of this.everyWords) {
      const wordStr = textWord.value.toLowerCase();
      // Keep only unique values.
      if (!this.dictionary.has(wordStr)) {
        this.dictionary.set(wordStr, new CorpusWord(this, wordStr));
      }
      const corpusWord = this.dictionary.get(wordStr);

      // Categorize this word to its corpus word reference.
      // rq: Okay? Pass by ref?
      textWord.corpusWord = corpusWord;

      // Store this instance of the corpus word.
      corpusWord.instances.push(textWord);
    }
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

  // rq: Getters re-calculate each time they are called.
  getMinMaxRange() {
    this.maxDistinctiveness = this.getMaxDistinctiveness;
    this.minDistinctiveness = this.getMinDistinctiveness;
    this.maxSpecificity = this.getMaxSpecificity;
    this.minSpecificity = this.getMinSpecificity;
    this.distinctivenessRange = this.getDistinctivenessRange;
    this.specificityRange = this.getSpecificityRange;
    for (const text of this.texts) {
      text.getMinMaxRange();
    }
  }

  get getMaxDistinctiveness() {
    const array = Array.from(this.dictionary, ([k, v]) => v.distinctiveness);
    return Math.max(...array);
  }

  get getMinDistinctiveness() {
    // See https://hackernoon.com/how-to-map-a-map-12c6ef1c5b2e
    // rq: Frequent that minDistinctiveness is NaN.
    // Because of a distinctiveness equals to NaN. When it happens, Math.min() returns NaN
    const array = Array.from(this.dictionary, ([k, v]) => v.distinctiveness);
    return Math.min(...array);
  }

  get getDistinctivenessRange() {
    return this.maxDistinctiveness - this.minDistinctiveness;
  }

  get getMaxSpecificity() {
    const array = this.everyWords.map(v => v.specificity);
    return Math.max(...array);
  }

  get getMinSpecificity() {
    const array = this.everyWords.map(v => v.specificity);
    return Math.min(...array);
  }

  get getSpecificityRange() {
    return this.maxSpecificity - this.minSpecificity;
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
  }

  /**
   * Length of this text, i.e. number of words in this text.
   * @type {number}
   */
  get length() {
    return this.words.length;
  }

  getMinMaxRange() {
    this.maxSpecificity = this.getMaxSpecificity;
    this.minSpecificity = this.getMinSpecificity;
    this.specificityRange = this.getSpecificityRange;
  }

  get getMaxSpecificity() {
    const array = this.words.map(v => v.specificity);
    return Math.max(...array);
  }

  get getMinSpecificity() {
    const array = this.words.map(v => v.specificity);
    return Math.min(...array);
  }

  get getSpecificityRange() {
    return this.maxSpecificity - this.minSpecificity;
  }
}

class Word {
  constructor() {
    /**
     * @type {string}
     */
    this.value;
  }

  /**
   * @type {number}
   * @readonly
   */
  get length() {
    return this.value.length;
  }
}

class TextWord extends Word {
  /**
   * @param {Text} text
   * @param {string} value
   */
  constructor(text, value) {
    super();

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
     * Parent corpus word, reference in dictionary.
     * (Defined when processing the dictionary.)
     * @type {CorpusWord}
     */
    this.corpusWord;
  }

  /**
   * @deprecated
   * End index of this word in the text.
   * @type {number}
   * @readonly
   */
  get _end() {
    return this.start + this.value.length;
  }

  /**
   * Number of occurences of this word in this text.
   * @type {number}
   * @readonly
   */
  get occurence() {
    return this.text.words.filter(word => word.value === this.value).length;
  }

  /**
   * Frequency of this word in this text.
   * @type {number}
   * @readonly
   */
  get frequency() {
    return (this.occurence / this.text.words.length);
  }

  /**
   * Specificity of the word for the text.
   * Distance between frequency in this text, and mean frequency in the whole corpus.
   * rq: Couldn't we use only the global frequency? The more frequent the word, the less revalating he is.
   *
   * D_f(freq) = [0 ; 1]
   * D_f(freq^-1) = ]+infinity ; 1]
   * D_f(1 - freq) = [1 ; 0]
   *
   * Spécificité du mot dans le texte donné. Confère au texte un caractère singulier.
   * Distance entre la fréquence du mot dans ce texte, et la fréquence du mot dans les autres textes.
   * @type {number}
   */
  get specificity() {
    // Frequency of this word in the corpus as a whole
    const freq = this.corpusWord.globalOccurence / this.corpus.length;
    // We pass it through x^-1 to emphasize small values, and then revert back
    return (this.frequency / freq); // D_f = ]0 ; +infinity[
    // return (Math.pow(freq, -1) - Math.pow(this.frequency, -1)); // D_f = ]-infinity ; +infinity[ rq: x^-1 requires x != 0 (should be ok)
  }

  /**
   * @deprecated
   */
  get _specificity() {
    // Occurence of this word in all texts but this one. (Inverse word weight in this text compared to the whole corpus. Lesser value means this text accounts for a significant part of words occurrences in whole corpus.)
    const occ = this.corpusWord.globalOccurence - this.occurence;
    // Length of the other texts. (Inverse text weight compared to the whole corpus. The higher the value, the lighter the text)
    const len = this.corpus.length - this.text.length;
    // Frequency of this word in the other texts (all text but this one)
    const freq = occ / len;
    // rq: On met au ^2 la seconde partie pour éviter qu'un mot peu fréquent dans le texte et absent ailleurs ai la même spécificité qu'un mot très fréquent dans le texte et un peu moins fréquent ailleurs
    // TODO: Normaliser la répartition pour effacer les valeurs extrêmes
    return (this.frequency - Math.pow(freq, 2));
  }
}

/**
 * An entry in the corpus dictionary.
 */
class CorpusWord extends Word {
  /**
   * @param {Corpus} corpus
   * @param {string} value
   */
  constructor(corpus, value) {
    super();

    /**
     * Parent corpus.
     * @type {Corpus}
     */
    this.corpus = corpus;

    /**
     * Value of the word. Is the key in the corpus dictionary.
     * @type {string}
     */
    this.value = value;

    /**
     * Every instance of this word in texts.
     * (Defined when making up corpus dictionary.)
     * @type {TextWord[]}
     */
    this.instances = [];
  }

  /**
   * Number of occurrence of this word in the whole corpus.
   * @type {number}
   * @readonly
   */
  get globalOccurence() {
    return this.instances.length;
    // rq: Should also be equal to sum of occurrences of the word in each text.
  }

  /**
   * @type {number}
   * @readonly
   */
  get globalFrequency() {
    return (this.globalOccurences / this.corpus.length);
  }

  /**
   * Distinctiveness, discrimination index of the word. Discriminance.
   * Standard deviation of its frequencies among every text, normalized by mean frequency.
   *
   * Caractère distinctif, discriminant du mot. Discriminance.
   * Écart-type de la répartition des fréquences du mot entre les textes.
   * (ie. y a-t-il des textes où ce mot est très présent alors que dans d'autres il ne l'est pas du tout ?
   * ou au contraire est-il régulièrement présent à la même fréquence ?
   * ce mot est-il très discriminant entre les textes ?
   * le caractère discriminant est proportionnel à l'écart-type)
   * rq: On pourrait aussi simplement utiliser la fréquence comme indice de distinctivité
   *
   * @type {number}
   */
  get distinctiveness() {
    const frequencies = this.instances.map(word => word.frequency);
    // TODO: Mean
    // kfdùsml kml
    return std(frequencies) ;
  }
}