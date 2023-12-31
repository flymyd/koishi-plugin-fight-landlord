// 魔改斗地主的随机事件
import {cardHeapGenerator, shuffleCards, sortCards} from "../core/CardUtils";
import {CONST} from "./CONST";
import {RoomTypes} from "../types/RoomTypes";
import {getAnotherPlayer} from "./GameUtils";


export const modernEventGenerator = async (ctx, room: RoomTypes, currentPlayerId, randomRatio) => {
  const logicArray = [
    changeMaximumCardToTwo, showRandomPlayerCard, lostRandomCard, sunshine,
    swapCard, swapIdentities, swapAllCard, reversePlayerList, midiFestival, getRandom34
  ];
  const randomIndex = getRandomIndex(logicArray.length);
  const randomLogic = logicArray[randomIndex];
  const randomTrigger = Math.random()
  if (randomTrigger < randomRatio) {
    return await randomLogic(ctx, room, currentPlayerId);
  } else return '';
}

function getRandomIndex(length: number): number {
  return Math.floor(Math.random() * length);
}

// 以小博大-最大的手牌变为2
async function changeMaximumCardToTwo(ctx, room: RoomTypes, currentPlayerId) {
  let res = '触发事件：以小博大！\n当前玩家最大的一张手牌变为2。'
  const currentPlayer = {...room.playerDetail[currentPlayerId], id: currentPlayerId}
  // 当前手牌
  const originalHand = JSON.parse(JSON.stringify(currentPlayer.cards));
  sortCards(originalHand)
  originalHand[0].cardValue = 13
  originalHand[0].cardName = '2'
  room.playerDetail[currentPlayerId].cards = [...originalHand]
  await ctx.database.upsert(CONST.DB, [room])
  res += '\n请重新出牌！'
  return res;
}

// 昙花一现-随机让一位玩家明牌
async function showRandomPlayerCard(ctx, room: RoomTypes, currentPlayerId) {
  let res = '触发事件：昙花一现！\n随机让一位玩家明牌。'
  const randomIndex = Math.floor(Math.random() * room.playerList.length);
  const chosenPlayerDetail = room.playerDetail[room.playerList[randomIndex]]
  res += `幸运玩家${chosenPlayerDetail.name}的手牌是: \n`
  res += chosenPlayerDetail.cards.map(o => o.cardName).join(' ')
  res += '\n请重新出牌！'
  return res;
}


// 散财童子-当手牌数大于1时，随机丢掉一张手牌
async function lostRandomCard(ctx, room: RoomTypes, currentPlayerId) {
  let res = '触发事件：散财童子！\n当前玩家手牌数大于1时，随机丢掉一张手牌。';
  const currentPlayer = {...room.playerDetail[currentPlayerId], id: currentPlayerId}
  // 当前手牌
  const originalHand = JSON.parse(JSON.stringify(currentPlayer.cards));
  if (originalHand.length > 1) {
    // 生成一个随机索引，表示要丢掉的手牌的位置
    const randomIndex = Math.floor(Math.random() * originalHand.length);
    // 获取要丢掉的手牌
    const cardToBeLost = originalHand[randomIndex];
    // 从手牌中移除要丢掉的牌
    originalHand.splice(randomIndex, 1);
    // 更新房间详情中的手牌信息
    room.playerDetail[currentPlayerId].cards = [...originalHand]
    await ctx.database.upsert(CONST.DB, [room])
    // 返回触发事件的消息以及丢掉的手牌信息
    res += `\n玩家${currentPlayer.name}丢掉了一张手牌：${cardToBeLost.cardName}`;
    res += '\n请重新出牌！'
  } else res = ''
  return res;
}

