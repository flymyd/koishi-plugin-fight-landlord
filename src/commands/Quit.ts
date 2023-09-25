import {Context, Logger} from "koishi";
import {getJoinedRoom} from "../utils/GameUtils";
import {CONST} from "../utils/CONST";

export const quit = async (ctx: Context, _, logger: Logger) => {
  let {userId, username} = _.session.author;
  const joinedList = await getJoinedRoom(ctx, userId);
  let res = [];
  if (joinedList) {
    try {
      joinedList.forEach(room => {
        if (room.status) {
          res.push(`房间 ${room.id} 正在游戏中, 退出失败。`)
          return res.join("\n")
        } else {
          room.playerList = room.playerList.filter(id => id != userId);
          delete room.playerDetail[userId]
        }
      })
      // 最后一名玩家退出则直接销毁房间
      const needDestroyRoomList = joinedList.filter(room => room.playerList.length < 1);
      await ctx.database.remove(CONST.DB, needDestroyRoomList.map(room => room.id))
      if (needDestroyRoomList.length > 0) {
        res.push(`因最后一名玩家退出，房间 ${needDestroyRoomList.map(r => r.id).join('、')} 已关闭`)
      }
      // 正常退出逻辑
      await ctx.database.upsert(CONST.DB, joinedList)
      res.push(`退出房间 ${joinedList.map(o => o.id).join("、")} 成功。`)
      return res.join('\n');
    } catch (e) {
      const logger = new Logger(CONST.LOGGER)
      logger.error(e)
      logger.error(`操作数据表 ${CONST.DB} 失败！`)
      return '未知错误。'
    }
  } else return '未加入房间。'
}
