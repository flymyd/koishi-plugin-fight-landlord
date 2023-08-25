import {Session} from "koishi";
import {Field} from "@minatojs/core";

declare module 'koishi' {
  interface Tables {
    // 斗地主房间
    fightLandlordRoom: FightLandlordRoomModel
    // 斗地主对局房间
    fightLandlordDetail: FightLandlordDetailModel
  }
}

// 玩家信息 name 昵称 id QQ号
export interface PlayerModel {
  name: string,
  id: string | number
}

// 斗地主房间
export interface FightLandlordRoomModel {
  id: number
  // 玩家1到3的信息 name: 昵称, id: uid
  // 方便快速select
  player1: string,
  player1Name: string,
  player2: string,
  player2Name: string,
  player3: string,
  player3Name: string,
  // 房主的信息
  hostPlayer: string,
  hostPlayerName: string,
  // 状态 0 准备中 1 进行中
  status: number
}

export const FightLandlordRoomExtends: Field.Extension = {
  id: 'unsigned',
  player1: 'string',
  player1Name: 'string',
  player2: 'string',
  player2Name: 'string',
  player3: 'string',
  player3Name: 'string',
  hostPlayer: 'string',
  hostPlayerName: 'string',
  status: 'unsigned',
}

// 斗地主房间详情
export interface FightLandlordDetailModel {
  id: number
  // session: Session.Payload,
  // 对应room表的id
  roomId: number,
  // 玩家1到3的手牌
  card1: object,
  card2: object,
  card3: object,
  // 地主信息 name: 昵称, id: uid, num: 玩家序号
  lordPlayer: object,
  // 上家信息 name: 昵称, id: uid, num: 玩家序号
  previousPlayer: object,
  // 上家出牌
  previousCard: object,
  // 堂主
  previousCardHolder: string,
  // 弃牌堆
  usedCard: object
}

export const FightLandlordDetailExtends: Field.Extension = {
  id: 'unsigned',
  roomId: 'unsigned',
  card1: 'json',
  card2: 'json',
  card3: 'json',
  previousPlayer: 'json',
  lordPlayer: 'json',
  previousCard: 'json',
  previousCardHolder: 'string',
  usedCard: 'json'
}
