const assert = require('node:assert/strict');
const { test } = require('node:test');
const { bbcodeToHtml, buildPreviewHtml } = require('../preview');

test('renders numbered font sizes as a readable scale', () => {
  const sizes = ['x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', 'xxx-large'];
  sizes.forEach((size, index) => {
    assert.equal(bbcodeToHtml(`[size=${index + 1}]Heading[/size]`),
      `<span style="font-size:${size};">Heading</span>`);
  });
});

test('preserves pixel sizes outside the numbered scale and in style attributes', () => {
  assert.equal(bbcodeToHtml('[size=24]Heading[/size]'),
    '<span style="font-size:24px;">Heading</span>');
  assert.equal(bbcodeToHtml('[style size=4]Small[/style]'),
    '<span style="font-size:4px;">Small</span>');
});

test('renders formatted items with explicit closing tags', () => {
  assert.equal(bbcodeToHtml('[list]\n[*][b]Speed[/b]: [0, 1][/*]\n[*][url=https://example.com]Link[/url][/*]\n[/list]'),
    '<ul><li><strong>Speed</strong>: [0, 1]</li><li><a href="https://example.com" target="_blank" rel="noopener">Link</a></li></ul>');
});

test('renders items without explicit closing tags', () => {
  assert.equal(bbcodeToHtml('[list]\n[*]One\n[*]Two\n[/list]'),
    '<ul><li>One</li><li>Two</li></ul>');
});

test('keeps same-type nested lists inside their parent item', () => {
  assert.equal(bbcodeToHtml('[list][*]Parent[list][*]Child[/*][/list][/*][*]Sibling[/*][/list]'),
    '<ul><li>Parent<ul><li>Child</li></ul></li><li>Sibling</li></ul>');
});

test('renders mixed nested lists and li items', () => {
  assert.equal(bbcodeToHtml('[ol][li]Parent[ul][li]Child[/li][/ul][/li][li]Sibling[/li][/ol]'),
    '<ol><li>Parent<ul><li>Child</li></ul></li><li>Sibling</li></ol>');
});

test('leaves unmatched list tags intact', () => {
  assert.equal(bbcodeToHtml('[list][*]Unfinished'), '[list][*]Unfinished');
});

test('preserves HTML escaping and quote, color and link rendering', () => {
  const html = buildPreviewHtml('[size=4][color=#00ffff]Heading[/color][/size]\n[quote]<script>alert(1)</script>[/quote]\n[url=https://example.com]Source[/url]');
  assert.ok(html.includes('<span style="font-size:large;"><span style="color:#00ffff;">Heading</span></span>'));
  assert.ok(html.includes('<blockquote>&lt;script&gt;alert(1)&lt;/script&gt;</blockquote>'));
  assert.ok(html.includes('<a href="https://example.com" target="_blank" rel="noopener">Source</a>'));
  assert.ok(!html.includes('<script>'));
  assert.equal(bbcodeToHtml('[url=command:workbench.action.closeWindow]Link[/url]'), 'Link');
});

test('preserves query parameters in links and images', () => {
  assert.equal(bbcodeToHtml('[url=https://example.com?a=1&b=2]Link[/url]'),
    '<a href="https://example.com?a=1&amp;b=2" target="_blank" rel="noopener">Link</a>');
  assert.equal(bbcodeToHtml('[img]https://example.com/image?a=1&b=2[/img]'),
    '<img src="https://example.com/image?a=1&amp;b=2" alt="BBCode image" />');
});

test('renders code blocks literally while formatting surrounding text', () => {
  assert.equal(bbcodeToHtml('[b]Example[/b][code=bbcode][b]<tag>[/b][/code][i]End[/i]'),
    '<strong>Example</strong><pre><code data-lang="bbcode">[b]&lt;tag&gt;[/b]</code></pre><em>End</em>');
  assert.equal(bbcodeToHtml('[quote][code][b]literal[/b][/code][/quote]'),
    '<blockquote><pre><code>[b]literal[/b]</code></pre></blockquote>');
});
