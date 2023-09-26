import {generateUUID} from "../utils/CommonUtils";
import {CardTypes} from "../types/CardTypes";

/**
 * 把牌从大到小排序
 * @param arr 牌组
 */
export function sortCards(arr) {
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

/**
 * 生成牌堆
 * @param haveJoker 保留大小王
 * @param isHalf 是否生成半副牌 (除大小王以外的)
 */
export const cardHeapGenerator = (haveJoker: boolean = true, isHalf: boolean = false): Array<CardTypes> => {
  const joker = haveJoker ?
    [
      {cardValue: 14, cardName: '小王', cardColor: 'A', cardUUID: generateUUID()},
      {cardValue: 15, cardName: '大王', cardColor: 'A', cardUUID: generateUUID()}
    ] : []
  const step = isHalf ? 2 : 4
  return [
    ...joker,
    ...Array.from({length: 13 * step}, (_, index) => {
      const cardValue = Math.ceil((index + 1) / step);
      let cardName = String(cardValue + 2);
      let cardColor;
      if (cardName == '11') {
        cardName = 'J';
      } else if (cardName == '12') {
        cardName = 'Q';
      } else if (cardName == '13') {
        cardName = 'K';
      } else if (cardName == '14') {
        cardName = 'A';
      } else if (cardName == '15') {
        cardName = '2';
      }

      if (index % step === 0) {
        cardColor = 'A';
      } else if (index % step === 1) {
        cardColor = 'B';
      } else if (index % step === 2) {
        cardColor = 'C';
      } else if (index % step === 3) {
        cardColor = 'D';
      }
      const cardUUID = generateUUID()
      return {cardValue, cardName, cardColor, cardUUID};
    })
  ];
}

/**
 * 洗牌
 * @param arr 牌组
 */
export const shuffleCards = (arr: Array<CardTypes>) => {
  arr = JSON.parse(JSON.stringify(arr));
  for (const key in arr) {
    let index = parseInt(String(Math.random() * arr.length));
    [arr[key], arr[index]] = [arr[index], arr[key]];
  }
  return arr;
}

/**
 * 发牌
 * @param arr 牌组
 * @param playerNum 玩家数
 * @param holeCardsNum 底牌数
 */
export const dealCards = (arr: Array<CardTypes>, playerNum: number = 3, holeCardsNum: number = 3) => {
  const result: {
    cards: Array<Array<CardTypes>>,
    holeCards: Array<CardTypes>,
  } = {
    cards: [],
    holeCards: []
  }
  const eachNum = Math.floor((arr.length - holeCardsNum) / playerNum);
  for (let i = 0; i < playerNum; i++) {
    let cards = arr.slice(i * eachNum, (i + 1) * eachNum)
    result.cards.push(cards)
  }
  if (holeCardsNum) {
    result.holeCards = arr.slice(arr.length - holeCardsNum, arr.length);
  }
  return result;
}

/**
 * 把玩家输入的牌组转为标准牌型
 * @param cardArr 牌组
 */
export const parseArrToCards = (cardArr: Array<string>) => {
  return cardArr.map(o => {
    let cardValue;
    if (o == '大王') {
      cardValue = 15;
    } else if (o == '小王') {
      cardValue = 14;
    } else if (o == '2') {
      cardValue = 13
    } else if (o == 'A') {
      cardValue = 12
    } else if (o == 'K') {
      cardValue = 11
    } else if (o == 'Q') {
      cardValue = 10
    } else if (o == 'J') {
      cardValue = 9
    } else cardValue = Number(o) - 2;
    return {cardValue, cardName: o}
  })
}

/**
 * 分组统计同点数的牌
 * @param arr
 */
export function classifyAndCount(arr: CardTypes[]) {
  let countMap: { [key: number]: number } = {};
  let result: { [key: number]: number[] } = {};
  arr.forEach((item) => {
    if (countMap[item.cardValue]) {
      countMap[item.cardValue]++;
    } else {
      countMap[item.cardValue] = 1;
    }
  });
  for (let key in countMap) {
    if (result[countMap[key]]) {
      result[countMap[key]].push(parseInt(key));
    } else {
      result[countMap[key]] = [parseInt(key)];
    }
  }
  return result;
}

/**
 * 计算每个点数的出现次数
 * @param cards
 */
export function countCards(cards: CardTypes[]): { [cardValue: number]: number } {
  const cardCountMap: { [cardValue: number]: number } = {};
  for (const card of cards) {
    if (cardCountMap.hasOwnProperty(card.cardValue)) {
      cardCountMap[card.cardValue]++;
    } else {
      cardCountMap[card.cardValue] = 1;
    }
  }
  return cardCountMap;
}

/**
 * 根据玩家数量初始化手牌
 * @param playerNum
 */
export function initHand(playerNum: number): { cards: Array<Array<CardTypes>>, holeCards: Array<CardTypes> } {
  // 拿牌 洗牌 切分 分别排序 赋值
  let originalCardHeap: Array<CardTypes> = []
  if (playerNum === 3) {
    originalCardHeap = cardHeapGenerator();
  } else if (playerNum === 4) {
    originalCardHeap = [...cardHeapGenerator(), ...cardHeapGenerator(false, true)]
  } else if (playerNum === 5) {
    originalCardHeap = [...cardHeapGenerator(), ...cardHeapGenerator()]
  } else {
    originalCardHeap = [...cardHeapGenerator(), ...cardHeapGenerator(), ...cardHeapGenerator()]
  }
  let shuffledCardHeap = shuffleCards(originalCardHeap);
  let toSortCards;
  if (playerNum === 3) {
    toSortCards = dealCards(shuffledCardHeap, playerNum, 3)
  } else if (playerNum === 5) {
    toSortCards = dealCards(shuffledCardHeap, playerNum, 8)
  } else {
    toSortCards = dealCards(shuffledCardHeap, playerNum, 0)
  }
  toSortCards.cards.forEach(cards => sortCards(cards))
  // 地主牌要等分完了再洗
  // if (toSortCards.holeCards.length > 0) {
  //   sortCards(toSortCards.holeCards)
  // }
  return toSortCards;
}

