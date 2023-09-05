import {Context, Logger, Schema} from 'koishi'
import {isJoinedRoom, resetDB} from "./utils/DbUtils";
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
  const logger = new Logger(CONST.LOGGER)

  // 插件重启时总是重置数据表
  resetDB(ctx).then(() => logger.info(`斗地主数据表 ${CONST.DB} 初始化成功`))

  // 房间列表
  ctx.command('ddz.list', '列出当前可用的斗地主房间').action(async (_) => {
    const list = await ctx.database.get(CONST.DB, {})
    const res = list.map(obj => {
      const hostPlayerId = obj.playerList[0];  // 房主ID
      const hostPlayerName = obj.playerDetail[hostPlayerId].name;  //房主昵称
      const mode = GameTypeDict[obj.mode];
      const status = obj.status ? '游戏中' : '等待中';
      return `房间ID: ${obj.id}  房主: ${hostPlayerName}  人数: ${obj.playerList.length}  模式: ${mode}  状态: ${status}`
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
    // 检查是否已经加入房间，如果有则提示退出
    const joinedList = await isJoinedRoom(ctx, userId);
    if (joinedList) {
      return `你已加入房间 ${joinedList.map(o => o.id).join("、")} , 请先退出。`;
    }
    // 为特定群友添加头衔
    let userNamePrefix = addPrefix(userId);
    username = userNamePrefix + username;
    // 创建新房间
    const newRoom: RoomTypes = {
      mode: Number(_.options.mode),
      nextPlayer: "",
      playerDetail: {},
      playerList: [userId],
      prevStats: {cards: [], playerId: ""},
      status: 0,
      usedCard: []
    }
    newRoom.playerDetail[userId] = {name: username, cards: []}
    try {
      await ctx.database.create(CONST.DB, newRoom)
      return '创建房间成功。'
    } catch (e) {
      logger.error(e)
      return '创建房间失败，未知错误。'
    }
  })

  // 加入房间
  ctx.command('ddz.join', '加入斗地主房间').action(async (_, rid: string) => {
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
      const joinedList = await isJoinedRoom(ctx, userId);
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
      currentRoom.playerDetail[userId] = {name: username, cards: []};
      try {
        await ctx.database.upsert(CONST.DB, [currentRoom])
        return `${username} 加入了房间 ${currentRoom.id}`
      } catch (e) {
        const logger = new Logger(CONST.LOGGER)
        logger.error(`操作数据表 ${CONST.DB} 失败！`)
      }
    }
  })

  // 退出房间
  ctx.command('ddz.quit', '退出斗地主房间').action(async (_) => {
    let {userId, username} = _.session.author;
    const joinedList = await isJoinedRoom(ctx, userId);
    let res = [];
    if (joinedList) {
      try {
        joinedList.forEach(room => {
          if (room.status) {
            res.push(`房间 ${room.id} 正在游戏中, 退出失败。`)
          } else {
            room.playerList = room.playerList.filter(id => id != userId);
            delete room.playerDetail[userId]
          }
        })
        // 最后一名玩家退出则直接销毁房间
        const needDestroyRoomList = joinedList.filter(room => room.playerList.length < 1);
        await ctx.database.remove('fightLandlordRoom', needDestroyRoomList.map(room => room.id))
        res.push(`最后一名玩家退出，房间 ${needDestroyRoomList.map(r => r.id).join('、')} 已关闭`)
        // 正常退出逻辑
        await ctx.database.upsert(CONST.DB, joinedList)
        res.push(`退出房间 ${joinedList.map(o => o.id).join("、")} 成功。`)
        return res.join('\n');
      } catch (e) {
        const logger = new Logger(CONST.LOGGER)
        logger.error(`操作数据表 ${CONST.DB} 失败！`)
      }
    } else return '未加入房间。'
  })

  // 开始游戏
  ctx.command('ddz.start', '开始游戏').action(async (_) => {
  })


  // 退出房间
  // TODO 退出房间后第一顺位为新房主，新增ddz.disband解散房间，若最后一人退出则也解散房间

  // 查看手牌
}
