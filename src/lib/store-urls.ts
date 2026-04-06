// Uses Google Shopping search with store name for reliable results
// Store-specific URLs break frequently, so Google is the safest approach
export function getStoreSearchUrl(storeName: string, productName: string): string {
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(storeName + " " + productName)}`;
}
