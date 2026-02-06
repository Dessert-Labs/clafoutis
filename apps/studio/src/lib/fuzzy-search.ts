/**
 * Performs fuzzy matching on a string.
 * Returns true if all characters in the query appear in order in the text,
 * allowing for characters in between (fuzzy matching).
 * Handles spaces by splitting the query into words and matching each word independently.
 *
 * @param text - The text to search in
 * @param query - The search query
 * @returns true if the query matches the text
 */
export function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true;
  if (!text) return false;

  const textLower = text.toLowerCase();
  const queryWords = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

  if (queryWords.length === 0) return true;

  for (const word of queryWords) {
    let textIndex = 0;
    let wordIndex = 0;

    while (textIndex < textLower.length && wordIndex < word.length) {
      if (textLower[textIndex] === word[wordIndex]) {
        wordIndex++;
      }
      textIndex++;
    }

    if (wordIndex !== word.length) {
      return false;
    }
  }

  return true;
}

/**
 * Scores a fuzzy match based on how close together the matched characters are.
 * Higher scores indicate better matches (characters closer together).
 * Handles spaces by splitting the query into words and scoring each word independently.
 *
 * @param text - The text that was matched
 * @param query - The search query
 * @returns A score (higher is better)
 */
export function fuzzyScore(text: string, query: string): number {
  if (!query) return 0;
  if (!text) return 0;

  const textLower = text.toLowerCase();
  const queryWords = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

  if (queryWords.length === 0) return 0;

  let totalScore = 0;

  for (const word of queryWords) {
    let textIndex = 0;
    let wordIndex = 0;
    let wordScore = 0;
    let lastMatchIndex = -1;

    while (textIndex < textLower.length && wordIndex < word.length) {
      if (textLower[textIndex] === word[wordIndex]) {
        if (lastMatchIndex >= 0) {
          const gap = textIndex - lastMatchIndex - 1;
          wordScore += 100 - gap * 10;
        } else {
          wordScore += 100;
        }
        lastMatchIndex = textIndex;
        wordIndex++;
      }
      textIndex++;
    }

    if (wordIndex !== word.length) {
      return 0;
    }

    totalScore += wordScore;
  }

  return totalScore;
}
