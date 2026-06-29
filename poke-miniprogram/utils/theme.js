const { LIGHT, DARK } = require('./design-tokens.js');

function getMode() {
  try {
    const m = wx.getStorageSync('poke.theme');
    if (m === 'dark' || m === 'light') return m;
  } catch (e) {}
  return 'light';
}

function setMode(mode) {
  const m = mode === 'dark' ? 'dark' : 'light';
  try { wx.setStorageSync('poke.theme', m); } catch (e) {}
  return m;
}

function isDark() {
  return getMode() === 'dark';
}

function navBarColors(mode) {
  const m = mode || getMode();
  if (m === 'dark') {
    return {
      frontColor: '#ffffff',
      backgroundColor: DARK.bgBase,
      background: DARK.bgBase
    };
  }
  return {
    frontColor: '#000000',
    backgroundColor: LIGHT.bgBase,
    background: LIGHT.bgBase
  };
}

function applyPageTheme(page, mode) {
  const m = mode || getMode();
  if (page && page.setData) {
    page.setData({ themeDark: m === 'dark' });
  }
  const c = navBarColors(m);
  wx.setNavigationBarColor({
    frontColor: c.frontColor,
    backgroundColor: c.backgroundColor,
    animation: { duration: 400, timingFunc: 'easeIn' }
  });
}

module.exports = { getMode, setMode, isDark, navBarColors, applyPageTheme, LIGHT, DARK };
