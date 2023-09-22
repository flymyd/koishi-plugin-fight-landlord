import {Context, Logger} from "koishi";
import {addPrefix} from "../utils/SponsorUtils";
import {CONST} from "../utils/CONST";
import {getJoinedRoom} from "../utils/GameUtils";

export const join = async (ctx: Context, _, logger: Logger, rid: string) => {
  if (!rid) {
    return '请使用ddz.list查询房间列表后，输入待加入的房间ID。如: ddz.join 1'
  }
  let {userId, username} = _.session.author;
  let userNamePrefix = addPrefix(userId);
  username = userNamePrefix + username;
  const roomList = await ctx.database.get(CONST.DB, rid)
  if (roomList.length < 1) {
    return '请输入正确的房间ID。'
  } else {
    // 检查是否已经加入房间，如果有则提示退出
    const joinedList = await getJoinedRoom(ctx, userId);
    if (joinedList) {
      return `你已加入房间 ${joinedList.map(o => o.id).join("、")} , 请先退出。`;
    }
    // 已经在该房间中则不需要再次加入
    const currentRoom = roomList[0]
    if (currentRoom.playerList.includes(userId)) {
      return '你已经加入该房间了。'
    }
    // 不能加入人满和进行中的对局
    if (currentRoom.playerList.length > 5) {
      return '该房间人数已满，使用ddz.create以创建一个房间。'
    }
    if (currentRoom.status) {
      return '该房间正在游戏中，使用ddz.create以创建一个房间。'
    }
    // 加入房间
    currentRoom.playerList.push(userId)
    currentRoom.playerDetail[userId] = {name: username, cards: [], isLord: false};
    try {
      await ctx.database.upsert(CONST.DB, [currentRoom])
      return `${username} 加入了房间 ${currentRoom.id}`
    } catch (e) {
      const logger = new Logger(CONST.LOGGER)
      logger.error(`操作数据表 ${CONST.DB} 失败！`)
      return '未知错误。'
    }
  }
}
