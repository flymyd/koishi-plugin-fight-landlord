import {Context, Logger} from "koishi";
import {getJoinedRoom} from "../utils/GameUtils";
import {CONST} from "../utils/CONST";

export const disband = async (ctx: Context, _, logger: Logger) => {
  let {userId, username} = _.session.author;
  const joinedList = await getJoinedRoom(ctx, userId);
  if (!joinedList) {
    return '你还没有加入房间。'
  } else {
    const room = joinedList[0]
    if (userId != room.playerList[0]) {
      return '你不是房主，无法解散房间。'
    } else {
      // 解散
      await ctx.database.remove(CONST.DB, [room.id])
      return `解散房间 ${room.id} 成功。`
    }
  }
}
