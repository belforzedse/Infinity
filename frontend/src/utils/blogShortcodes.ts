/**
 * Parse shortcodes from blog content
 * Supports formats like:
 * - [products:1,2,3] - Product IDs
 * - [products:slug1,slug2] - Product slugs
 */

export interface ParsedShortcode {
  type: "products";
  identifiers: string[];
  originalMatch: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Extract all product shortcodes from HTML content
 * Supports quoted and unquoted identifiers:
 * - [products:1,2,3] - Product IDs
 * - [products:"slug1","slug2"] - Quoted slugs
 * - [products:"slug1",123,"slug2"] - Mixed quoted/unquoted
 * Also handles shortcodes wrapped in HTML tags like <p>[products:...]</p>
 */
export function parseProductShortcodes(html: string): ParsedShortcode[] {
  const shortcodes: ParsedShortcode[] = [];

  // First, decode HTML entities that might be in the content
  // This handles cases where < and > are encoded as &lt; and &gt;
  let decodedHtml = html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

  // Also handle cases where the shortcode might be HTML-encoded
  // e.g., &amp;#91;products:...&amp;#93; (though this is unlikely)
  decodedHtml = decodedHtml.replace(/&#91;/g, "[").replace(/&#93;/g, "]");

  // Match [products:...] pattern, even when wrapped in HTML tags
  // This regex will match shortcodes that might be inside <p>, <div>, etc.
  // It captures the shortcode itself, ignoring surrounding HTML tags
  // We use a more permissive pattern that matches across potential HTML boundaries
  const regex = /\[products:([^\]]+)\]/g;
  let match;
  const matches: Array<{ match: RegExpExecArray; originalIndex: number }> = [];

  // First, find all matches in the decoded HTML
  while ((match = regex.exec(decodedHtml)) !== null) {
    matches.push({ match, originalIndex: match.index });
  }

  // Now process each match and find its position in the original HTML
  for (const { match: matchResult, originalIndex } of matches) {
    const fullMatch = matchResult[0];
    const content = matchResult[1].trim();

    if (!content) {
      continue;
    }

    // Parse identifiers, handling both quoted and unquoted
    const identifiers: string[] = [];
    let current = "";
    let inQuotes = false;
    let quoteChar = "";

    for (let i = 0; i < content.length; i++) {
      const char = content[i];

      if ((char === '"' || char === "'") && (i === 0 || content[i - 1] !== "\\")) {
        if (!inQuotes) {
          // Start of quoted string
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          // End of quoted string
          inQuotes = false;
          if (current.trim()) {
            identifiers.push(current.trim());
            current = "";
          }
          quoteChar = "";
        } else {
          // Different quote character inside string, treat as regular char
          current += char;
        }
      } else if (char === "," && !inQuotes) {
        // Comma outside quotes - separator
        if (current.trim()) {
          identifiers.push(current.trim());
          current = "";
        }
      } else {
        // Regular character
        current += char;
      }
    }

    // Add remaining content
    if (current.trim()) {
      identifiers.push(current.trim());
    }

    // Remove quotes from identifiers if they were quoted
    const cleanedIdentifiers = identifiers
      .map((id) => {
        // Remove surrounding quotes if present
        const trimmed = id.trim();
        if (
          (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
          (trimmed.startsWith("'") && trimmed.endsWith("'"))
        ) {
          return trimmed.slice(1, -1);
        }
        return trimmed;
      })
      .filter((id) => id && id.length > 0); // Filter out empty identifiers

    if (cleanedIdentifiers.length === 0) {
      continue;
    }

    // Find the actual position in the original HTML string
    // We need to account for HTML entities in the original string
    let actualIndex = originalIndex;
    let actualEndIndex = originalIndex + fullMatch.length;

    // If the decoded HTML differs from original, find the actual position
    // by searching for the shortcode in the original HTML
    if (decodedHtml !== html) {
      // Search for the shortcode pattern in the original HTML
      // Try multiple strategies to find it
      const searchPattern = fullMatch.replace(/\[/g, "\\[").replace(/\]/g, "\\]");

      // Try direct match first
      let originalMatch = new RegExp(searchPattern.replace(/&/g, "&(?:amp;)?")).exec(html);

      // If not found, try with HTML entity encoding
      if (!originalMatch) {
        const encodedPattern = fullMatch
          .replace(/\[/g, "&#91;")
          .replace(/\]/g, "&#93;")
          .replace(/&/g, "&amp;");
        originalMatch = new RegExp(encodedPattern.replace(/\[/g, "\\[").replace(/\]/g, "\\]")).exec(html);
      }

      // If still not found, try searching around the expected position
      if (!originalMatch && originalIndex < html.length) {
        const searchStart = Math.max(0, originalIndex - 50);
        const searchEnd = Math.min(html.length, originalIndex + fullMatch.length + 50);
        const searchSlice = html.slice(searchStart, searchEnd);
        const localMatch = new RegExp(searchPattern).exec(searchSlice);
        if (localMatch) {
          actualIndex = searchStart + localMatch.index;
          actualEndIndex = actualIndex + fullMatch.length;
        }
      } else if (originalMatch) {
        actualIndex = originalMatch.index;
        actualEndIndex = actualIndex + fullMatch.length;
      }
    }

    shortcodes.push({
      type: "products",
      identifiers: cleanedIdentifiers,
      originalMatch: fullMatch,
      startIndex: actualIndex,
      endIndex: actualEndIndex,
    });
  }

  return shortcodes;
}

/**
 * Replace shortcodes in HTML with placeholders
 * Returns the modified HTML and a map of placeholders to shortcode data
 */
export function replaceShortcodesWithPlaceholders(
  html: string,
  shortcodes: ParsedShortcode[],
): { html: string; placeholders: Map<string, ParsedShortcode> } {
  const placeholders = new Map<string, ParsedShortcode>();
  let modifiedHtml = html;

  // Process in reverse order to maintain indices
  const sortedShortcodes = [...shortcodes].sort((a, b) => b.startIndex - a.startIndex);

  for (const shortcode of sortedShortcodes) {
    const placeholder = `__SHORTCODE_${shortcodes.indexOf(shortcode)}__`;
    placeholders.set(placeholder, shortcode);

    modifiedHtml =
      modifiedHtml.slice(0, shortcode.startIndex) +
      placeholder +
      modifiedHtml.slice(shortcode.endIndex);
  }

  return { html: modifiedHtml, placeholders };
}

/**
 * Extract product slug from URL
 * Supports both full URLs and relative paths
 * Examples:
 * - https://infinitycolor.org/pdp/product-slug → product-slug
 * - /pdp/product-slug → product-slug
 * - pdp/product-slug → product-slug
 */
export function extractProductSlugFromUrl(url: string): string | null {
  if (!url || typeof url !== "string") {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  // Try to extract slug from /pdp/[slug] pattern
  // Handle both full URLs and relative paths
  const patterns = [
    /\/pdp\/([^\/\?#]+)/, // Matches /pdp/slug or https://domain/pdp/slug
    /^pdp\/([^\/\?#]+)/, // Matches pdp/slug (no leading slash)
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      // Decode the slug in case it's URL encoded
      try {
        return decodeURIComponent(match[1]);
      } catch {
        return match[1];
      }
    }
  }

  // If no pattern matches, check if it's just a slug (no /pdp/ prefix)
  // This handles cases where user pastes just the slug
  if (!trimmed.includes("/") && !trimmed.includes("http")) {
    return trimmed;
  }

  return null;
}

/**
 * Extract multiple product slugs from URLs
 * Supports comma-separated or newline-separated URLs
 */
export function extractProductSlugsFromUrls(urls: string): string[] {
  if (!urls || typeof urls !== "string") {
    return [];
  }

  // Split by comma or newline
  const urlList = urls
    .split(/[,\n]/)
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  const slugs: string[] = [];
  for (const url of urlList) {
    const slug = extractProductSlugFromUrl(url);
    if (slug) {
      slugs.push(slug);
    }
  }

  return slugs;
}

