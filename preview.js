const escapeHtml = (value) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

// Tag captures have already been escaped, but may contain generated markup.
const escapeAttribute = (value) => value
  .replace(/&(?!(?:amp|lt|gt|quot|#39);)/g, '&amp;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function bbcodeToHtml(text) {
  let html = escapeHtml(text);
  const codeBlocks = [];
  html = html.replace(/\[(code|pre)(?:=([^\]]+))?\]([\s\S]*?)\[\/\1\]/gi, (_match, tag, language, body) => {
    const attribute = language ? ` data-lang="${escapeAttribute(language)}"` : '';
    codeBlocks.push(tag.toLowerCase() === 'pre' ? `<pre>${body}</pre>` : `<pre><code${attribute}>${body}</code></pre>`);
    return `<!--bbcode-code-${codeBlocks.length - 1}-->`;
  });

  const simpleTags = [
    { bb: 'b', html: 'strong' },
    { bb: 'i', html: 'em' },
    { bb: 'u', html: 'u' },
    { bb: 's', html: 's' },
    { bb: 'quote', html: 'blockquote' }
  ];

  simpleTags.forEach(({ bb, html: tag }) => {
    const regex = new RegExp(`\\[${bb}\\]([\\s\\S]*?)\\[\\/${bb}\\]`, 'gi');
    html = html.replace(regex, `<${tag}>$1</${tag}>`);
  });

  // Named quote [quote=Name]text[/quote]
  html = html.replace(
    /\[quote=([^\]]+)\]([\s\S]*?)\[\/quote\]/gi,
    (_m, name, body) => `<blockquote><cite>${escapeAttribute(name)}</cite>${body}</blockquote>`
  );

  // Text alignment
  html = html.replace(/\[center\]([\s\S]*?)\[\/center\]/gi, '<div style="text-align:center;">$1</div>');
  html = html.replace(/\[left\]([\s\S]*?)\[\/left\]/gi, '<div style="text-align:left;">$1</div>');
  html = html.replace(/\[right\]([\s\S]*?)\[\/right\]/gi, '<div style="text-align:right;">$1</div>');

  // Size and color
  const fontSizes = ['x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', 'xxx-large'];
  html = html.replace(
    /\[size=([0-9]{1,3})\]([\s\S]*?)\[\/size\]/gi,
    (_m, size, body) => `<span style="font-size:${fontSizes[Number(size) - 1] || `${size}px`};">${body}</span>`
  );
  html = html.replace(
    /\[color=([#a-zA-Z0-9(),.\s]+)\]([\s\S]*?)\[\/color\]/gi,
    (_m, color, body) => `<span style="color:${escapeHtml(color.trim())};">${body}</span>`
  );
  // [style size=...] or [style color=...] (limited safe subset)
  html = html.replace(/\[style\s+([^\]]+)\]([\s\S]*?)\[\/style\]/gi, (_m, attrs, body) => {
    const styleParts = [];
    const sizeMatch = attrs.match(/size\s*=\s*([0-9]{1,3})/i);
    if (sizeMatch) styleParts.push(`font-size:${sizeMatch[1]}px`);
    const colorMatch = attrs.match(/color\s*=\s*([#a-zA-Z0-9(),.\s]+)/i);
    if (colorMatch) styleParts.push(`color:${escapeHtml(colorMatch[1].trim())}`);
    const style = styleParts.join(';');
    return style ? `<span style="${style};">${body}</span>` : body;
  });

  html = html.replace(
    /\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi,
    (_match, link, label) => /^(https?:\/\/|mailto:)/i.test(link.trim())
      ? `<a href="${escapeAttribute(link.trim())}" target="_blank" rel="noopener">${label}</a>` : label
  );
  html = html.replace(/\[url\]([\s\S]*?)\[\/url\]/gi, (_m, link) => {
    const sanitized = escapeAttribute(link.trim());
    if (!/^(https?:\/\/|mailto:)/i.test(link.trim())) return sanitized;
    return `<a href="${sanitized}" target="_blank" rel="noopener">${sanitized}</a>`;
  });

  html = html.replace(/\[img\]([^\]]+)\[\/img\]/gi, (_match, src) => {
    const sanitizedSrc = escapeAttribute(src.trim());
    return `<img src="${sanitizedSrc}" alt="BBCode image" />`;
  });
  html = html.replace(
    /\[img\s+width=([0-9]{1,4})(?:\s+height=([0-9]{1,4}))?\]([^\]]+)\[\/img\]/gi,
    (_m, w, h, src) => {
      const sanitizedSrc = escapeAttribute(src.trim());
      const sizeAttrs = [`width="${w}"`].concat(h ? [`height="${h}"`] : []).join(' ');
      return `<img src="${sanitizedSrc}" ${sizeAttrs} alt="BBCode image" />`;
    }
  );
  html = html.replace(/\[img=([0-9]{1,4})x([0-9]{1,4})\]([^\]]+)\[\/img\]/gi, (_m, w, h, src) => {
    const sanitizedSrc = escapeAttribute(src.trim());
    return `<img src="${sanitizedSrc}" width="${w}" height="${h}" alt="BBCode image" />`;
  });

  // Spoiler
  html = html.replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi, '<details><summary>Spoiler</summary><div>$1</div></details>');

  // Lists and items
  // Convert innermost lists first so their item markers stay inside the parent item.
  const listPattern = /\[(list|ul|ol)\]((?:(?!\[(?:list|ul|ol)\])[\s\S])*?)\[\/\1\]/gi;
  let replaced = true;
  while (replaced) {
    replaced = false;
    html = html.replace(listPattern, (_m, tag, body) => {
      replaced = true;
      const tagName = tag.toLowerCase() === 'ol' ? 'ol' : 'ul';
      let items = body.trim().replace(/\[\*\]([\s\S]*?)(?:\[\/\*\]\s*|(?=\[\*\]|\[li\]|$))/gi,
        (_m2, item) => `<li>${item.trim()}</li>`);
      items = items.replace(/\[li\]([\s\S]*?)\[\/li\]\s*/gi, (_m2, item) => `<li>${item.trim()}</li>`);
      return `<${tagName}>${items}</${tagName}>`;
    });
  }

  // Tables
  html = html.replace(/\[table\]([\s\S]*?)\[\/table\]/gi, '<table>$1</table>');
  html = html.replace(/\[tr\]([\s\S]*?)\[\/tr\]/gi, '<tr>$1</tr>');
  html = html.replace(/\[th\]([\s\S]*?)\[\/th\]/gi, '<th>$1</th>');
  html = html.replace(/\[td\]([\s\S]*?)\[\/td\]/gi, '<td>$1</td>');

  // YouTube embeds
  html = html.replace(/\[youtube\]([a-zA-Z0-9_-]{5,})\[\/youtube\]/gi, (_m, id) => {
    const safeId = escapeHtml(id.trim());
    return `<iframe src="https://www.youtube.com/embed/${safeId}" title="YouTube video" frameborder="0" allowfullscreen></iframe>`;
  });

  return html.replace(/<!--bbcode-code-(\d+)-->/g, (_match, index) => codeBlocks[index]);
}

function buildPreviewHtml(content) {
  const body = bbcodeToHtml(content);
  return /* html */ `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https:; style-src 'unsafe-inline'; frame-src https://www.youtube.com;" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        :root {
          color-scheme: light dark;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          margin: 0;
          padding: 16px;
          line-height: 1.5;
          background: var(--vscode-editor-background);
          color: var(--vscode-editor-foreground);
        }
        a { color: var(--vscode-textLink-foreground); }
        pre {
          background: var(--vscode-editor-inactiveSelectionBackground);
          padding: 12px;
          border-radius: 6px;
          overflow: auto;
        }
        blockquote {
          border-left: 3px solid var(--vscode-editor-foreground);
          padding-left: 12px;
          margin-left: 0;
          opacity: 0.9;
        }
        img {
          max-width: 100%;
          height: auto;
        }
        .container {
          white-space: pre-wrap;
          word-wrap: break-word;
        }
      </style>
    </head>
    <body>
      <div class="container">${body}</div>
    </body>
  </html>`;
}

module.exports = {
  bbcodeToHtml,
  buildPreviewHtml
};
