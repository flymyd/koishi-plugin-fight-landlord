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
    await ctx.model.extend(CONST.DB, RoomTypesExtends, {primary: 'id', autoInc: true})
  } catch (e) {
    const logger = new Logger(CONST.LOGGER)
    logger.error(`删除数据表 ${CONST.DB} 失败！`)
  }
}


