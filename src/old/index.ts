import {Context, Schema} from 'koishi'
import {
  FightLandlordDetailExtends,
  FightLandlordDetailModel,
  FightLandlordRoomExtends, modeTypes
} from "./types/DbTypes";
import {autoQuitRoom, getJoinedRoom, getPlayerCount, getPlayingRoom, quitRoom, resetDB} from "./DbUtils";
import {canBeatPreviousCards, Card, getCardType, initCards, parseArrToCards, sortCards} from "./CardUtils";
import {modernEventGenerator} from "./EventUtils";
import {addPrefix} from "./SponsorUtils";


export const name = 'fight-landlord'
export const using = ['database']

export interface Config {
}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  // 插件重启时总是重置牌局
  resetDB(ctx)

  ctx.command('ddz.join', '加入斗地主房间').action(async (_, rid: string) => {
    if (!rid) {
      return '请使用ddz.list查询房间列表后，输入待加入的房间ID。如: ddz.join 1'
    }
    let {userId, username} = _.session.author;
    let userNamePrefix = addPrefix(userId);
    username = userNamePrefix + username;
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
      const previousCard: any = playingRoomInfo.originDetail.previousCard;
      // 记牌器
      const usedCard: any = playingRoomInfo.originDetail.usedCard;
      sortCards(usedCard)
      const groupedCards = usedCard.reduce((acc, card) => {
        if (acc[card.cardName]) {
          acc[card.cardName]++;
        } else {
          acc[card.cardName] = 1;
        }
        return acc;
      }, {});
      const recorder = Object.keys(groupedCards).length > 0 ? Object.keys(groupedCards).map(k => k + "*" + groupedCards[k]).join(" ") : '无'
      return `身份: ${playingRoomInfo.role ? '地主' : '农民'}\n上家出牌: ${previousCard.length > 0 ? previousCard.map(o => o.cardName).join(' ') : '无'}\n记牌器：${recorder}\n手牌: ${playingRoomInfo.card}`
    } else return '你必须在一个已经开始的对局中才能查看手牌。'
  })
  ctx.command('ddz.play <message:text>', '进行出牌，输入牌名。不接则输入"过"').action(async (_, card: string) => {
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
        nextPlayerIndex = (Number(lordPlayer.num) - 1) % 3;
        canCurrentUserPlay = userId == lordPlayer.id;
      } else {
        const previousNum = previousPlayer.num;
        nextPlayerIndex = (Number(previousNum)) % 3;
        canCurrentUserPlay = userId == room[players[nextPlayerIndex]];
      }
      if (canCurrentUserPlay) {
        if (card) {
          card = card.toUpperCase();
          let res = ''
          const npIndex = (Number(nextPlayerIndex) + 1) % 3;
          const roomDetail = playingRoomInfo.originDetail
          // 本轮跳过
          if (card.includes('过')) {
            roomDetail.previousPlayer = {name: username, id: userId, num: Number(nextPlayerIndex) + 1}
            await ctx.database.upsert('fightLandlordDetail', [roomDetail])
            return `${username} 跳过本轮, 请下家 ${room[players[npIndex] + 'Name']} 出牌。`
          }
          // 当前手牌
          const originalHand: any = JSON.parse(JSON.stringify(roomDetail['card' + (nextPlayerIndex + 1)]));
          const splicePattern = /[2-9]|10|[JQKA]|大王|小王/gi;
          let currentCardArr: Array<any> = card.match(splicePattern) || [];
          // 要出手的卡牌数组
          // let currentCardArr: Array<any> = card.split(" ");
          let isCurrentCardArrValid = currentCardArr
            .every(v => ['大王', '小王', 'J', 'Q', 'K', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10']
              .includes(v));
          if (isCurrentCardArrValid) {
            // 把待出的牌恢复成存储结构的牌组然后排序
            currentCardArr = parseArrToCards(currentCardArr);
            sortCards(currentCardArr)
            // 堂子牌
            const prevCard: any = roomDetail.previousCard;
            sortCards(prevCard)
            // 判断手牌是否包含待出的牌
            const containsPlayedCards = currentCardArr.every(playedCard => {
              const matchingCardIndex = originalHand.findIndex(handCard => handCard.cardValue === playedCard.cardValue);
              if (matchingCardIndex !== -1) {
                originalHand.splice(matchingCardIndex, 1);
                return true;
              } else {
                return false;
              }
            });
            if (!containsPlayedCards) {
              return '你不能出自己没有的牌。'
            }
            // 魔改斗地主的触发事件逻辑
            if (room.mode == 1) {
              const modernEvent = await modernEventGenerator(ctx, room, roomDetail, (nextPlayerIndex + 1));
              if (modernEvent) {
                return modernEvent;
              }
            }
            // 出牌逻辑
            let canBeat;
            if (prevCard.length < 1) {
              // 第一手随便出
              canBeat = getCardType(currentCardArr) != 13;
            } else if (roomDetail.previousCardHolder == userId) {
              // 其他两人都过 轮到自己 也随便出
              canBeat = getCardType(currentCardArr) != 13;
            } else canBeat = canBeatPreviousCards(currentCardArr, prevCard)
            if (!canBeat) {
              return '你所出的牌不大于上家或不符合出牌规则'
            } else {
              // 出牌成功逻辑：播报剩余手牌, 刷新对局信息（上家、堂子、弃牌）
              res += `出牌成功！堂子的牌面是: ${currentCardArr.map(o => o.cardName).join(' ')}\n`
              res += `${room['player' + (nextPlayerIndex + 1) + 'Name']} 剩余手牌数: ${originalHand.length}\n`
              res += `请 ${room['player' + (npIndex + 1) + 'Name']} 出牌。`
              // @ts-ignore
              roomDetail.usedCard = [...roomDetail.usedCard, ...currentCardArr];
              roomDetail.previousPlayer = {name: username, id: userId, num: nextPlayerIndex + 1}
              // @ts-ignore
              roomDetail.previousCard = [...currentCardArr]
              roomDetail.previousCardHolder = room['player' + (nextPlayerIndex + 1)];
              // 把打出的牌移走
              // 千王之王
              // const newHand = originalHand.filter(card => {
              //   return !currentCardArr.some(playedCard => playedCard.cardValue === card.cardValue);
              // });
              const newHand = originalHand.filter(card => {
                return !currentCardArr.some(playedCard => playedCard.cardValue === card.cardValue && playedCard.cardColor == card.cardColor);
              });
              roomDetail['card' + (nextPlayerIndex + 1)] = [...newHand]
              // 如果该玩家手牌剩余0则播报该玩家胜利，清空对局详情并将对局设置为准备中
              // @ts-ignore
              if (newHand.length < 1) {
                const lord: any = roomDetail.lordPlayer;
                const isLord = lord.id == room['player' + (nextPlayerIndex + 1)]
                await quitRoom(ctx, room, room['player' + (nextPlayerIndex + 1)], true)
                return `${isLord ? '地主' : '农民'} ${room['player' + (nextPlayerIndex + 1) + 'Name']} 获胜！`
              } else {
                await ctx.database.upsert('fightLandlordDetail', [roomDetail])
              }
            }
          } else {
            return '请输入有效的手牌。只能输入2~9的数字、大小写字母J、Q、K、A及"大王"、"小王"。'
          }
          return res;
        } else return '请输入要出的牌或输入"过"以跳过本轮。'
      } else return '还没轮到你出牌。'
    } else return '你必须在一个已经开始的对局中才能出牌。'
  })
  ctx.command('ddz.reset', '重置全部斗地主房间').action(async (_) => {
    resetDB(ctx)
  })
  ctx.command('ddz.rule', '查看适用的斗地主出牌规则').action(async (_) => {
    let res = [];
    res.push('单牌');
    res.push('对子（一对相同点数的牌）');
    res.push('三张相同点数的牌');
    res.push('三带一（三张相同点数的牌 + 单牌）');
    res.push('三带一对（三张相同点数的牌 + 一对）');
    res.push('顺子（连续的五张或更多点数相邻的牌）');
    res.push('连对（连续的两对或更多对点数相邻的牌）');
    res.push('飞机不带翅膀（连续的两个或更多个三张相同点数的牌）');
    res.push('飞机带单牌（连续的两个或更多个三张相同点数的牌 + 相同数量的单牌）');
    res.push('飞机带对子（连续的两个或更多个三张相同点数的牌 + 相同数量的对子）');
    res.push('炸弹（四张点数相同的牌）');
    res.push('王炸（即大王+小王）');
    res.push('无效牌型（不符合任何有效牌型规则）');
    return res.join("\n")
  })
  ctx.command('ddz.help', '查看斗地主指令使用说明').action(async (_) => {
    let res = [];
    res.push('ddz.list: 列出当前可用的斗地主房间')
    res.push('ddz.create: 创建一个新的斗地主房间，添加参数-m以开启特殊模式。如ddz.create创建经典房间，ddz.create -m 1创建魔改斗地主房间')
    res.push('ddz.join id: 加入指定ID的斗地主房间，ID从ddz.list中查找。如: ddz.join 1')
    res.push('ddz.start: 只有房主可以操作，需要玩家人数满3人')
    res.push('ddz.info: 查看手牌详情，私聊机器人使用以防露牌')
    res.push('ddz.play 牌组: 进行出牌，输入牌名。牌序可以是乱的，但只接受数字、大小写字母和小王、大王两个中文词。不接则输入"过"。如：ddz.play 大王 小王, ddz.play 3 3 3 4, ddz.play 过')
    res.push('ddz.quit 退出斗地主房间。如果游戏正在进行中，该对局将会中止；如果你是房主，所在房间将会被直接解散。')
    res.push('ddz.reset: 重置全部斗地主房间，用于出问题后进行重置')
    res.push('ddz.rule: 查看适用的斗地主出牌规则')
    return res.join("\n")
  })
  // ctx.command('ddz.test').action(async (_) => {
  //   const prev = [
  //     {cardValue: 1, cardName: '3'},
  //     {cardValue: 1, cardName: '3'},
  //     {cardValue: 1, cardName: '3'},
  //     {cardValue: 2, cardName: '4'},
  //   ]
  //   const current = [
  //     {cardValue: 2, cardName: '4'},
  //     {cardValue: 2, cardName: '4'},
  //     {cardValue: 2, cardName: '4'},
  //     {cardValue: 1, cardName: '3'},
  //   ]
  //   sortCards(current)
  //   sortCards(prev)
  //   console.log(canBeatPreviousCards(current, prev))
  // })
}
