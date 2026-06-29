function staggerClass(index) {
  return 'card-enter card-enter-d' + (index % 5);
}

function withEnter(list) {
  return (list || []).map((item, i) => Object.assign({}, item, { enterClass: staggerClass(i) }));
}

module.exports = { staggerClass, withEnter };
