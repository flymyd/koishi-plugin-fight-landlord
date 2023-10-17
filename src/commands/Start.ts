import {Context, h, Logger, Random, segment} from "koishi";
import {getJoinedRoom} from "../utils/GameUtils";
import {initHand, sortCards} from "../core/CardUtils";
import {CONST} from "../utils/CONST";
import {StageDict, StageInfo, StageTypes} from "../types/StageTypes";

type EnumKeys<T> = Exclude<keyof T, number>;

function getRandomEnumValue<T>(enumeration: T): string {
  const keys: EnumKeys<typeof StageTypes>[] = Object.keys(StageTypes).filter(key => isNaN(Number(key))) as EnumKeys<typeof StageTypes>[];
  const randomIndex = Math.floor(Math.random() * keys.length);
  return keys[randomIndex];
}

export const start = async (ctx: Context, _, logger: Logger) => {
  let {userId, username} = _.session.author;
  const joinedList = await getJoinedRoom(ctx, userId);
  if (!joinedList) {
    return '你还没有加入房间。'
  } else {
    const room = joinedList[0]
    const playerNum = room.playerList.length;
    if (userId != room.playerList[0]) {
      return '你不是房主，无法开始游戏。'
    } else if (room.status) {
      return `房间 ${room.id} 正在游戏中。`
    } else if (playerNum < 3) {
      return `当前房间人数为 ${playerNum} , 至少需要3人才能开始游戏。`
    } else {
      room.status = 1;
      // 根据房间人数来做牌
      const toShuffleCards = initHand(playerNum)
      // 选出地主
      let lordNum = 1;
      if (playerNum === 4 || playerNum === 5) {
        lordNum = 2;
      } else if (playerNum === 6) {
        lordNum = 3
      }
      const lordList = Random.pick(room.playerList, lordNum)
      lordList.forEach((id: string) => {
        room.playerDetail[id].isLord = true;
      })
      let res = []
      // 当房间模式为地狱之旅时，随机一个场景
      if (room.mode === 3) {
        const randomStage = getRandomEnumValue(StageTypes);
        room.stageType = randomStage;
        res.push(`本局场景是：${StageDict[randomStage]}`)
        res.push(`场景介绍：${StageInfo[randomStage]}`)
      }
      // 发牌：3人房发3张地主牌，5人房给每个地主发4张地主牌，4、6人房没地主牌
      const holeCardsRecord = [];  // 发出的地主牌的记录器
      room.playerList.forEach((id: string, index: number) => {
        let cards = toShuffleCards.cards[index];
        if (room.playerDetail[id].isLord) {
          if (playerNum === 3) {
            holeCardsRecord.push(toShuffleCards.holeCards)
            cards = [...cards, ...toShuffleCards.holeCards]
          } else if (playerNum === 5) {
            const holeCards = toShuffleCards.holeCards.splice(0, 4)
            holeCardsRecord.push(holeCards)
            cards = [...cards, ...holeCards]
          }
        }
        sortCards(cards);
        room.playerDetail[id] = {...room.playerDetail[id], cards}
      })
      // 初始信息 堂主和下家ID都设置为第一位地主的ID
      const firstLordId = room.playerList.find(player => room.playerDetail[player]?.isLord);
      room.prevStats.playerId = firstLordId;
      room.prevStats.playerName = room.playerDetail[firstLordId].name;
      room.nextPlayerId = firstLordId;
      // 播报地主和对应地主牌的信息
      const lordNameList = room.playerList.filter(id => room.playerDetail[id].isLord)
        .map(id => room.playerDetail[id].name)
      const peasantNameList = room.playerList.filter(id => !room.playerDetail[id].isLord)
        .map(id => room.playerDetail[id].name)
      res.push(`本局地主是: ${lordNameList.map(obj => obj).join('、')}`)
      res.push(`本局农民是: ${peasantNameList.map(obj => obj).join('、')}`)
      if (holeCardsRecord.length > 0) {
        res.push(`地主牌是: ${holeCardsRecord.map(obj => obj.map(card => card.cardName).join("、")).join(" 和 ")}`)
      }
      res.push(`请 ${room.playerDetail[firstLordId].name}: ${segment.at(firstLordId)} 出牌`)
      try {
        await ctx.database.upsert(CONST.DB, [room])
        return h.parse(res.join("\n"));
      } catch (e) {
        logger.error(e)
        return '初始化游戏失败，未知错误。'
      }
    }
  }
}
