const CATALOG_HEADERS = ['id','name','description','tag','modes','archetypes','ctaLabel','href'];

function splitList(value) {
  if (Array.isArray(value)) return value.map(String).map((v) => v.trim()).filter(Boolean);
  return String(value || '').split('|').map((v) => v.trim()).filter(Boolean);
}

function normalizeItem(item, index = 0) {
  const href = item.href == null || String(item.href).trim() === '' ? null : String(item.href).trim();
  return {
    id: String(item.id || `item-${index + 1}`).trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, ''),
    name: String(item.name || '').trim(),
    description: String(item.description || '').trim(),
    tag: String(item.tag || '').trim(),
    modes: splitList(item.modes),
    archetypes: splitList(item.archetypes),
    ctaLabel: String(item.ctaLabel || item.cta_label || 'Explore').trim(),
    href
  };
}

export function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  const source = String(text || '').replace(/^\uFEFF/, '');

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === ',' && !quoted) {
      row.push(cell);
      cell = '';
      continue;
    }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell);
      cell = '';
      if (row.some((value) => String(value).trim() !== '')) rows.push(row);
      row = [];
      continue;
    }
    cell += char;
  }

  row.push(cell);
  if (row.some((value) => String(value).trim() !== '')) rows.push(row);
  return rows;
}

export function catalogFromCSV(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  const header = rows[0].map((value) => String(value).trim());
  const aliases = { cta_label: 'ctaLabel', cta: 'ctaLabel', url: 'href', link: 'href' };

  return rows.slice(1).map((values, index) => {
    const raw = {};
    header.forEach((key, column) => {
      raw[aliases[key] || key] = values[column] ?? '';
    });
    return normalizeItem(raw, index);
  });
}

export function catalogFromJSON(text) {
  const parsed = typeof text === 'string' ? JSON.parse(text) : text;
  const items = Array.isArray(parsed) ? parsed : parsed?.catalog;
  if (!Array.isArray(items)) throw new Error('JSON must be a catalog array or a campaign object containing a catalog array.');
  return items.map(normalizeItem);
}

export function parseCatalogText(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return [];
  const looksJson = trimmed.startsWith('[') || trimmed.startsWith('{');
  return looksJson ? catalogFromJSON(trimmed) : catalogFromCSV(trimmed);
}

export function validateCatalog(catalog) {
  const errors = [];
  if (!Array.isArray(catalog) || catalog.length === 0) return ['Catalog must contain at least one item.'];
  const ids = new Set();
  catalog.forEach((item, index) => {
    const label = `Item ${index + 1}`;
    if (!item.id) errors.push(`${label}: id is required.`);
    if (!item.name) errors.push(`${label}: name is required.`);
    if (!item.description) errors.push(`${label}: description is required.`);
    if (!item.modes?.length) errors.push(`${label}: at least one travel mode is required.`);
    if (item.id && ids.has(item.id)) errors.push(`${label}: duplicate id “${item.id}”.`);
    if (item.id) ids.add(item.id);
    if (item.href && !/^https:\/\//i.test(item.href)) errors.push(`${label}: href must use HTTPS or be blank.`);
  });
  return errors;
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join('|') : String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function catalogToCSV(catalog = []) {
  return [
    CATALOG_HEADERS.join(','),
    ...catalog.map((item) => CATALOG_HEADERS.map((key) => csvEscape(item[key])).join(','))
  ].join('\n');
}

export function catalogTemplateCSV() {
  return `${CATALOG_HEADERS.join(',')}\ncoastal-weekend,Coastal Weekend,Slow mornings and a beautiful waterfront base,Coast · 4 nights,Coastal Romantic|City + Coast,Golden Hour Romantic,Explore,https://example.com/coastal-weekend`;
}
