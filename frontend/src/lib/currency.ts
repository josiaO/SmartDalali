/**
 * Format a number as Tanzanian Shillings (TZS)
 * @param amount - The amount to format
 * @param includeDecimals - Whether to include decimal places (default: false)
 * @returns Formatted currency string
 */
export function formatTZS(amount: number | string, includeDecimals: boolean = false): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) {
        return 'TZS 0';
    }

    const formatted = includeDecimals
        ? numAmount.toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : numAmount.toLocaleString('en-TZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    return `TZS ${formatted}`;
}

/**
 * Format a number as compact TZS (e.g., 1.5M, 2.3K)
 * @param amount - The amount to format
 * @returns Compact formatted currency string
 */
export function formatCompactTZS(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) {
        return 'TZS 0';
    }

    if (numAmount >= 1_000_000_000) {
        return `TZS ${(numAmount / 1_000_000_000).toFixed(1)}B`;
    } else if (numAmount >= 1_000_000) {
        return `TZS ${(numAmount / 1_000_000).toFixed(1)}M`;
    } else if (numAmount >= 1_000) {
        return `TZS ${(numAmount / 1_000).toFixed(1)}K`;
    }

    return `TZS ${numAmount.toLocaleString('en-TZ')}`;
}
