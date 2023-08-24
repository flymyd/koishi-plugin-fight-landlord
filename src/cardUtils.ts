const initCards = () => {
  const originCardHeap = [{cardValue: 14, cardName: '小王'}, {
    cardValue: 15,
    cardName: '大王'
  }, ...Array.from({length: 13 * 4}, (_, index) => {
    const cardValue = Math.ceil((index + 1) / 4)
    let cardName = String(cardValue + 2);
    if (cardName == '14') {
      cardName = 'A'
    } else if (cardName == '15') {
      cardName = '2'
    }
    return {cardValue, cardName}
  })]

  function shuffleCards(arr) {
    arr = JSON.parse(JSON.stringify(arr));
    for (const key in arr) {
      let index = parseInt(String(Math.random() * arr.length));
      [arr[key], arr[index]] = [arr[index], arr[key]];
    }
    // arr.reverse();
    return arr;
  }

  let newAll = shuffleCards(originCardHeap);

  function dealCards(arr) {
    let player1 = arr.slice(0, 17);
    let player2 = arr.slice(17, 34);
    let player3 = arr.slice(34, 51);
    let holeCards = arr.slice(51, 54);
    return {player1, player2, player3, holeCards};
  }

  let {player1, player2, player3, holeCards} = dealCards(newAll);

  // 排序
  function sortCards(arr) {
    // 排大小
    arr.sort((a, b) => b.cardValue - a.cardValue);
    for (let i = 0; i < 4; i++) {
      for (const key in arr) {
        if (Number(key) != arr.length - 1) {
          if (arr[key].cardName == arr[+key + 1].cardName) {
            [arr[key], arr[+key + 1]] = [arr[+key + 1], arr[key]];
          }
        }
      }
    }
  }

  sortCards(player1)
  sortCards(player2)
  sortCards(player3)
  sortCards(holeCards)

  return {
    player1, player2, player3, holeCards
  }
}
