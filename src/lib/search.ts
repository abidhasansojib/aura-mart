export interface SearchableProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  imageUrl: string;
  isFeatured?: boolean;
  salesCount?: number;
  isViral?: boolean;
}

export interface SearchOutput<T> {
  exactMatches: T[];
  similarProducts: T[];
  matchedCategories: string[];
  hasQuery: boolean;
  totalResults: number;
}

// Bidirectional synonyms groups for e-commerce catalog
const RAW_SYNONYM_GROUPS: string[][] = [
  ["wallet", "wallets", "purse", "cardholder", "moneyclip", "bifold"],
  ["earbud", "earbuds", "earphone", "earphones", "headphone", "headphones", "bluetooth", "wireless", "airpods", "audio", "sound"],
  ["tshirt", "t-shirt", "tee", "shirt", "top", "apparel", "clothing"],
  ["cotton", "fabric"],
  ["mug", "cup", "ceramic", "coffee", "tea", "drinkware", "stoneware"],
  ["stand", "riser", "holder", "mount", "laptop", "aluminium", "ergonomic", "desk", "workstation"],
  ["candle", "wax", "aromatherapy", "scented", "fragrance", "ambient", "lavender"],
  ["leather", "leathercraft", "hide"],
];

// Normalize text for comparison
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Levenshtein edit distance for typo tolerance
export function getLevenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));

  for (let i = 0; i <= an; i++) matrix[0][i] = i;
  for (let j = 0; j <= bn; j++) matrix[j][0] = j;

  for (let j = 1; j <= bn; j++) {
    for (let i = 1; i <= an; i++) {
      if (b.charAt(j - 1) === a.charAt(i - 1)) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1, // substitution
          Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1) // insertion / deletion
        );
      }
    }
  }

  return matrix[bn][an];
}

// Build bidirectional synonym lookup
const SYNONYM_MAP: Record<string, string[]> = {};
for (const group of RAW_SYNONYM_GROUPS) {
  for (const term of group) {
    const norm = normalizeText(term);
    if (!SYNONYM_MAP[norm]) SYNONYM_MAP[norm] = [];
    for (const peer of group) {
      const normPeer = normalizeText(peer);
      if (normPeer !== norm && !SYNONYM_MAP[norm].includes(normPeer)) {
        SYNONYM_MAP[norm].push(normPeer);
      }
    }
  }
}

// Singularize English words
export function singularizeWord(word: string): string {
  if (word.endsWith("ies") && word.length > 4) {
    return word.slice(0, -3) + "y";
  }
  if (word.endsWith("es") && word.length > 4) {
    return word.slice(0, -2);
  }
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) {
    return word.slice(0, -1);
  }
  return word;
}

interface ScoredItem<T> {
  item: T;
  score: number;
  isDirectMatch: boolean;
  matchedCategory: boolean;
}

