import {FightLandlordDetailExtends, FightLandlordRoomExtends, FightLandlordRoomModel} from "./types/DbTypes";
import {Context} from "koishi";

export const resetDB = async (ctx: Context) => {
  await ctx.database.drop('fightLandlordRoom')
  await ctx.database.drop('fightLandlordDetail')
  await ctx.model.extend('fightLandlordRoom', FightLandlordRoomExtends)
  await ctx.model.extend('fightLandlordDetail', FightLandlordDetailExtends)
}
// 查询是否已经在房间中
export const getJoinedRoom = async (ctx: Context, _: any)=>{
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
