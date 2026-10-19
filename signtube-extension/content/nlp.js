/**
 * SignTube NLP Module
 * Text processing for sign language translation (runs entirely client-side)
 */

const SignTubeNLP = (() => {

  // Stop words commonly omitted in sign language
  const STOP_WORDS = new Set([
    'a', 'an', 'the', 'is', 'am', 'are', 'was', 'were', 'be', 'been',
    'being', 'do', 'does', 'did', 'doing', 'will', 'would', 'shall',
    'should', 'may', 'might', 'must', 'can', 'could',
    'has', 'have', 'had', 'having',
    'to', 'of', 'it', 'its'
  ]);

  // Contraction expansions
  const CONTRACTIONS = {
    "i'm": "i",
    "i'll": "i will",
    "i've": "i have",
    "i'd": "i would",
    "you're": "you",
    "you'll": "you will",
    "you've": "you have",
    "you'd": "you would",
    "he's": "he",
    "she's": "she",
    "it's": "it",
    "we're": "we",
    "we'll": "we will",
    "we've": "we have",
    "we'd": "we would",
    "they're": "they",
    "they'll": "they will",
    "they've": "they have",
    "they'd": "they would",
    "that's": "that",
    "who's": "who",
    "what's": "what",
    "where's": "where",
    "when's": "when",
    "why's": "why",
    "how's": "how",
    "isn't": "not",
    "aren't": "not",
    "wasn't": "not",
    "weren't": "not",
    "hasn't": "not have",
    "haven't": "not have",
    "hadn't": "not have",
    "won't": "not will",
    "wouldn't": "not would",
    "don't": "dont",
    "doesn't": "dont",
    "didn't": "didnt",
    "can't": "can not",
    "couldn't": "could not",
    "shouldn't": "should not",
    "let's": "let us",
    "here's": "here",
    "there's": "there"
  };

  // Phrase simplifications for sign language order
  const PHRASE_MAP = [
    [/\bi am going to\b/g, "i go"],
    [/\bi am\b/g, "i"],
    [/\bwe are\b/g, "we"],
    [/\bthey are\b/g, "they"],
    [/\bhe is\b/g, "he"],
    [/\bshe is\b/g, "she"],
    [/\bthere are\b/g, "there"],
    [/\bthere is\b/g, "there"],
    [/\bhow are you\b/g, "how you"],
    [/\bhow do you\b/g, "how you"],
    [/\bdo you want\b/g, "you want"],
    [/\bwhat is your\b/g, "what your"],
    [/\bwhat are you\b/g, "what you"],
    [/\bnice to meet you\b/g, "nice meet you"],
    [/\bmy name is\b/g, "name"],
    [/\ba lot of\b/g, "a_lot"],
    [/\bget rid of\b/g, "get_rid_of"],
    [/\bwell done\b/g, "well_done"],
    [/\bthank you\b/g, "thank"],
    [/\bthank god\b/g, "thank_god"],
    [/\bi don't know\b/g, "i_dont_know"],
    [/\bi know\b/g, "i_know"],
  ];

  function cleanText(text) {
    return text
      .replace(/\[.*?\]/g, '')        // Remove [Music], [Applause], etc.
      .replace(/<[^>]*>/g, '')        // Remove HTML tags
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()"\[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .trim();
  }

  function expandContractions(text) {
    const words = text.split(/\s+/);
    return words.map(w => CONTRACTIONS[w] || w).join(' ');
  }

  function simplifyForASL(text) {
    let simplified = text;
    for (const [pattern, replacement] of PHRASE_MAP) {
      simplified = simplified.replace(pattern, replacement);
    }
    return simplified;
  }

  function removeStopWords(words) {
    return words.filter(w => !STOP_WORDS.has(w) && w.length > 0);
  }

  /**
   * Process a caption sentence into tokens ready for SiGML lookup.
   * @param {string} sentence - Raw caption text
   * @returns {string[]} Array of tokens (words or multi-word glosses)
   */
  function processText(sentence) {
    if (!sentence || sentence.trim().length === 0) return [];

    let text = cleanText(sentence);
    
    // Skip pure annotations like [Music]
    if (text.length === 0) return [];

    text = expandContractions(text);
    text = simplifyForASL(text);
    
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const filtered = removeStopWords(words);

    return filtered;
  }

  return { processText, cleanText };
})();

// Make available globally
if (typeof window !== 'undefined') {
  window.SignTubeNLP = SignTubeNLP;
}
