/** Extract the integer value from a label like "₹1,44,900". */
export function priceValue(price: string): number {
  return Number(price.replace(/[^\d]/g, "")) || 0;
}

/** "₹1,44,900" from a number (Indian digit grouping). */
export function formatINR(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}