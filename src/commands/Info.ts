import {Context, Logger} from "koishi";
import {getJoinedRoom} from "../utils/GameUtils";
import {RoomTypes} from "../types/RoomTypes";
import {sortCards} from "../core/CardUtils";

export const info = async (ctx: Context, _, logger: Logger) => {
  let {userId, username} = _.session.author;
  const joinedList = await getJoinedRoom(ctx, userId);
  if (!joinedList) {
    return '你还没有加入房间。'
  } else {
    const room = joinedList[0] as RoomTypes;
    if (!room.status) {
      return '你所在的房间尚未开始游戏。'
    }
    const {playerDetail, prevStats, usedCard} = room;
    // 当前用户信息
    const currentDetail = playerDetail[userId];
    // 记牌器
    sortCards(usedCard)
    const groupedCards = usedCard.reduce((acc, card) => {
      if (acc[card.cardName]) {
        acc[card.cardName]++;
      } else {
        acc[card.cardName] = 1;
      }
      return acc;
    }, {});
    const recorder = Object.keys(groupedCards).length > 0 ? Object.keys(groupedCards).map(k => k + "*" + groupedCards[k]).join(" ") : '无'
    const results = [];
    // 队友列表
    const member = room.playerList.filter(id => (playerDetail[id].isLord === currentDetail.isLord) && id != userId);
    results.push(`你的身份是：${currentDetail.isLord ? '地主' : '农民'}`)
    results.push(`你的队友是：${member.length > 0 ? member.join("、") : '无'}`)
    results.push(`上家是：${prevStats.playerName}`)
    results.push(`上家出牌：${prevStats.cards.length > 0 ? prevStats.cards.map(card => card.cardName).join(" ") : '无'}`)
    results.push(`记牌器: ${recorder}`)
    results.push(`手牌: ${currentDetail.cards.map(card => card.cardName).join(" ")}`)
    return results.join('\n');
  }
}
