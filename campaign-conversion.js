import { getCampaign } from './campaign-config.js';
import { EVENTS } from './analytics-contract.js';

const ALLOWED_TYPES = new Set([
  'lead_submit',
  'booking_intent',
  'checkout_start',
  'purchase_confirmation',
  'custom'
]);

function cleanToken(value, max = 80) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').slice(0, max);
}

export function trackCampaignConversion(type, details = {}) {
  const campaign = getCampaign();
  if (!campaign?.id) return false;

  const conversionType = cleanToken(type);
  if (!ALLOWED_TYPES.has(conversionType)) return false;

  const properties = {
    campaign_id: campaign.id,
    conversion_type: conversionType
  };

  if (details.itemId) properties.item_id = cleanToken(details.itemId);
  if (details.source) properties.source = cleanToken(details.source);
  if (details.demoOnly === true) properties.demo_only = true;

  // Intentionally do not accept email, name, free-form notes, or other PII here.
  window.TasteprintAnalytics?.track?.(EVENTS.CAMPAIGN_CONVERSION, properties);
  return true;
}

if (typeof window !== 'undefined') {
  window.TasteprintCampaignConversions = Object.freeze({
    track: trackCampaignConversion,
    allowedTypes: Object.freeze([...ALLOWED_TYPES])
  });
}
