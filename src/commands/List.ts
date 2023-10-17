import {Context, Logger} from "koishi";
import {CONST} from "../utils/CONST";
import {GameTypeDict} from "../types/GameTypes";

export const list = async (ctx: Context, _, logger: Logger) => {
  const list = await ctx.database.get(CONST.DB, {})
  const res = list.filter(obj => obj.playerList.length > 0).map(obj => {
    const hostPlayerId = obj.playerList[0];  // 房主ID
    const hostPlayerName = obj.playerDetail[hostPlayerId].name;  //房主昵称
    const mode = GameTypeDict[obj.mode];
    const status = obj.status ? '游戏中' : '等待中';
    return `房间ID: ${obj.id}  房主: ${hostPlayerName}  人数: ${obj.playerList.length}  模式: ${mode}  状态: ${status}`
  }).join('\n')
  return res ? `活动中的斗地主房间：\n${res}` : '目前暂无斗地主房间，使用ddz.create以创建一个房间。'
}
