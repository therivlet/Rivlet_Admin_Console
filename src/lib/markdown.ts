// Minimal, dependency-free Markdown -> HTML renderer for the Knowledge Base.
// Covers headers, bold/italic, inline code, fenced code blocks, links,
// unordered/ordered lists, blockquotes, horizontal rules, and paragraphs  - 
// the subset that actually shows up in SOP / vendor-directory style content.
// Not a full CommonMark implementation by design: no external dependency,
// small attack surface, good enough for admin-authored notes.

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderInline(text: string): string {
  let html = escapeHtml(text);
  // Inline code (before bold/italic so backticked content isn't touched)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic (single asterisk or underscore, not immediately adjacent to another *)
  html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  return html;
}

function splitTableRow(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
  return trimmed.split('|').map((cell) => cell.trim());
}

const TABLE_SEPARATOR_RE = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/;

export function renderMarkdown(markdown: string): string {
  const lines = (markdown || '').replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      html.push(`<p>${renderInline(paragraphBuffer.join(' '))}</p>`);
      paragraphBuffer = [];
    }
  };

  const closeList = () => {
    if (listType) {
      html.push(listType === 'ul' ? '</ul>' : '</ol>');
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // GFM-style pipe table: a "| a | b |" row immediately followed by a
    // "| --- | --- |" separator row starts a table; consume rows until a
    // blank line or a non-table-shaped line.
    if (line.trim().startsWith('|') && lines[i + 1] && TABLE_SEPARATOR_RE.test(lines[i + 1].trim())) {
      flushParagraph();
      closeList();
      const headerCells = splitTableRow(line);
      const bodyRows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && lines[j].trim().startsWith('|')) {
        bodyRows.push(splitTableRow(lines[j]));
        j++;
      }
      html.push('<table><thead><tr>' + headerCells.map((c) => `<th>${renderInline(c)}</th>`).join('') + '</tr></thead><tbody>' +
        bodyRows.map((row) => '<tr>' + row.map((c) => `<td>${renderInline(c)}</td>`).join('') + '</tr>').join('') +
        '</tbody></table>');
      i = j - 1;
      continue;
    }

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        html.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        flushParagraph();
        closeList();
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.trim() === '') {
      flushParagraph();
      closeList();
      continue;
    }

    const headerMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (headerMatch) {
      flushParagraph();
      closeList();
      const level = headerMatch[1].length;
      html.push(`<h${level}>${renderInline(headerMatch[2])}</h${level}>`);
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushParagraph();
      closeList();
      html.push('<hr />');
      continue;
    }

    const quoteMatch = line.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      closeList();
      html.push(`<blockquote>${renderInline(quoteMatch[1])}</blockquote>`);
      continue;
    }

    const ulMatch = line.match(/^\s*[-*]\s+(.*)$/);
    const olMatch = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ulMatch || olMatch) {
      flushParagraph();
      const wantType = ulMatch ? 'ul' : 'ol';
      if (listType !== wantType) {
        closeList();
        html.push(wantType === 'ul' ? '<ul>' : '<ol>');
        listType = wantType;
      }
      html.push(`<li>${renderInline((ulMatch || olMatch)![1])}</li>`);
      continue;
    }

    closeList();
    paragraphBuffer.push(line.trim());
  }

  flushParagraph();
  closeList();
  if (inCodeBlock && codeBuffer.length > 0) {
    html.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
  }

  return html.join('\n');
}
