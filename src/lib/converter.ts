import MarkdownIt, { type Token } from 'markdown-it';
import { getStringWidth } from './string-width.ts';

export type ConversionOptions = {
  tableStyle: 'codeblock' | 'list';
  headerStyle: 'simple' | 'emoji';
};

const md = new MarkdownIt({
  html: false, // HTML tags will be stripped or escaped by default in some ways, but we might need manual handling
  breaks: true,
  linkify: true,
});

// Emoji map for headers
const HEADER_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];
const BULLET_POINT = '•'; // Revert to bullet point as requested
const INDENT_SPACE = '　'; // Full-width space for visual nesting in Slack

export function convertToSlack(markdown: string, options: ConversionOptions): string {
  // console.log('convertToSlack called with:', options.headerStyle);
  const tokens = md.parse(markdown, {});
  let result = '';
  let listDepth = -1; // -1 means not in a list
  // let listType: 'bullet' | 'ordered' | null = null; // Unused for now
  
  // NOTE: Simple token traversal might not be enough for nested structures like tables or lists. 
  // We might need a more robust visitor pattern or custom renderer.
  // Given the complexity of tables, we should process them carefully.

  // Let's implement a custom renderer approach using the tokens.
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    if (token.type === 'heading_open') {
      // Handle heading
      const level = parseInt(token.tag.slice(1)) - 1; // 0-based
      const emoji = options.headerStyle === 'emoji' ? (HEADER_EMOJIS[level] || '🔹') + ' ' : '';
      
      // Get the content (next inline token)
      const inlineToken = tokens[i + 1];
      if (inlineToken && inlineToken.type === 'inline') {
        const text = renderInline(inlineToken.children || []);
        result += `*${emoji}${text}*\n`;
        i++; // Skip inline
      }
      i++; // Skip heading_close (assuming valid structure)
      
    } else if (token.type === 'paragraph_open') {
      // Paragraphs inside lists handled differently? 
      // Slack lists: usually just one line.
      // Top level paragraphs: just text + newline.
      
    } else if (token.type === 'paragraph_close') {
      result += '\n';
      
    } else if (token.type === 'inline') {
      // Top level inline (e.g. inside paragraph)
      result += renderInline(token.children || []);
      
    } else if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
      listDepth++;
      
    } else if (token.type === 'bullet_list_close' || token.type === 'ordered_list_close') {
      listDepth--;
      if (listDepth === -1) result += '\n'; // Add extra newline after list ends?
      
    } else if (token.type === 'list_item_open') {
      const indent = INDENT_SPACE.repeat(Math.max(0, listDepth));
      result += `${indent}${BULLET_POINT} `;
      
    } else if (token.type === 'list_item_close') {
      // usually just newline
      // result += '\n'; 
      
    } else if (token.type === 'fence' || token.type === 'code_block') {
      // Code block
      const lang = token.info || '';
      result += `\`\`\`${lang}\n${token.content}\`\`\`\n`;
      
    } else if (token.type === 'table_open') {
        if (options.tableStyle === 'codeblock') {
            // We need to collect all table tokens to render it as a whole
            const tableTokens = [];
            let j = i;
            while (j < tokens.length && tokens[j].type !== 'table_close') {
                tableTokens.push(tokens[j]);
                j++;
            }
            tableTokens.push(tokens[j]); // include table_close
            
            result += renderTableAsCodeBlock(tableTokens);
            i = j; // Advance main loop
        } else {
            // Render as list (MVP fallback or 'List Style' option)
            // For now, let's implement codeblock style primarily as requested.
             const tableTokens = [];
            let j = i;
            while (j < tokens.length && tokens[j].type !== 'table_close') {
                tableTokens.push(tokens[j]);
                j++;
            }
            tableTokens.push(tokens[j]);
            result += renderTableAsList(tableTokens);
            i = j;
        }
    } else if (token.type === 'blockquote_open') {
        // We will handle blockquote content prefixing in the inline renderer or post-processing?
        // Easier: Just add '> ' to each line of the content.
        // Actually, markdown-it puts a 'paragraph' inside 'blockquote'. 
        // Example: blockquote_open -> paragraph_open -> inline -> paragraph_close -> blockquote_close
        // We might need to handle this stateful. 
        // For MVP, simplistic approach: if convert paragraphs inside blockquote.
        // Let's modify paragraph handling slightly.
    } else if (token.type === 'hr') {
        result += '─────\n';
    }
  }

  // Cleanup multiple newlines
  return result.replace(/\n{3,}/g, '\n\n').trim();
}

