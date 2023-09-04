import {Context, Logger, Schema} from 'koishi'
import {resetDB} from "./utils/DbUtils";
import {GameTypeDict} from "./types/GameTypes";
import {addPrefix} from "./utils/SponsorUtils";
import {CONST} from "./utils/CONST";
import {RoomTypes} from "./types/RoomTypes";


export const name = 'fight-landlord'
export const using = ['database']

export interface Config {
}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  const logger = new Logger('fight-landlord')

  // 插件重启时总是重置数据表
  resetDB(ctx).then(() => logger.info(`斗地主数据表 ${CONST.DB} 初始化成功`))

  // 房间列表
  ctx.command('ddz.list', '列出当前可用的斗地主房间').action(async (_) => {
    const list = await ctx.database.get(CONST.DB, {})
    const res = list.map(obj => {
      const hostPlayerId = obj.playerList[0];  // 房主ID
      const hostPlayerName = obj.playerDetail[hostPlayerId].name;  //房主昵称
      return `房间ID: ${obj.id}  房主: ${hostPlayerName}  人数: ${obj.playerList.length}  模式: ${GameTypeDict[obj.mode]}斗地主  状态: ${obj.status ? '游戏中' : '等待中'}`
    }).join('\n')
    return res ? `活动中的斗地主房间：\n${res}` : '目前暂无斗地主房间，使用ddz.create以创建一个房间。'
  })

  // 创建房间
  ctx.command('ddz.create', '创建斗地主房间，添加参数-m以指定模式。0：经典模式，1：魔改模式。').option('mode', '-m <value:number>', {fallback: 0}).action(async (_) => {
    // 过滤参数表
    if (Number(_.options.mode) > 2) {
      return '请输入正确的-m参数。'
    }
    let {userId, username} = _.session.author;
    // 为特定群友添加头衔
    let userNamePrefix = addPrefix(userId);
    username = userNamePrefix + username;
    // 创建新房间
    const newRoom: RoomTypes = {
      mode: Number(_.options.mode),
      nextPlayer: "",
      playerDetail: {userId: {name: username, cards: []}},
      playerList: [userId],
      prevStats: {cards: [], playerId: ""},
      status: 0,
      usedCard: []
    }
    try {
      await ctx.database.create('fightLandlordRoom', newRoom)
      return '创建房间成功。'
    } catch (e) {
      logger.error(e)
      return '创建房间失败，未知错误。'
    }
  })

  // 退出房间
  // TODO 退出房间后第一顺位为新房主，新增ddz.disband解散房间，若最后一人退出则也解散房间

  // 查看手牌
  // TODO 现在支持多线开战
}
