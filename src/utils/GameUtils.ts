import {Context} from "koishi";
import {CONST} from "./CONST";

/**
 * 查询用户是否已经加入房间
 * @param ctx
 * @param userId
 */
export const isJoinedRoom = async (ctx: Context, userId: string) => {
  const roomList = await ctx.database.get(CONST.DB, {})
  const joinedList = roomList.filter(obj => obj.playerList.includes(userId))
  if (joinedList.length > 0) {
    return joinedList;
  } else return false;
}
