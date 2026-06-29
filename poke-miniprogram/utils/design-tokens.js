/** 流萤 · 设计令牌 — 中性底色 + 黛蓝锚定 + 分类柔彩 */
const brand = require('./brand.js');

const TAG_PALETTE = ['#8BA9C4', '#D8A7B0', '#9FC9B5', '#B0A6C6', '#E4C19A'];

const WELCOME_QUOTES = [
  '散落的光，值得被拾起',
  '灵感如萤，一闪即藏',
  '留白处，自有天地',
  '翻阅之间，收获发生',
  '一念落下，万象更新',
  '时光流逝，记忆留痕',
  '让念头，有处栖息'
];

const FILTER_PILLS = ['全部', '活动', '机会', '通知', '破壳', 'AI'];

const EASE_SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

const CATEGORY_COLORS = {
  lecture: { fg: '#6B8CAE', bg: 'rgba(107,140,174,0.14)', label: '雾蓝' },
  competition: { fg: '#D8A7B0', bg: 'rgba(216,167,176,0.16)', label: '藕粉' },
  exhibition: { fg: '#B0A6C6', bg: 'rgba(176,166,198,0.16)', label: '薰衣草' },
  notice: { fg: '#E4C19A', bg: 'rgba(228,193,154,0.18)', label: '暖杏' },
  ai: { fg: '#9FC9B5', bg: 'rgba(159,201,181,0.16)', label: '薄荷' },
  poke: { fg: '#8BA9C4', bg: 'rgba(139,169,196,0.18)', label: '圈外' },
  default: { fg: '#6B8CAE', bg: 'rgba(107,140,174,0.12)', label: '默认' }
};

const LIGHT = {
  bgBase: '#F7F5F2',
  bgGlass: 'rgba(255, 255, 255, 0.58)',
  borderGlass: 'rgba(255, 255, 255, 0.72)',
  textPrimary: '#2A2E37',
  textSecondary: 'rgba(42, 46, 55, 0.58)',
  accent: '#6B8CAE',
  accentSoft: 'rgba(107, 140, 174, 0.14)',
  cloudGray: '#C8C4BC'
};

const DARK = {
  bgBase: '#15171C',
  bgGlass: 'rgba(32, 34, 42, 0.72)',
  borderGlass: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#E8E6E1',
  textSecondary: 'rgba(232, 230, 225, 0.58)',
  accent: '#8BA9C4',
  accentSoft: 'rgba(139, 169, 196, 0.18)',
  cloudGray: '#5A5D66'
};

module.exports = {
  TAG_PALETTE,
  WELCOME_QUOTES,
  FILTER_PILLS,
  EASE_SPRING,
  CATEGORY_COLORS,
  LIGHT,
  DARK,
  BRAND_NAME: brand.NAME,
  BRAND_SLOGAN: brand.SLOGAN
};
