const ACCENT = '#6B8CAE';

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function titleNodes(title, query) {
  const t = String(title || '');
  const q = String(query || '').trim();
  if (!q) return [{ type: 'text', text: t }];
  const lower = t.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx < 0) return [{ type: 'text', text: t }];
  const nodes = [];
  if (idx > 0) nodes.push({ name: 'span', children: [{ type: 'text', text: t.slice(0, idx) }] });
  nodes.push({
    name: 'span',
    attrs: { style: 'color:' + ACCENT + ';font-weight:700' },
    children: [{ type: 'text', text: t.slice(idx, idx + q.length) }]
  });
  if (idx + q.length < t.length) {
    nodes.push({ name: 'span', children: [{ type: 'text', text: t.slice(idx + q.length) }] });
  }
  return nodes;
}

module.exports = { titleNodes, escapeHtml };
