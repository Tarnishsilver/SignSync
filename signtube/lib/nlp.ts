// NLP Utilities

export function cleanText(text: string): string {
  // Remove punctuation and convert to lowercase
  return text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").toLowerCase().trim();
}

export function tokenizeSentence(text: string): string[] {
  // Split simplified clean text into words
  const clean = cleanText(text);
  return clean.split(/\s+/).filter(word => word.length > 0);
}

export function simplifySentence(text: string): string {
  // Very basic simplification mapping for sign language
  // Typical mappings (I am going -> I go)
  let simplified = cleanText(text);
  
  // Basic verb mapping
  simplified = simplified
    .replace(/\bi am going to\b/g, "i go")
    .replace(/\bi am\b/g, "i")
    .replace(/\bwe are\b/g, "we")
    .replace(/\bthey are\b/g, "they")
    .replace(/\bhe is\b/g, "he")
    .replace(/\bshe is\b/g, "she")
    .replace(/\bto\b/g, ""); // "to school" -> "school"

  // Remove common stop words that are often omitted in sign language
  const stopWords = ["a", "an", "the", "is", "am", "are", "was", "were", "be", "been"];
  const words = simplified.split(/\s+/);
  
  return words.filter(w => !stopWords.includes(w)).join(" ").trim();
}
