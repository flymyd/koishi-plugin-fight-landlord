import {Context, Schema} from 'koishi'
import {FightLandlordDetailExtends, FightLandlordRoomExtends} from "./types/DbTypes";

export const name = 'fight-landlord'
export const using = ['database']

export interface Config {
}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  ctx.model.extend('fightLandlordRoom', FightLandlordRoomExtends)
  ctx.model.extend('fightLandlordDetail', FightLandlordDetailExtends)
  ctx.command('ddz.list', '列出当前可用的斗地主房间').action(async (_) => {
    const list = await ctx.database.get('fightLandlordRoom', {})
    return JSON.stringify(list)
  })
  ctx.command('ddz.create', '创建斗地主房间').action(async (_) => {
    // 查询是否已经在房间中，如果有则自动退出并成为新房间的房主
    return JSON.stringify(_.session)
  })
  ctx.command('ddz.join', '加入斗地主房间').action(async (_, rid: string) => {
    // 不能加入人满和进行中的对局
    // 查询是否已经在房间中，如果有则自动退出
  })
  ctx.command('ddz.quit', '退出斗地主房间').action(async (_) => {
    // 退出当前uid所在的房间, 销毁对局详情, 房间状态设置为准备中
    // 如果房间只剩一人则销毁该房间，并销毁对应的对局
  })
  ctx.command('ddz.start', '开始对局').action(async (_) => {
    // 必须人满才能开始
    // 当前对局必须没有对应的对局详情才能开始
    // 初始化当前uid所在的房间对应的对局详情, 房间状态设置为进行中
    // 随机一个幸运玩家当地主吧
  })
  ctx.command('ddz.play', '进行出牌').action(async (_, card: string) => {
    // 必须在一个已经开始的对局中
  })
}
