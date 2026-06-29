const { WELCOME_QUOTES } = require('./design-tokens.js');

function dailyQuote() {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return WELCOME_QUOTES[seed % WELCOME_QUOTES.length];
}

module.exports = { dailyQuote };
