import {Context, Logger} from "koishi";
import {getJoinedRoom} from "../utils/GameUtils";
import {RoomTypes} from "../types/RoomTypes";

export const play = async (ctx: Context, _, logger: Logger, card: string) => {
  let {userId, username} = _.session.author;
  const joinedList = await getJoinedRoom(ctx, userId);
  if (!joinedList) {
    return '你还没有加入房间。'
  } else {
    const room = joinedList[0] as RoomTypes;
    if (!room.status) {
      return '你所在的房间尚未开始游戏'
    }
    const {playerDetail, prevStats, usedCard} = room;
    // TODO
  }
}
