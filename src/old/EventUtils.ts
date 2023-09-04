// 魔改斗地主的随机事件
import {genCards, initCards, sortCards} from "./CardUtils";

export const modernEventGenerator = async (ctx, room, roomDetail, currentPlayerIndex) => {
  const logicArray = [changeMaximumCardToTwo, showRandomPlayerCard, lostRandomCard, sunshine];
  const randomIndex = getRandomIndex(logicArray.length);
  const randomLogic = logicArray[randomIndex];
  const randomTrigger = Math.random()
  if (randomTrigger < 0.1) {
    return await randomLogic(ctx, room, roomDetail, currentPlayerIndex);
  } else return '';
}

function getRandomIndex(length: number): number {
  return Math.floor(Math.random() * length);
}

// 以小博大-最大的手牌变为2
async function changeMaximumCardToTwo(ctx, room, roomDetail, currentPlayerIndex) {
  let res = '触发事件：以小博大！\n当前玩家最大的一张手牌变为2。'
  // 当前手牌
  const originalHand: any = roomDetail['card' + currentPlayerIndex];
  sortCards(originalHand)
  originalHand[0].cardValue = 13
  originalHand[0].cardName = '2'
  await ctx.database.upsert('fightLandlordDetail', [roomDetail])
  res += '\n请重新出牌！'
  return res;
}

// 昙花一现-随机让一位玩家明牌
async function showRandomPlayerCard(ctx, room, roomDetail, currentPlayerIndex) {
  let res = '触发事件：昙花一现！\n随机让一位玩家明牌。'
  const randomIndex = Math.floor(Math.random() * 3) + 1;
  res += `幸运玩家${room['player' + randomIndex + 'Name']}的手牌是: \n`
  res += roomDetail['card' + randomIndex].map(o => o.cardName).join(' ')
  res += '\n请重新出牌！'
  return res;
}


// 散财童子-当手牌数大于1时，随机丢掉一张手牌
async function lostRandomCard(ctx, room, roomDetail, currentPlayerIndex) {
  let res = '触发事件：散财童子！\n当前玩家手牌数大于1时，随机丢掉一张手牌。';
  // 当前手牌
  const originalHand = roomDetail['card' + currentPlayerIndex];
  if (originalHand.length > 1) {
    // 生成一个随机索引，表示要丢掉的手牌的位置
    const randomIndex = Math.floor(Math.random() * originalHand.length);
    // 获取要丢掉的手牌
    const cardToBeLost = originalHand[randomIndex];
    // 从手牌中移除要丢掉的牌
    originalHand.splice(randomIndex, 1);
    // 更新房间详情中的手牌信息
    roomDetail['card' + currentPlayerIndex] = originalHand;
    await ctx.database.upsert('fightLandlordDetail', [roomDetail])
    // 返回触发事件的消息以及丢掉的手牌信息
    res += `\n玩家${room['player' + currentPlayerIndex + 'Name']}丢掉了一张手牌：${cardToBeLost.cardName}`;
    res += '\n请重新出牌！'
  } else res = ''
  return res;
}

// 阳光普照-每人获得一张牌
async function sunshine(ctx, room, roomDetail, currentPlayerIndex) {
  let res = '触发事件：阳光普照！\n每人随机获得一张牌。'
  const tempCards = initCards();
  const c1 = tempCards.card1[0];
  const c2 = tempCards.card2[0];
  const c3 = tempCards.card3[0];
  roomDetail.card1.push(c1)
  roomDetail.card2.push(c2)
  roomDetail.card3.push(c3)
  sortCards(roomDetail.card1)
  sortCards(roomDetail.card2)
  sortCards(roomDetail.card3)
  res += `玩家 ${room.player1Name} 获得了${c1.cardName}\n`
  res += `玩家 ${room.player2Name} 获得了${c2.cardName}\n`
  res += `玩家 ${room.player3Name} 获得了${c3.cardName}\n`
  await ctx.database.upsert('fightLandlordDetail', [roomDetail])
  res += '\n请重新出牌！'
  return res;
}