// 阳光普照-每人获得一张牌
async function sunshine(ctx, room: RoomTypes, currentPlayerId) {
  let res = '触发事件：阳光普照！\n每人随机获得一张牌。'
  const newCards = cardHeapGenerator();
  const tempCards = shuffleCards(newCards);
  const giveLists = room.playerList.map((playerId, index) => {
    room.playerDetail[playerId].cards.push(tempCards[index])
    sortCards(room.playerDetail[playerId].cards)
    return {
      name: room.playerDetail[playerId].name,
      card: tempCards[index].cardName,
    }
  })
  giveLists.forEach(info => {
    res += `玩家 ${info.name} 获得了 ${info.card}\n`
  })
  await ctx.database.upsert(CONST.DB, [room])
  res += '\n请重新出牌！'
  return res;
}

// 偷天换日-将一名玩家的一张手牌和自己的一张手牌交换
async function swapCard(ctx, room: RoomTypes, currentPlayerId) {
  let res = '触发事件：偷天换日！\n将一名玩家的一张手牌和自己的一张手牌交换。';
  // 当前玩家
  const currentPlayer = {...room.playerDetail[currentPlayerId], id: currentPlayerId}
  // 当前玩家的手牌
  const originalHand = JSON.parse(JSON.stringify(currentPlayer.cards));
  // 选择一个其它玩家
  const distPlayerId = getAnotherPlayer(room, currentPlayerId)
  // 目标玩家
  const distPlayer = {...room.playerDetail[distPlayerId], id: distPlayerId}
  // 目标玩家的手牌
  const distHand = JSON.parse(JSON.stringify(distPlayer.cards));
  // 生成一个随机索引，表示要抽走该玩家的手牌的位置
  const randomCardIndex1 = Math.floor(Math.random() * originalHand.length);
  // 生成一个随机索引，表示要抽走目标玩家的手牌的位置
  const randomCardIndex2 = Math.floor(Math.random() * distHand.length);
  // 获取待换手牌
  const cardToBeSwap1 = JSON.parse(JSON.stringify(originalHand[randomCardIndex1]));
  const cardToBeSwap2 = JSON.parse(JSON.stringify(distHand[randomCardIndex2]));
  // 从手牌中移除要丢掉的牌
  originalHand.splice(randomCardIndex1, 1);
  distHand.splice(randomCardIndex2, 1);
  // 添加新手牌并排序
  originalHand.push(cardToBeSwap2)
  distHand.push(cardToBeSwap1)
  sortCards(originalHand)
  sortCards(distHand)
  // 更新房间详情中的手牌信息
  room.playerDetail[currentPlayerId].cards = [...originalHand]
  room.playerDetail[distPlayerId].cards = [...distHand]
  await ctx.database.upsert(CONST.DB, [room])
  // 返回触发事件的消息以及交换的手牌信息
  res += `\n玩家${currentPlayer.name}得到了一张手牌：${cardToBeSwap2.cardName}`;
  res += `\n玩家${distPlayer.name}得到了一张手牌：${cardToBeSwap1.cardName}`;
  res += '\n请重新出牌！'
  return res;
}

// 乾坤大挪移-将一名玩家的全部手牌和自己的全部手牌交换
async function swapAllCard(ctx, room: RoomTypes, currentPlayerId) {
  let res = '触发事件：乾坤大挪移！\n将一名玩家的全部手牌和自己的全部手牌交换。';
  // 当前玩家
  const currentPlayer = {...room.playerDetail[currentPlayerId], id: currentPlayerId}
  // 当前玩家的手牌
  const originalHand = JSON.parse(JSON.stringify(currentPlayer.cards));
  // 选择一个其它玩家
  const distPlayerId = getAnotherPlayer(room, currentPlayerId)
  // 目标玩家
  const distPlayer = {...room.playerDetail[distPlayerId], id: distPlayerId}
  // 目标玩家的手牌
  const distHand = JSON.parse(JSON.stringify(distPlayer.cards));
  // 更新房间详情中的手牌信息
  room.playerDetail[currentPlayerId].cards = [...distHand]
  room.playerDetail[distPlayerId].cards = [...originalHand]
  await ctx.database.upsert(CONST.DB, [room])
  // 返回触发事件的消息以及交换的手牌信息
  res += `\n玩家${currentPlayer.name}和玩家${distPlayer.name}互换了手牌。`;
  res += '\n请重新出牌！'
  return res;
}

