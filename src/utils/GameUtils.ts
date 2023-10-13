import {Context} from "koishi";
import {CONST} from "./CONST";
import {RoomTypes} from "../types/RoomTypes";

/**
 * 查询用户加入的房间
 * @param ctx
 * @param userId
 */
export const getJoinedRoom = async (ctx: Context, userId: string) => {
  const roomList = await ctx.database.get(CONST.DB, {})
  const joinedList = roomList.filter(obj => obj.playerList.includes(userId))
  if (joinedList.length > 0) {
    return joinedList;
  } else return false;
}

/**
 * 获取上/下家信息（相对于当前用户）
 * @param ctx
 * @param userId 用户id
 * @param roomId 房间id
 * @param step 步长 正数表示取下家 负数表示取上家
 */
export const getSpecifiedPlayer = async (ctx: Context, userId: string, roomId: number, step: number = 1) => {
  const roomList = await ctx.database.get(CONST.DB, {id: roomId})
  const room = roomList[0] as RoomTypes;
  const {playerList, playerDetail} = room;
  const index = playerList.indexOf(userId);
  let nextIndex;
  if (step >= 0) {
    nextIndex = (index + step) % playerList.length;
  } else {
    nextIndex = (index - Math.abs(step)) % playerList.length;
    if (nextIndex < 0) {
      nextIndex += playerList.length;
    }
  }
  const id = playerList[nextIndex];
  return {...playerDetail[id], id};
}

/**
 * 随机选择一名其它玩家
 * @param room
 * @param currentPlayerId
 * @param excludeOneCard 是否排除只剩一张手牌的玩家
 */
export const getAnotherPlayer = (room: RoomTypes, currentPlayerId: string, excludeOneCard: boolean = false) => {
  room.playerList = room.playerList.filter(id => id !== currentPlayerId);
  if (excludeOneCard) {
    room.playerList.filter(id => room.playerDetail[id].cards.length > 1)
  }
  const randomIndex = Math.floor(Math.random() * room.playerList.length);
  return room.playerList[randomIndex];
}