export function searchProducts<T extends SearchableProduct>(
  products: T[],
  rawQuery: string
): SearchOutput<T> {
  const query = normalizeText(rawQuery);

  if (!query) {
    return {
      exactMatches: products,
      similarProducts: [],
      matchedCategories: [],
      hasQuery: false,
      totalResults: products.length,
    };
  }

  const queryTokens = query.split(" ").filter((t) => t.length > 0);

  // Expand query tokens with synonyms
  const expandedTokens = new Set<string>();
  for (const token of queryTokens) {
    expandedTokens.add(token);
    const sing = singularizeWord(token);
    expandedTokens.add(sing);
    const syns = SYNONYM_MAP[token] || SYNONYM_MAP[sing] || [];
    syns.forEach((s) => expandedTokens.add(s));
  }

  // Detect matching categories
  const matchedCategories: string[] = [];
  const uniqueCategories = Array.from(new Set(products.map((p) => p.category)));
  for (const cat of uniqueCategories) {
    const normCat = normalizeText(cat);
    if (
      normCat.includes(query) ||
      query.includes(normCat) ||
      queryTokens.some((t) => normCat.includes(t))
    ) {
      matchedCategories.push(cat);
    }
  }

  const scored: ScoredItem<T>[] = [];

  for (const product of products) {
    const normName = normalizeText(product.name);
    const normCategory = normalizeText(product.category);
    const normDesc = product.description ? normalizeText(product.description) : "";
    const nameTokens = normName.split(" ");

    let score = 0;
    let isDirectMatch = false;
    let matchedCategory = false;

    // 1. Exact Full Phrase Match in Title
    if (normName === query) {
      score += 180;
      isDirectMatch = true;
    } else if (normName.startsWith(query)) {
      score += 120;
      isDirectMatch = true;
    } else if (normName.includes(query)) {
      score += 90;
      isDirectMatch = true;
    }

    // 2. Category Match
    if (normCategory === query || normCategory.includes(query)) {
      score += 60;
      matchedCategory = true;
    }

    // 3. Token-by-Token Match in Title
    let tokensFoundInTitle = 0;
    for (const token of queryTokens) {
      const sing = singularizeWord(token);

      // Direct word match
      if (nameTokens.includes(token) || nameTokens.includes(sing)) {
        score += 45;
        tokensFoundInTitle++;
      } else if (normName.includes(token) || normName.includes(sing)) {
        score += 30;
        tokensFoundInTitle++;
      } else {
        // Typo tolerance (Levenshtein) - only on words with length >= 5 to avoid short word collisions
        let bestDistance = 999;
        for (const nt of nameTokens) {
          if (nt.length >= 5 && token.length >= 5) {
            const dist = getLevenshteinDistance(token, nt);
            if (dist < bestDistance) {
              bestDistance = dist;
            }
          }
        }

        const allowedErrors = token.length >= 7 ? 2 : token.length >= 5 ? 1 : 0;
        if (bestDistance <= allowedErrors && allowedErrors > 0) {
          if (bestDistance === 1) {
            score += 50;
            tokensFoundInTitle++;
          } else {
            score += 30;
            tokensFoundInTitle++;
          }
        }
      }
    }

    // If all user query tokens match in the title, boost heavily as exact match
    if (queryTokens.length > 1 && tokensFoundInTitle === queryTokens.length) {
      score += 70;
      isDirectMatch = true;
    }

    // 4. Synonym Matches
    for (const token of Array.from(expandedTokens)) {
      if (nameTokens.includes(token)) {
        score += 45;
        isDirectMatch = true;
      }
    }

    // 5. Description Matches
    for (const token of queryTokens) {
      if (normDesc.includes(token)) {
        score += 10;
      }
    }

    if (score >= 45) {
      isDirectMatch = true;
    }

    scored.push({
      item: product,
      score,
      isDirectMatch,
      matchedCategory,
    });
  }

  // Sort by relevance score descending
  scored.sort((a, b) => b.score - a.score);

  // Exact Matches: High confidence score (score >= 40)
  const exactMatches = scored.filter((s) => s.score >= 40).map((s) => s.item);

  // Identify categories from exact matches to find related/similar products
  const prominentCategories = new Set<string>();
  if (exactMatches.length > 0) {
    exactMatches.slice(0, 3).forEach((p) => prominentCategories.add(p.category));
  } else {
    matchedCategories.forEach((c) => prominentCategories.add(c));
  }

  // Similar Products:
  // 1. Items with moderate score (20 <= score < 40), OR
  // 2. Items sharing the same category as the top matches, but not in exactMatches
  const exactIds = new Set(exactMatches.map((m) => m.id));
  const similarProducts: T[] = [];

  for (const s of scored) {
    if (exactIds.has(s.item.id)) continue;

    // Has moderate relevance score
    if (s.score >= 15 && s.score < 40) {
      similarProducts.push(s.item);
      continue;
    }

    // Belongs to the same category as exact match (affinity)
    if (prominentCategories.has(s.item.category) && !exactIds.has(s.item.id)) {
      similarProducts.push(s.item);
    }
  }

  // If exact matches exist but similar products is low (< 4),
  // supplement with other top catalog products for "You Might Also Like" discovery
  if (exactMatches.length > 0 && similarProducts.length < 4) {
    const similarIds = new Set(similarProducts.map((p) => p.id));
    for (const s of scored) {
      if (exactIds.has(s.item.id) || similarIds.has(s.item.id)) continue;
      similarProducts.push(s.item);
      if (similarProducts.length >= 4) break;
    }
  }

  return {
    exactMatches,
    similarProducts: similarProducts.slice(0, 8),
    matchedCategories,
    hasQuery: true,
    totalResults: exactMatches.length + similarProducts.length,
  };
}
