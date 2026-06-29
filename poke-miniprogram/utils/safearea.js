/** 顶栏安全区：状态栏 + 胶囊按钮避让 */
function getNavInsets() {
  let statusBarHeight = 20;
  let navPadTop = 24;
  let navPadRight = 24;
  let capsuleHeight = 32;

  try {
    if (wx.getWindowInfo) {
      statusBarHeight = wx.getWindowInfo().statusBarHeight || 20;
    }
  } catch (e) {}

  try {
    const menu = wx.getMenuButtonBoundingClientRect();
    if (menu && menu.top) {
      navPadTop = menu.top;
      capsuleHeight = menu.height;
      if (wx.getWindowInfo) {
        const winW = wx.getWindowInfo().windowWidth || 375;
        navPadRight = Math.max(24, winW - menu.left + 8);
      }
    } else {
      navPadTop = statusBarHeight + 8;
    }
  } catch (e) {
    navPadTop = statusBarHeight + 8;
  }

  return {
    statusBarHeight: statusBarHeight,
    navPadTop: navPadTop,
    navPadRight: navPadRight,
    capsuleHeight: capsuleHeight,
    navBarHeight: navPadTop + capsuleHeight + 12
  };
}

function applyToPage(page) {
  const insets = getNavInsets();
  if (page && page.setData) {
    page.setData({
      statusBarHeight: insets.statusBarHeight,
      navPadTop: insets.navPadTop,
      navPadRight: insets.navPadRight,
      navBarHeight: insets.navBarHeight
    });
  }
  return insets;
}

module.exports = { getNavInsets, applyToPage };