type InlineRenderOptions = {
  // Drop bold markers when the caller already wraps the text in *bold*, otherwise Slack gets `**text**`
  skipStrong?: boolean;
};

function renderInline(children: Token[] | null, options: InlineRenderOptions = {}): string {

  let text = '';
  if (!children) return text;

  for (const child of children) {
    if (child.type === 'text') {
      text += child.content;
    } else if (child.type === 'strong_open') {
        if (!options.skipStrong) text += '*';
    } else if (child.type === 'strong_close') {
        if (!options.skipStrong) text += '*';
    } else if (child.type === 'em_open') {
        text += '_';
    } else if (child.type === 'em_close') {
        text += '_';
    } else if (child.type === 'code_inline') {
        text += '`' + child.content + '`';
    } else if (child.type === 'link_open') {
        // We need to capture the href and wait for content
        // Markdown-it structure: link_open (attrs: href) -> text -> link_close
        const href = child.attrGet('href');
        text += `<${href}|`;
    } else if (child.type === 'link_close') {
        text += '>';
    } else if (child.type === 'image') {
        // Fallback for image: <url|🖼 alt>
        const src = child.attrGet('src');
        const alt = child.content;
        text += `<${src}|🖼 ${alt}>`;
    } else if (child.type === 's_open') { // Strikethrough
        text += '~';
    } else if (child.type === 's_close') {
        text += '~';
    } else if (child.type === 'softbreak') {
        text += '\n';
    } else if (child.type === 'hardbreak') {
        text += '\n';
    }
  }
  return text;
}


// Helper to extract plain text from inline tokens for table cells
// In code blocks, we can't use Slack styles like *bold*, so we just want the text.
function getPlainText(children: Token[] | null): string {
    let text = '';
    if (!children) return text;

    let linkHref: string | null = null;
    let linkStart = 0;

    for (const child of children) {
        if (child.type === 'text') {
            text += child.content;
        } else if (child.type === 'code_inline') {
            text += child.content;
        } else if (child.type === 'softbreak' || child.type === 'hardbreak') {
            text += ' '; // Convert breaks to space in table cells
        } else if (child.type === 'image') {
            text += child.content || ''; // Use alt text for images
        } else if (child.type === 'link_open') {
            // Bare URLs (linkify / <autolink>) already show the URL as their text
            const isBareUrl = child.markup === 'linkify' || child.markup === 'autolink';
            const href = child.attrGet('href');
            linkHref = isBareUrl || href === null ? null : String(href);
            linkStart = text.length;
        } else if (child.type === 'link_close') {
            // Links aren't clickable inside a code block, so keep the URL visible next to the label
            const label = text.slice(linkStart);
            if (linkHref && label !== linkHref) text += label ? ` (${linkHref})` : linkHref;
            linkHref = null;
        }
    }
    return text;
}

type CellAlign = 'left' | 'center' | 'right';

type TableCell = {
    children: Token[];
    align: CellAlign;
};

// Keep each cell's inline tokens so each table style can decide how to render them
function parseTable(tokens: Token[]): { headers: TableCell[][]; bodies: TableCell[][] } {
    const headers: TableCell[][] = [];
    const bodies: TableCell[][] = [];
    let currentRow: TableCell[] = [];
    let inHead = false;

    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];

        if (t.type === 'thead_open') {
            inHead = true;
        } else if (t.type === 'thead_close') {
            inHead = false;
        } else if (t.type === 'tr_open') {
            currentRow = [];
        } else if (t.type === 'tr_close') {
            if (inHead) {
                headers.push(currentRow);
            } else {
                bodies.push(currentRow);
            }
        } else if (t.type === 'th_open' || t.type === 'td_open') {
            // content is in the next inline token
            const next = tokens[i + 1];
            currentRow.push({
                children: next?.type === 'inline' ? next.children || [] : [],
                align: getCellAlign(t),
            });
        }
    }

    return { headers, bodies };
}

