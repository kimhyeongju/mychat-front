export const PORTFOLIOS = [
  {
    slug: 'server',
    title: '여러 서버 구축',
    desc: 'DESC1',
    emoji: '🖥️',
    count: 31,
  },
  {
    slug: 'security',
    title: '공격 실습',
    desc: 'DESC2',
    emoji: '🛡️',
    count: 21,
  },
  { slug: 'llm', title: 'LLM', desc: 'DESC3', emoji: '🤖', count: 37 },
  { slug: 'ml', title: '머신러닝', desc: 'DESC4', emoji: '📊', count: 37 },
  {
    slug: 'blockchain',
    title: '블록체인',
    desc: 'DESC5',
    emoji: '⛓️',
    count: 21,
  },
];

export function findPortfolio(slug) {
  return PORTFOLIOS.find((p) => p.slug === slug) ?? null;
}

export const slideUrl = (slug, n) =>
  `/portfolio/${slug}/${String(n).padStart(2, '0')}.webp`;
