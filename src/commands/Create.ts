import {Context, Logger} from "koishi";
import {getJoinedRoom} from "../utils/GameUtils";
import {addPrefix} from "../utils/SponsorUtils";
import {RoomTypes} from "../types/RoomTypes";
import {CONST} from "../utils/CONST";

export const create = async (ctx: Context, _, logger: Logger) => {
  // 过滤参数表
  if (Number(_.options.mode) > 2) {
    return '请输入正确的-m参数。'
  }
  let {userId, username} = _.session.author;
  // 检查是否已经加入房间，如果有则提示退出
  const joinedList = await getJoinedRoom(ctx, userId);
  if (joinedList) {
    return `你已加入房间 ${joinedList.map(o => o.id).join("、")} , 请先退出。`;
  }
  // 为特定群友添加头衔
  let userNamePrefix = addPrefix(userId);
  username = userNamePrefix + username;
  // 创建新房间
  const newRoom: RoomTypes = {
    mode: Number(_.options.mode),
    nextPlayerId: "",
    playerDetail: {},
    playerList: [userId],
    prevStats: {cards: [], playerId: "", playerName: ""},
    status: 0,
    usedCard: []
  }
  newRoom.playerDetail[userId] = {isLord: false, name: username, cards: []}
  try {
    await ctx.database.create(CONST.DB, newRoom)
    return '创建房间成功。'
  } catch (e) {
    logger.error(e)
    return '创建房间失败，未知错误。'
  }
}
