import { safeCatalogURL as safeOfferURL } from './campaign-import.js';
export { safeOfferURL };
import { matchCatalog } from './campaign-config.js';

export const STAY_PATTERNS = Object.freeze({
  'Coastal Romantic': { title: 'Make room for a slower moment.', reason: 'Your choices leaned toward atmosphere and unhurried connection.' },
  'Resort Luxury': { title: 'Let the little comforts count.', reason: 'Your choices put comfort and a considered setting near the center.' },
  'Slow Countryside': { title: 'A little less rush. A little more room.', reason: 'Your choices favored a gentler pace and room to recharge.' },
  'Culture City': { title: 'Follow the interesting details.', reason: 'Your choices leaned toward discovery, craft and local texture.' },
  'Nature Active': { title: 'Find a little fresh momentum.', reason: 'Your choices favored movement and the satisfaction of doing something.' },
  'Nightlife City': { title: 'Leave room for good company.', reason: 'Your choices leaned toward shared energy and a more spontaneous evening.' },
  'Structured Megacity': { title: 'A good plan, with something new in it.', reason: 'Your choices balanced discovery with the ease of a considered plan.' },
  'City + Coast': { title: 'A change of scene, at your own pace.', reason: 'Your choices balanced discovery with space to keep things flexible.' }
});

export function recommendExperiences(campaign, { archetype = '', travelMode = '' } = {}, limit = 3) {
  if (!campaign?.catalog?.length || !Number.isInteger(limit) || limit < 1) return [];
  const ranked = matchCatalog(campaign, { archetype, travelMode });
  const direct = (item) => item.modes?.includes(travelMode) || item.archetypes?.includes(archetype);
  const ordered = [...ranked.filter(direct), ...ranked.filter((item) => !direct(item))];
  const selected = [];
  const ids = new Set();
  const categories = new Set();
  const add = (item) => { selected.push(item); ids.add(item.id); categories.add(item.tag || ''); };
  for (const item of ordered) {
    if (selected.length === limit) break;
    if (!ids.has(item.id) && !categories.has(item.tag || '')) add(item);
  }
  for (const item of ordered) {
    if (selected.length === limit) break;
    if (!ids.has(item.id)) add(item);
  }
  return selected.map((item) => {
    const modeMatch = Boolean(item.modes?.includes(travelMode));
    const archetypeMatch = Boolean(item.archetypes?.includes(archetype));
    return {
      item,
      matched: modeMatch || archetypeMatch,
      reason: modeMatch
        ? `${STAY_PATTERNS[travelMode]?.reason || 'Your preference pattern aligns with this experience.'} This option follows that direction.`
        : archetypeMatch
          ? 'This idea aligns with the kind of experience your choices leaned toward. Its description and tradeoff can help you decide whether it fits today.'
          : 'An alternative to explore, rather than a close match to this result. Your preferences may be better served by a different offering.'
    };
  });
}
