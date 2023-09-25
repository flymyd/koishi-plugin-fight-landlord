// 魔改斗地主的随机事件
import {cardHeapGenerator, shuffleCards, sortCards} from "../core/CardUtils";
import {CONST} from "./CONST";
import {RoomTypes} from "../types/RoomTypes";


export const modernEventGenerator = async (ctx, room: RoomTypes, currentPlayerId) => {
  const logicArray = [
    changeMaximumCardToTwo, showRandomPlayerCard, lostRandomCard, sunshine, swapCard, swapIdentities
  ];
  const randomIndex = getRandomIndex(logicArray.length);
  const randomLogic = logicArray[randomIndex];
  const randomTrigger = Math.random()
  if (randomTrigger < 0.1) {
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
  // 生成一个随机索引，表示目标玩家
  const randomPlayerIndex = Math.floor(Math.random() * room.playerList.length);
  const distPlayerId = room.playerList[randomPlayerIndex];
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

// 狸猫换太子-将一名玩家的身份和自己的身份交换
async function swapIdentities(ctx, room: RoomTypes, currentPlayerId) {
  let res = '触发事件：狸猫换太子！\n将一名玩家的身份和自己的身份交换。';
  // 当前玩家
  const currentPlayer = JSON.parse(JSON.stringify({...room.playerDetail[currentPlayerId], id: currentPlayerId}))
  // 生成一个随机索引，表示目标玩家
  const randomPlayerIndex = Math.floor(Math.random() * room.playerList.length);
  const distPlayerId = room.playerList[randomPlayerIndex];
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
