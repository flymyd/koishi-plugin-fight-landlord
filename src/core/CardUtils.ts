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
 * 生成一副牌 (标准54张)
 */
export const cardHeapGenerator = () => {
  return [
    {cardValue: 14, cardName: '小王', cardColor: 'A'},
    {cardValue: 15, cardName: '大王', cardColor: 'A'},
    ...Array.from({length: 13 * 4}, (_, index) => {
      const cardValue = Math.ceil((index + 1) / 4);
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

      if (index % 4 === 0) {
        cardColor = 'A';
      } else if (index % 4 === 1) {
        cardColor = 'B';
      } else if (index % 4 === 2) {
        cardColor = 'C';
      } else if (index % 4 === 3) {
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
 */
export const dealCards = (arr: Array<CardTypes>) => {
  let card1 = arr.slice(0, 17);
  let card2 = arr.slice(17, 34);
  let card3 = arr.slice(34, 51);
  let holeCards = arr.slice(51, 54);
  return {card1, card2, card3, holeCards};
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

