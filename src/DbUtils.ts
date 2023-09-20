import {FightLandlordDetailExtends, FightLandlordRoomExtends, FightLandlordRoomModel} from "./types/DbTypes";
import {Context} from "koishi";

export const resetDB = async (ctx: Context) => {
  try {
    await ctx.database.drop('fightLandlordRoom')
    await ctx.database.drop('fightLandlordDetail')
  } catch (e) {
  }
  await ctx.model.extend('fightLandlordRoom', FightLandlordRoomExtends, {primary: 'id', autoInc: true})
  await ctx.model.extend('fightLandlordDetail', FightLandlordDetailExtends, {primary: 'id', autoInc: true})
}
// 查询是否已经在房间中
export const getJoinedRoom = async (ctx: Context, _: any) => {
  const {userId} = _.session.author;
  return await ctx.database.get('fightLandlordRoom', {
    $or: [
      {player1: userId},
      {player2: userId},
      {player3: userId},
    ]
  });
}
// 查询是否已经在开始游戏的房间中
export const getPlayingRoom = async (ctx: Context, _: any) => {
  const {userId} = _.session.author;
  const joinedRoomList = await ctx.database.get('fightLandlordRoom', {
    $or: [
      {player1: userId},
      {player2: userId},
      {player3: userId},
    ]
  });
  if (joinedRoomList.length > 0) {
    const roomId = joinedRoomList[0].id;
    if (joinedRoomList[0].status) {
      const detail = await ctx.database.get('fightLandlordDetail', {roomId})
      const uKey = Object.entries(joinedRoomList[0])
        .find(([key, value]) => value === userId)[0]
        .replaceAll("player", "");
      const detailInfo = detail[0];
      const lordPlayer: any = detailInfo.lordPlayer;
      return {
        uKey,
        roomId,
        detailId: detailInfo.id,
        role: lordPlayer.id == userId,
        previousPlayer: detailInfo.previousPlayer,
        lordPlayer: detailInfo.lordPlayer,
        card: detailInfo['card' + uKey].map(o => o.cardName).join(' '),
        originDetail: detailInfo
      }
    } else return ''
  } else return ''
}

// 退出房间逻辑
export const quitRoom = async (ctx: Context, room: FightLandlordRoomModel, userId: string, onlyReset?: boolean) => {
  // 中止正在进行的对局
  const roomDetail = await ctx.database.get('fightLandlordDetail', {roomId: room.id})
  if (roomDetail.length > 0) {
    await ctx.database.remove('fightLandlordDetail', [roomDetail[0].id])
  }
  // 用户是房主则直接解散该房间
  if (!onlyReset) {
    if (room.hostPlayer == userId) {
      await ctx.database.remove('fightLandlordRoom', [room.id])
    } else {
      room.status = 0;
      // 退出该房间
      const uKey = Object.entries(room).find(([key, value]) => value === userId)[0];
      room[uKey] = '';
      room[uKey + 'Name'] = ''
      await ctx.database.upsert('fightLandlordRoom', [room])
    }
  } else {
    room.status = 0;
    await ctx.database.upsert('fightLandlordRoom', [room])
  }
}

// 自动退出房间逻辑: 如果已经在房间里则先退出, 适用于create、join、quit
export const autoQuitRoom = async (ctx: Context, _: any) => {
  const {userId, username} = _.session.author;
  // 查询是否已经在房间中
  const joinedRoomList = await getJoinedRoom(ctx, _);
  if (joinedRoomList.length > 0) {
    // 退出已有房间
    const currentRoom = joinedRoomList[0];
    await quitRoom(ctx, currentRoom, userId)
    return `已退出房间 ${currentRoom.id} 。`
  } else return ''
}

// 获取房间内的玩家人数
export const getPlayerCount = (room: FightLandlordRoomModel) => {
  const {player1, player2, player3} = room;
  return [player1, player2, player3].filter(player => player !== '').length;
}
