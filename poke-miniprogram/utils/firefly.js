/** 流萤光点动效 class 名 */

function cardEnterClass(index) {
  const delay = (index % 5);
  return 'firefly-enter firefly-d' + delay;
}

function withFireflyEnter(list) {
  return (list || []).map((item, i) => Object.assign({}, item, {
    enterClass: cardEnterClass(i),
    fireflyGlow: true
  }));
}

function briefEnterClass(index) {
  return 'firefly-brief firefly-brief-d' + (index % 3);
}

module.exports = { cardEnterClass, withFireflyEnter, briefEnterClass };
