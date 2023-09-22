// 魔改斗地主的随机事件
import {cardHeapGenerator, shuffleCards, sortCards} from "../core/CardUtils";
import {CONST} from "./CONST";
import {RoomTypes} from "../types/RoomTypes";


export const modernEventGenerator = async (ctx, room: RoomTypes, currentPlayerId) => {
  const logicArray = [changeMaximumCardToTwo, showRandomPlayerCard, lostRandomCard, sunshine];
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
  const randomIndex = Math.floor(Math.random() * room.playerList.length) + 1;
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
  const tempCards = cardHeapGenerator();
  shuffleCards(tempCards);
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

