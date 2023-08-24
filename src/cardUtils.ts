// 判断牌型的枚举
enum CardType {
  Single,        // 单张
  Pair,          // 对子
  StraightPair,  // 连对
  Straight,      // 顺子
  Triple,        // 三带
  TripleWithSingle,  // 三带一
  TripleWithPair,    // 三带对
  Bomb,          // 炸弹
  JokerBomb,     // 王炸
  FourWithTwo,   // 四带二
  Invalid        // 无效牌型
}

// 判断牌型的函数
function getCardType(cards: number[]): CardType {
  const length = cards.length;

  // 牌型判断逻辑
  if (length === 1) {
    return CardType.Single;
  } else if (length === 2 && cards[0] === cards[1]) {
    return cards[0] === 52 ? CardType.JokerBomb : CardType.Pair;
  } else if (length >= 3 && length % 2 === 0 && isStraightPair(cards)) {
    return CardType.StraightPair;
  } else if (length >= 5 && isStraight(cards)) {
    return CardType.Straight;
  } else if (length === 3 && cards[0] === cards[1] && cards[0] === cards[2]) {
    return CardType.Triple;
  } else if (length === 4 && cards[0] === cards[1] && cards[0] === cards[2] && cards[0] === cards[3]) {
    return CardType.Bomb;
  } else if (length === 4 && (cards[0] === cards[1] && cards[2] === cards[3] || cards[0] === cards[1] && cards[0] === cards[2])) {
    return CardType.TripleWithSingle;
  } else if (length === 5 && cards[0] === cards[1] && cards[0] === cards[2] && cards[3] === cards[4] ||
    length === 5 && cards[0] === cards[1] && cards[2] === cards[3] && cards[0] === cards[2] ||
    length === 5 && cards[2] === cards[3] && cards[2] === cards[4] && cards[0] === cards[1]) {
    return CardType.TripleWithPair;
  } else if (length === 6 && isFourWithTwo(cards)) {
    return CardType.FourWithTwo;
  }

  return CardType.Invalid;
}

// 判断是否为连对
function isStraightPair(cards: number[]): boolean {
  const sorted = [...cards].sort((a, b) => a - b);

  for (let i = 0; i < sorted.length - 1; i += 2) {
    if (sorted[i] !== sorted[i + 1] || sorted[i] + 1 !== sorted[i + 2]) {
      return false;
    }
  }

  return true;
}

// 判断是否为顺子
function isStraight(cards: number[]): boolean {
  const sorted = [...cards].sort((a, b) => a - b);

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i] + 1 !== sorted[i + 1]) {
      return false;
    }
  }

  return true;
}

// 判断是否为四带二
function isFourWithTwo(cards: number[]): boolean {
  const counts = new Map<number, number>();

  for (const card of cards) {
    counts.set(card, (counts.get(card) || 0) + 1);
  }

  const values = Array.from(counts.values());
  return values.includes(4) && values.includes(2);
}

// 判断能否管住上家的牌
function canBeatPrevious(cards: number[], previous: number[]): boolean {
  const cardType = getCardType(cards);
  const previousType = getCardType(previous);

  if (cardType === CardType.Invalid) {
    return false;
  }

  if (previousType === CardType.Invalid) {
    return true;
  }

  if (cardType === CardType.JokerBomb) {
    return true;
  }

  if (cardType === CardType.Bomb && previousType=== CardType.Bomb) {
    return cards[0] > previous[0];
  }

  if (cardType !== previousType) {
    return false;
  }

  if (cards.length !== previous.length) {
    return false;
  }

  return cards[0] > previous[0];
}
