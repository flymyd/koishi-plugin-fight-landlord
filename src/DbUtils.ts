import {FightLandlordDetailExtends, FightLandlordRoomExtends, FightLandlordRoomModel} from "./types/DbTypes";
import {Context} from "koishi";

export const resetDB = async (ctx: Context) => {
  await ctx.database.drop('fightLandlordRoom')
  await ctx.database.drop('fightLandlordDetail')
  await ctx.model.extend('fightLandlordRoom', FightLandlordRoomExtends)
  await ctx.model.extend('fightLandlordDetail', FightLandlordDetailExtends)
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
// 退出房间逻辑
export const quitRoom = async (ctx: Context, room: FightLandlordRoomModel, userId: string) => {
  // 中止正在进行的对局
  const roomDetail = await ctx.database.get('fightLandlordDetail', {roomId: room.id})
  if (roomDetail.length > 0) {
    await ctx.database.remove('fightLandlordDetail', [roomDetail[0].id])
  }
  // 用户是房主则直接解散该房间
  if (room.hostPlayer == userId) {
    await ctx.database.remove('fightLandlordRoom', [room.id])
  } else {
    // 退出该房间
    room.status = 0;
    const uKey = Object.entries(room).find(([key, value]) => value === userId)[0];
    room[uKey] = '';
    room[uKey + 'Name'] = ''
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
