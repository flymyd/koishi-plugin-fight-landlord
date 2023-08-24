import {Context, Schema} from 'koishi'
import {FightLandlordDetailExtends, FightLandlordRoomExtends} from "./types/DbTypes";
import {getJoinedRoom, quitRoom, resetDB} from "./DbUtils";

export const name = 'fight-landlord'
export const using = ['database']

export interface Config {
}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  // 插件重启时总是重置牌局
  // TODO prod时记得打开
  // resetDB(ctx)
  
  ctx.command('ddz.list', '列出当前可用的斗地主房间').action(async (_) => {
    const list = await ctx.database.get('fightLandlordRoom', {})
    const res = list.map(obj => {
      const {player1, player2, player3} = obj;
      const playerCount = [player1, player2, player3].filter(player => player !== '').length;
      return `房间ID: ${obj.id}  房主: ${obj.hostPlayerName}  人数: ${playerCount}  状态: ${obj.status ? '游戏中' : '等待中'}`
    }).join('\n')
    return res ? `活动中的斗地主房间：\n${res}` : '目前暂无斗地主房间！'
  })
  ctx.command('ddz.create', '创建斗地主房间').action(async (_) => {
    let res = '';
    const {userId, username} = _.session.author;
    // 查询是否已经在房间中
    const joinedRoomList = await getJoinedRoom(ctx, _);
    if (joinedRoomList.length > 0) {
      // 退出已有房间
      const currentRoom = joinedRoomList[0];
      await quitRoom(ctx, currentRoom, userId)
      res += `已退出房间 ${currentRoom.id} 。`
    }
    // 创建新房间
    await ctx.database.create('fightLandlordRoom', {
      player1: userId,
      player1Name: username,
      hostPlayer: userId,
      hostPlayerName: username,
      status: 0
    })
    res += `创建房间成功。`
    return res;
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
  ctx.command('ddz.reset', '重置全部').action(async (_) => {
    resetDB(ctx)
  })
}
