export const ANALYTICS_VERSION = 1;
export const MIN_PERCENTILE_SAMPLE = 50;

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
  REMOTE_MATCH_UNLOCK: 'remote_match_unlock'
});

export const EVENT_NAMES = Object.freeze(Object.values(EVENTS));
