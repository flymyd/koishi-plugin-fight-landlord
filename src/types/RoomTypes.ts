import {Field} from "@minatojs/core";
import {CardTypes} from "./CardTypes";

/**
 * 斗地主数据库类型
 */

declare module 'koishi' {
  interface Tables {
    // 斗地主数据表
    fightLandlord: RoomTypes
  }
}

/**
 * 玩家详情
 */
interface PlayerDetail {
  [key: string]: {
    name: string; // 玩家昵称
    cards: Array<CardTypes>;
    isLord: boolean;
  }
}

/**
 * 斗地主房间详情定义
 */
export interface RoomTypes {
  // 房间ID
  id?: number,
  // 房间模式
  mode: number,
  // 房间状态
  status: number,
  // 玩家ID列表
  playerList: Array<string>,
  // 玩家详情
  playerDetail: PlayerDetail,
  // 堂子详情
  prevStats: {
    cards: Array<CardTypes>, // 堂子
    playerId: string // 玩家ID
  },
  nextPlayer: string, // 下家ID
  usedCard: object, //弃牌堆
}

/**
 * SQLite Schema
 */
export const RoomTypesExtends: Field.Extension = {
  id: 'unsigned',
  mode: 'unsigned',
  status: 'unsigned',
  playerList: 'json',
  playerDetail: 'json',
  prevStats: 'json',
  nextPlayer: 'string',
  usedCard: 'json'
}
