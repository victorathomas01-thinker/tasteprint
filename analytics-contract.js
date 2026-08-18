export const ANALYTICS_VERSION = 4;
export const MIN_PERCENTILE_SAMPLE = 50;
export const RAW_DATA_RETENTION_DAYS = 180;

export const EVENTS = Object.freeze({
  PAGE_VIEW: 'page_view',
  QUIZ_START: 'quiz_start',
  QUIZ_STEP: 'quiz_step',
  QUIZ_COMPLETE: 'quiz_complete',
  RESULT_VIEW: 'result_view',
  STORY_SHARE: 'story_share',
  STORY_DOWNLOAD: 'story_download',
  RESULT_LINK_COPY: 'result_link_copy',
  CHALLENGE_CREATE: 'challenge_create',
  CHALLENGE_RECEIVE: 'challenge_receive',
  CHALLENGE_COMPLETE: 'challenge_complete',
  REMOTE_MATCH_UNLOCK: 'remote_match_unlock',
  CAMPAIGN_VIEW: 'campaign_view',
  CAMPAIGN_RESULT_MATCH: 'campaign_result_match',
  CAMPAIGN_CTA: 'campaign_cta',
  CAMPAIGN_LEAD_VIEW: 'campaign_lead_view',
  CAMPAIGN_LEAD_SUBMIT: 'campaign_lead_submit',
  CAMPAIGN_CONVERSION: 'campaign_conversion',
  RECOMMENDATION_INTELLIGENCE_VIEW: 'recommendation_intelligence_view',
  RECOMMENDATION_FEEDBACK: 'recommendation_feedback',
  RECOMMENDATION_LANE_SELECT: 'recommendation_lane_select'
});

export const EVENT_NAMES = Object.freeze(Object.values(EVENTS));
