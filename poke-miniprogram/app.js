const theme = require('./utils/theme.js');

App({
  globalData: { themeMode: 'light' },
  onLaunch() {
    const mode = theme.getMode();
    this.globalData.themeMode = mode;
  }
});
