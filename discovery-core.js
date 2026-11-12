import { CATEGORIES } from './catalog-core.js';
// Query strings carry only browsing controls and public catalog IDs, never tastes.
export function discoveryFilters(params) {
  const number = key => {
    const value = params.get(key);
    return value !== null && value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 ? String(Number(value)) : '';
  };
  return {
    query: (params.get('q') || '').slice(0, 120),
    category: CATEGORIES.includes(params.get('category')) ? params.get('category') : '',
    maxCost: number('maxCost'), maxMinutes: number('maxMinutes'), maxDistance: number('maxDistance'),
    stepFree: params.get('stepFree') === '1', available: params.get('available') === '1',
    savedOnly: params.get('saved') === '1', item: (params.get('item') || '').slice(0, 64)
  };
}
export function discoveryURL(filters) {
  const params = new URLSearchParams({ discover: '1' });
  for (const [key, value] of Object.entries({q:filters.query, category:filters.category, maxCost:filters.maxCost, maxMinutes:filters.maxMinutes, maxDistance:filters.maxDistance, item:filters.item})) if (value) params.set(key, value);
  for (const [key, value] of Object.entries({stepFree:filters.stepFree, available:filters.available, saved:filters.savedOnly})) if (value) params.set(key, '1');
  return `?${params}`;
}
export function discoveryConstraints(filters) {
  const result = { stepFree: filters.stepFree, requireAvailable: filters.available };
  for (const key of ['maxCost', 'maxMinutes', 'maxDistance']) if (filters[key] !== '') result[key] = Number(filters[key]);
  if (filters.maxCost !== '') result.currency = 'USD';
  return result;
}
export function browseCatalog(items, filters, tastes) {
  const query = filters.query.toLocaleLowerCase();
  return items.filter(item => item.status === 'active' && !tastes.dismissed.includes(item.id) &&
    (!filters.category || item.category === filters.category) && (!filters.savedOnly || tastes.saved.includes(item.id)) &&
    `${item.title} ${item.description} ${item.tags.join(' ')}`.toLocaleLowerCase().includes(query));
}
