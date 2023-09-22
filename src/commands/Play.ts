import {Context, Logger, segment} from "koishi";
import {getJoinedRoom, getSpecifiedPlayer} from "../utils/GameUtils";
import {RoomTypes} from "../types/RoomTypes";
import {CONST} from "../utils/CONST";
import {parseArrToCards, sortCards} from "../core/CardUtils";
import {canBeatPreviousCards, getCardType} from "../core/JudgeUtils";
import {addPrefix} from "../utils/SponsorUtils";
import {modernEventGenerator} from "../utils/EventUtils";

export const play = async (ctx: Context, _, logger: Logger, card: string) => {
  let {userId, username} = _.session.author;
  // 为特定群友添加头衔
  let userNamePrefix = addPrefix(userId);
  username = userNamePrefix + username;
  const joinedList = await getJoinedRoom(ctx, userId);
  if (!joinedList) {
    return '你还没有加入房间。'
  } else {
    const room = joinedList[0] as RoomTypes;
    if (!room.status) {
      return '你所在的房间尚未开始游戏。'
    }
    const {playerDetail, prevStats, nextPlayerId, usedCard} = room;
    // 获取上家、本家、下家信息
    const prevPlayer = await getSpecifiedPlayer(ctx, userId, room.id, -1)
    const currentPlayer = {...playerDetail[userId], id: userId}
    const nextPlayer = await getSpecifiedPlayer(ctx, userId, room.id, 1)
    // 是否轮到当前用户出牌
    const canCurrentUserPlay = currentPlayer.id == nextPlayerId;
    if (canCurrentUserPlay) {
      if (card) {
        card = card.toUpperCase();
        // 本轮跳过
        if (card.includes('过')) {
          room.nextPlayerId = nextPlayer.id;
          await ctx.database.upsert(CONST.DB, [room])
          return `${username} 跳过本轮，请下家 ${nextPlayer.name}：${segment.at(nextPlayer.id)} 出牌。`
        }
        // 当前玩家的手牌
        const originalHand = JSON.parse(JSON.stringify(currentPlayer.cards));
        // 分割用户输入的待出牌
        const splicePattern = /[2-9]|10|[JQKA]|大王|小王/gi;
        let currentCardArr: Array<any> = card.match(splicePattern) || [];
        // 判断输入有效性
        let isCurrentCardArrValid = currentCardArr
          .every(v => ['大王', '小王', 'J', 'Q', 'K', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10']
            .includes(v));
        if (isCurrentCardArrValid) {
          // 把待出的牌恢复成存储结构的牌组然后排序
          currentCardArr = parseArrToCards(currentCardArr);
          sortCards(currentCardArr)
          // 堂子牌
          const prevCard = JSON.parse(JSON.stringify(prevStats.cards))
          sortCards(prevCard)
          // 判断手牌是否包含待出的牌
          const containsPlayedCards = currentCardArr.every(playedCard => {
            const matchingCardIndex = originalHand.findIndex(handCard => handCard.cardValue === playedCard.cardValue);
            if (matchingCardIndex !== -1) {
              originalHand.splice(matchingCardIndex, 1);
              return true;
            } else {
              return false;
            }
          });
          if (!containsPlayedCards) {
            return '你不能出自己没有的牌。'
          }
          // 魔改斗地主的触发事件逻辑
          if (room.mode == 1) {
            const modernEvent = await modernEventGenerator(ctx, room, currentPlayer.id);
            if (modernEvent) {
              return modernEvent;
            }
          }
          // 出牌逻辑
          let canBeat;
          if (prevCard.length < 1 || prevStats.playerId == userId) {
            // 第一手随便出。其他人都过，轮到自己也随便出
            canBeat = getCardType(currentCardArr) != 13;
          } else canBeat = canBeatPreviousCards(currentCardArr, prevCard)
          if (!canBeat) {
            return '你所出的牌不大于上家或不符合出牌规则。'
          } else {
            // 出牌成功逻辑：播报剩余手牌, 刷新对局信息
            const res = [];
            res.push(`出牌成功！堂子的牌面是: ${currentCardArr.map(o => o.cardName).join(' ')}`)
            res.push(`${username} 剩余手牌数: ${originalHand.length}`)
            res.push(`请下家 ${nextPlayer.name}：${segment.at(nextPlayer.id)} 出牌。`)
            // 更新弃牌堆
            room.usedCard = [...room.usedCard, ...currentCardArr]
            // 更新堂子
            room.prevStats.playerId = currentPlayer.id
            room.prevStats.playerName = currentPlayer.name
            room.prevStats.cards = [...currentCardArr]
            // 更新下家指针
            room.nextPlayerId = nextPlayer.id
            // 把打出的牌移走
            const newHand = originalHand.filter(card => {
              return !currentCardArr.some(playedCard => playedCard.cardValue === card.cardValue && playedCard.cardColor == card.cardColor);
            });
            room.playerDetail[userId].cards = [...newHand]
            // 如果该玩家手牌剩余0则播报该玩家胜利，清空对局详情并将对局设置为准备中
            if (newHand.length < 1) {
              // 队友列表
              const member = room.playerList
                .filter(id => playerDetail[id].isLord === currentPlayer.isLord)
                .map(id => playerDetail[id].name);
              // 清空对局信息
              room.status = 0;
              room.prevStats = {cards: [], playerId: "", playerName: ""}
              room.nextPlayerId = ""
              room.usedCard = []
              room.playerList.forEach(id => {
                room.playerDetail[id].isLord = false;
                room.playerDetail[id].cards = [];
              })
              await ctx.database.upsert(CONST.DB, [room])
              return `${currentPlayer.isLord ? '地主' : '农民'} ${member.join("、")} 获胜！`
            } else {
              await ctx.database.upsert(CONST.DB, [room])
              return res.join("\n");
            }
          }
        } else return '请输入有效的手牌。只能输入2~9的数字、大小写字母J、Q、K、A及"大王"、"小王"。'
      } else return '请输入要出的牌或输入"过"以跳过本轮。'
    } else return '还没轮到你出牌。'
  }
}