// 狸猫换太子-将一名玩家的身份和自己的身份交换
async function swapIdentities(ctx, room: RoomTypes, currentPlayerId) {
  let res = '触发事件：狸猫换太子！\n将一名玩家的身份和自己的身份交换。';
  // 当前玩家
  const currentPlayer = JSON.parse(JSON.stringify({...room.playerDetail[currentPlayerId], id: currentPlayerId}))
  // 选择一个其它玩家
  const distPlayerId = getAnotherPlayer(room, currentPlayerId)
  // 目标玩家
  const distPlayer = JSON.parse(JSON.stringify({...room.playerDetail[distPlayerId], id: distPlayerId}))
  // 更新房间详情中的身份信息
  room.playerDetail[currentPlayerId].isLord = distPlayer.isLord;
  room.playerDetail[distPlayerId].isLord = currentPlayer.isLord;
  await ctx.database.upsert(CONST.DB, [room])
  // 返回触发事件的消息以及交换的手牌信息
  res += `\n玩家${currentPlayer.name}的身份变为：${distPlayer.isLord ? '地主' : '农民'}`;
  res += `\n玩家${distPlayer.name}的身份变为：${currentPlayer.isLord ? '地主' : '农民'}`;
  res += '\n请重新出牌！'
  return res;
}

// 反转了-翻转出牌顺序
async function reversePlayerList(ctx, room: RoomTypes, currentPlayerId) {
  let res = '触发事件：反转了！\n翻转出牌顺序。'
  room.playerList.reverse()
  await ctx.database.upsert(CONST.DB, [room])
  res += '\n请重新出牌！'
  return res;
}

// 摇滚狂欢-每名手牌数大于1的玩家均失去点数最大的一张手牌
async function midiFestival(ctx, room: RoomTypes, currentPlayerId) {
  let res = '触发事件：摇滚狂欢！\n每名手牌数大于1的玩家均失去点数最大的一张手牌。';
  const toShift = []
  room.playerList.forEach(id => {
    // 当前玩家的手牌
    if (room.playerDetail[id].cards.length > 1) {
      const shift = room.playerDetail[id].cards.shift()
      toShift.push({name: room.playerDetail[id].name, cardName: shift.cardName})
    }
  })
  await ctx.database.upsert(CONST.DB, [room])
  // 返回触发事件的消息以及交换的手牌信息
  toShift.forEach(obj => {
    res += `\n玩家${obj.name}丢掉了一张手牌：${obj.cardName}`
  })
  res += '\n请重新出牌！'
  return res;
}

// 三山四海-当前玩家随机获得1~4张3或1~4张4
async function getRandom34(ctx, room: RoomTypes, currentPlayerId) {
  let res = '触发事件：三山四海！\n当前玩家随机获得1~4张3或1~4张4。';
  const currentPlayer = {...room.playerDetail[currentPlayerId], id: currentPlayerId}
  // 当前手牌
  let originalHand = JSON.parse(JSON.stringify(currentPlayer.cards));
  const newCards = cardHeapGenerator();
  const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const randomSelection = () => {
    const firstNumber = getRandomNumber(3, 4);
    const secondNumber = getRandomNumber(1, 4);
    return [firstNumber, secondNumber];
  };
  const [selectedNumber1, selectedNumber2] = randomSelection();
  const pointCards = newCards.filter(card => card.cardName == selectedNumber1)
  const toGiveCards = pointCards.slice(0, selectedNumber2);
  originalHand = [...originalHand, ...toGiveCards]
  sortCards(originalHand)
  // 更新房间详情中的手牌信息
  room.playerDetail[currentPlayerId].cards = [...originalHand]
  await ctx.database.upsert(CONST.DB, [room])
  // 返回触发事件的消息以及丢掉的手牌信息
  res += `\n玩家${currentPlayer.name}获得了手牌：${toGiveCards.map(card => card.cardName).join(' ')}`;
  res += '\n请重新出牌！'
  return res;
}
