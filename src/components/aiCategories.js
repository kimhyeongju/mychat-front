// AI 추천 자동 매수 카테고리. 코드는 서버의 AiCategory 와 같아야 한다.
// 이름과 설명은 messages.js 의 aic.<CODE> 에 있다.

export const AI_CATEGORY_GROUPS = [
  {
    key: 'theme',
    codes: [
      'SEMICONDUCTOR',
      'IT_SOFTWARE',
      'AI_CLOUD',
      'ENERGY',
      'FINANCE',
      'HEALTHCARE',
      'CONSUMER_STAPLES',
      'AGRICULTURE',
      'AIRLINES_TRANSPORT',
      'DEFENSE_SPACE',
      'AUTO_EV',
      'REAL_ESTATE',
      'ROBOTICS',
      'CYBERSECURITY',
    ],
  },
  { key: 'style', codes: ['GROWTH', 'DIVIDEND_STABLE'] },
  // AI 가 아니라 실제 시장 데이터의 순위로 고른다.
  { key: 'data', codes: ['WEEK_SURGE', 'MONTH_SURGE', 'WEEK_VOLUME_TOP'] },
  { key: 'custom', codes: ['CUSTOM'] },
];

const DATA_CODES = new Set(['WEEK_SURGE', 'MONTH_SURGE', 'WEEK_VOLUME_TOP']);

/** true 이면 AI(OpenAI)가 종목을 고르는 카테고리다. */
export function usesAi(code) {
  return !DATA_CODES.has(code);
}

export const MAX_STOCK_COUNT = 5;
export const MAX_TOPIC_LENGTH = 60;
