import {Context, Logger} from "koishi";
import {RoomTypesExtends} from "../types/RoomTypes";
import {CONST} from "./CONST";

/**
 * 重置数据表
 * @param ctx
 */
export const resetDB = async (ctx: Context) => {
  try {
    await ctx.database.drop(CONST.DB)
    await ctx.model.extend(CONST.DB, RoomTypesExtends)
  } catch (e) {
    const logger = new Logger(CONST.LOGGER)
    logger.error(`删除数据表 ${CONST.DB} 失败！`)
  }
}

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
