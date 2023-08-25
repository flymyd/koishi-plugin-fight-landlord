import {Context, Schema} from 'koishi'
import {FightLandlordDetailExtends, FightLandlordDetailModel, FightLandlordRoomExtends} from "./types/DbTypes";
import {autoQuitRoom, getJoinedRoom, getPlayerCount, getPlayingRoom, quitRoom, resetDB} from "./DbUtils";
import {canBeatPreviousCards, Card, initCards, sortCards} from "./cardUtils";


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
      const playerCount = getPlayerCount(obj);
      return `房间ID: ${obj.id}  房主: ${obj.hostPlayerName}  人数: ${playerCount}  状态: ${obj.status ? '游戏中' : '等待中'}`
    }).join('\n')
    return res ? `活动中的斗地主房间：\n${res}` : '目前暂无斗地主房间，使用ddz.create以创建一个房间。'
  })
  ctx.command('ddz.create', '创建斗地主房间').action(async (_) => {
    const {userId, username} = _.session.author;
    let res = '';
    // 查询是否已经在房间中，如果有则自动退出
    const rr = await autoQuitRoom(ctx, _)
    res += rr;
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
    if (!rid) {
      return '请使用ddz.list查询房间列表后，输入待加入的房间ID。如: ddz.join 114'
    }
    const {userId, username} = _.session.author;
    let res = '';
    const roomList = await ctx.database.get('fightLandlordRoom', rid)
    if (roomList.length > 0) {
      const room = roomList[0]
      // 已经在该房间中则不需要再次加入
      const {player1, player2, player3} = room;
      const isAlreadyJoined = [player1, player2, player3].filter(player => player == userId).length;
      if (isAlreadyJoined > 0) {
        return '你已经在该房间了。'
      }
      // 不能加入人满和进行中的对局
      if (room.status) {
        return '该房间正在游戏中，使用ddz.create以创建一个房间。'
      }
      const playerCount = getPlayerCount(room);
      if (playerCount > 2) {
        return '该房间人数已满，使用ddz.create以创建一个房间。'
      }
      // 查询是否已经在房间中，如果有则自动退出
      const rr = await autoQuitRoom(ctx, _)
      res += rr;
      const players = ['player1', 'player2', 'player3'];
      for (const player of players) {
        if (!room[player]) {
          room[player] = userId;
          room[`${player}Name`] = username;
          break;
        }
      }
      await ctx.database.upsert('fightLandlordRoom', [room])
      res += `加入房间 ${rid} 成功！`
      return res;
    } else return '请输入正确的房间ID。'
  })
  ctx.command('ddz.quit', '退出斗地主房间').action(async (_) => {
    const rr = await autoQuitRoom(ctx, _)
    if (!rr) {
      return '未加入房间。'
    } else return rr;
  })
  ctx.command('ddz.start', '开始对局').action(async (_) => {
    const {userId, username} = _.session.author;
    let res = '';
    const roomList = await ctx.database.get('fightLandlordRoom', {
      hostPlayer: userId
    })
    // 是房主才能启动该指令
    if (roomList.length < 1) {
      return '你不是房主，无法开始游戏'
    }
    const room = roomList[0]
    // 房间状态不能是游戏中
    if (room.status) {
      return `房间 ${room.id} 正在游戏中。`
    }
    // 必须人满才能开始
    const playerCount = getPlayerCount(room);
    if (playerCount < 3) {
      return `房间 ${room.id} 当前人数为 ${playerCount}，需要3人才能开始。`
    }
    // 当前对局必须没有对应的对局详情才能开始。如果有，则删除脏数据
    const roomDetail = await ctx.database.get('fightLandlordDetail', {roomId: room.id})
    if (roomDetail.length > 0) {
      await ctx.database.remove('fightLandlordDetail', [roomDetail[0].id])
    }
    // 初始化对局详情, 房间状态设置为进行中
    room.status = 1;
    await ctx.database.upsert('fightLandlordRoom', [room])
    const cards = initCards();
    // 随机一个幸运玩家当地主
    const randomLordIndex = Math.floor(Math.random() * 3) + 1;
    const lord = {
      id: room['player' + randomLordIndex],
      name: room['player' + randomLordIndex + 'Name'],
      num: randomLordIndex
    }
    res += `本局地主是: ${lord.name}\n地主牌是: ${cards.holeCards.map(o => o.cardName).join('、')}\n`;
    const currentRoomDetail = {
      roomId: room.id,
      card1: cards.card1,
      card2: cards.card2,
      card3: cards.card3,
      lordPlayer: lord,
      previousPlayer: null,
      previousCard: [],
      usedCard: []
    };
    currentRoomDetail['card' + randomLordIndex] = [...currentRoomDetail['card' + randomLordIndex], ...cards.holeCards]
    sortCards(currentRoomDetail['card' + randomLordIndex])
    // 初始化对局
    await ctx.database.create('fightLandlordDetail', currentRoomDetail)
    res += `房间 ${room.id} 游戏开始！\n`
    res += `请 ${currentRoomDetail.lordPlayer.num} 号玩家 ${currentRoomDetail.lordPlayer.name} 出牌`
    return res;
  })
  ctx.command('ddz.info', '查看手牌详情，私聊机器人使用以防露牌').action(async (_, card: string) => {
    // 必须在一个已经开始的对局中
    const playingRoomInfo = await getPlayingRoom(ctx, _)
    if (playingRoomInfo) {
      const previousCard: any = playingRoomInfo.previousCard;
      // TODO 记牌器
      return `身份: ${playingRoomInfo.role ? '地主' : '农民'}\n上家出牌: ${previousCard.length > 0 ? previousCard.map(o => o.cardName).join(' ') : '无'}\n手牌: ${playingRoomInfo.card}`
    } else return '你必须在一个已经开始的对局中才能查看手牌。'
  })
  ctx.command('ddz.play <message:text>', '进行出牌，输入牌名，以空格分割。不接则输入pass').action(async (_, card: string) => {
    // 必须在一个已经开始的对局中
    const playingRoomInfo = await getPlayingRoom(ctx, _)
    if (playingRoomInfo) {
      const roomList = await ctx.database.get('fightLandlordRoom', {
        id: playingRoomInfo.roomId
      })
      const room = roomList[0]
      const {userId, username} = _.session.author;
      // 根据上家取下家
      const previousPlayer: any = playingRoomInfo.previousPlayer;
      const players = ['player1', 'player2', 'player3'];
      let nextPlayerIndex;  // 比实际的-1
      // 判断用户是否为下家
      let canCurrentUserPlay;
      if (!previousPlayer) {
        const lordPlayer: any = playingRoomInfo.lordPlayer;
        nextPlayerIndex = Number(lordPlayer.num) % 3 - 1;
        canCurrentUserPlay = userId == lordPlayer.id;
      } else {
        const previousNum = previousPlayer.num;
        nextPlayerIndex = (Number(previousNum)) % 3;
        canCurrentUserPlay = userId == room[players[nextPlayerIndex]];
      }
      if (canCurrentUserPlay) {
        if (card) {
          let res = ''
          const npIndex = (Number(nextPlayerIndex) + 1) % 3;
          // 本轮跳过
          if (card.includes('pass')) {
            playingRoomInfo.originDetail.previousPlayer = {name: username, id: userId, num: Number(nextPlayerIndex) + 1}
            await ctx.database.upsert('fightLandlordDetail', [playingRoomInfo.originDetail])
            return `${username} 跳过本轮, 请下家 ${room[players[npIndex] + 'Name']} 出牌。`
          }
          // 要出手的卡牌数组
          let currentCardArr = card.split(" ");
          let isCurrentCardArrValid = currentCardArr
            .every(v => ['大王', '小王', 'J', 'Q', 'K', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10']
              .includes(v));
          if (isCurrentCardArrValid) {
            // TODO 把待出的牌恢复成存储结构的牌组然后排序
            sortCards()
            // TODO 上面的判断用来求card与playingRoomInfo.card的交集，交集排序后与card排序后不吻合则return
            // 否则将排序后的card参数设置为wantCard


            // TODO 出牌逻辑

            // TODO 播报剩余手牌
            res += `剩余手牌数: `
          } else {
            return '请输入有效的手牌，以空格分割。只能输入2~9的数字、大写字母J、Q、K、A及"大王"、"小王"。'
          }
          return res;
        } else return '请输入要出的牌或pass以跳过本轮。'
      } else return '还没轮到你出牌。'
    } else return '你必须在一个已经开始的对局中才能出牌。'
  })
  ctx.command('ddz.reset', '重置全部').action(async (_) => {
    resetDB(ctx)
  })
  ctx.command('ddz.test', '测试牌').action(async (_) => {
    // 使用示例
    const previousCards: Card[] = [
      {cardValue: 5, cardName: '7'}
    ];

    const currentCards: Card[] = [
      {cardValue: 6, cardName: '8'}
    ];
    return canBeatPreviousCards(currentCards, previousCards)
    // const info = await ctx.database.get('fightLandlordDetail', {roomId: 1});
    // return JSON.stringify(info)
  })
}