// markdown-it stores `:---:` / `---:` as style="text-align:..." on every cell of the column
function getCellAlign(token: Token): CellAlign {
    const style = token.attrGet('style');
    if (style === 'text-align:center') return 'center';
    if (style === 'text-align:right') return 'right';
    return 'left';
}

function padCell(text: string, width: number, align: CellAlign): string {
    const padding = Math.max(0, width - getStringWidth(text));
    if (align === 'right') return ' '.repeat(padding) + text;
    if (align === 'center') {
        const left = Math.floor(padding / 2);
        return ' '.repeat(left) + text + ' '.repeat(padding - left);
    }
    return text + ' '.repeat(padding);
}

function renderTableAsCodeBlock(tokens: Token[]): string {
    const { headers, bodies } = parseTable(tokens);
    if (headers.length === 0 && bodies.length === 0) return '';

    const toTextRows = (rows: TableCell[][]) =>
        rows.map(row => row.map(cell => ({ text: getPlainText(cell.children), align: cell.align })));
    const headerRows = toTextRows(headers);
    const bodyRows = toTextRows(bodies);

    // Measure display columns, including CJK and emoji sequences.
    const colWidths: number[] = [];
    [...headerRows, ...bodyRows].forEach(row => {
        row.forEach((cell, idx) => {
            colWidths[idx] = Math.max(colWidths[idx] || 0, getStringWidth(cell.text));
        });
    });

    const renderRow = (row: { text: string; align: CellAlign }[]) =>
        '|' + row.map((cell, idx) => ` ${padCell(cell.text, colWidths[idx], cell.align)} |`).join('') + '\n';

    let result = '```\n';

    headerRows.forEach(row => {
        result += renderRow(row);
    });

    // Render Separator (if there is a header or at least one row to define columns)
    if (headerRows.length > 0) {
        result += '|' + colWidths.map(width => '-'.repeat(width + 2) + '|').join('') + '\n';
    }

    bodyRows.forEach(row => {
        result += renderRow(row);
    });

    result += '```\n';
    return result;
}


function renderTableAsList(tokens: Token[]): string {
    const { headers, bodies } = parseTable(tokens);

    // For list view, we WANT rich text!
    // Use the first header row if available
    const headerRow = headers.length > 0 ? headers[0].map(cell => renderInline(cell.children)) : [];

    if (bodies.length === 0) {
        // Header-only table: keep the column names instead of dropping the table
        const names = headerRow.filter(Boolean);
        return names.length > 0 ? `${BULLET_POINT} ${names.join(' / ')}\n` : '';
    }

    let result = '';

    bodies.forEach((cells, rowIndex) => {
        const row = cells.map(cell => renderInline(cell.children));
        // The first column is wrapped in *bold* below, so render it without its own bold markers
        const key = renderInline(cells[0]?.children ?? null, { skipStrong: true });

        // Add a separator between rows if it's not the first row, primarily for multi-column readability
        // But for simple 2-col key-value, tight list is better.
        const isTwoCol = headerRow.length === 2 && row.length === 2;

        if (isTwoCol) {
            // 2-Column Key-Value optimization
            // headers are ignored in output, 1st col is key, 2nd is value
            // Format: • *Key*: Value
            result += `${BULLET_POINT} ${key ? `*${key}*: ` : ''}${row[1]}\n`;
        } else {
            // Multi-column generic fallback

            if (rowIndex > 0) result += '\n'; // Spacer for non-compact rows

            // Use first column as the primary item
            result += `${BULLET_POINT} *${key || 'Item'}*\n`;

            // Render remaining columns as sub-items
            for (let i = 1; i < row.length; i++) {
                 const label = headerRow[i] || `Col ${i + 1}`;
                 result += `${INDENT_SPACE}${BULLET_POINT} ${label}: ${row[i]}\n`;
            }
        }
    });

    return result;
}
