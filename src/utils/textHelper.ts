/**
 * Utility functions for text cleaning and sanitization
 */

/**
 * Cleans HTML tags from product descriptions (especially from Excel / BigSeller / Shopee / Marketplace exports)
 * Converts <br>, <p>, <div>, <li> to clean newlines and bullets, strips <html>, <head>, <body>, <span>, etc.
 * Decodes HTML entities and normalizes paragraph breaks.
 */
export function cleanHtmlDescription(raw: string | undefined | null): string {
  if (!raw || typeof raw !== 'string') return '';

  let cleaned = raw;

  // 1. Remove entire <head>...</head>, <style>...</style>, <script>...</script> and their contents
  cleaned = cleaned.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // 2. Convert <br>, <br/>, <br /> to newline
  cleaned = cleaned.replace(/<br\s*[\/]?>/gi, '\n');

  // 3. Convert closing block tags </p>, </div>, </li>, </h[1-6]>, </tr> to newline
  cleaned = cleaned.replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n');

  // 4. Convert <li> to bullet symbol
  cleaned = cleaned.replace(/<li[^>]*>/gi, '• ');

  // 5. Strip all remaining HTML opening/closing/self-closing tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');

  // 6. Decode common HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&bull;/gi, '•')
    .replace(/&middot;/gi, '·')
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(parseInt(dec, 10));
      } catch {
        return '';
      }
    });

  // 7. Clean up lines: trim trailing and leading spaces per line, keep meaningful line breaks
  const rawLines = cleaned.split(/\r?\n/);
  const formattedLines: string[] = [];
  let consecutiveEmpty = 0;

  for (const line of rawLines) {
    const trimmed = line.replace(/[ \t]+/g, ' ').trim();
    if (!trimmed) {
      consecutiveEmpty++;
      // Allow at most one empty line separator between paragraphs
      if (consecutiveEmpty <= 1 && formattedLines.length > 0) {
        formattedLines.push('');
      }
    } else {
      consecutiveEmpty = 0;
      formattedLines.push(trimmed);
    }
  }

  return formattedLines.join('\n').trim();
}
