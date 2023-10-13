import exp from "constants";

export enum StageTypes {
  HAOKE = 0,
  HELAN,
  DIDU,
  GANGXI,
  HEITUDI,
  QUANDU,
  MODU,
  YANGZHOU,
  RONGCHENG,
  JIANGYU,
  FUYOU,
}

export const StageDict = {
  HAOKE: '浩克省', HELAN: '荷兰', DIDU: '帝都', GANGXI: '缸茜', HEITUDI: '黑土地',
  QUANDU: '拳都', MODU: '魔都', YANGZHOU: '杨州', RONGCHENG: '蓉成', JIANGYU: '疆域', FUYOU: '甫由'
}

export const StageInfo = {
  HAOKE: '发牌阶段结束后，所有玩家手中的Q将会被移除。【牌桌也是桌——孔子】',
  HELAN: '出牌阶段结束后，该玩家随机从其它一名手牌数大于1的玩家处抽走一张手牌。【“这不是俺偷嘞，是俺拾嘞...”】',
  DIDU: '发牌阶段结束后，随机指定玩家X，从X开始的玩家按顺序发放大王-小王-大王-小王，共计额外发出4张王。【群*保密涂抹*已被封禁】',
  GANGXI: '发牌阶段结束后，当玩家点数大于A的手牌大于等于3张时，扔掉全部符合规则的手牌，并得到3张3。否则，丢掉最大的2张牌，并得到1张3。【穷则固定伤害，富则百分比打击】',
  HEITUDI: '出牌阶段结束后，如果堂子里的玩家（堂主）和该玩家不是同阵营，则有20%的概率丢掉堂主的一张手牌。当堂主手牌数为1时不可丢弃。【“你瞅啥？” “瞅你咋地？”】',
  QUANDU: '发牌阶段结束后，所有玩家进行一次1到100的随机数判定。点数>58则获得额外身份：蚬釹，否则获得额外身份：蝈楠。蚬釹每次出牌前有20%的概率摸一张牌。蝈楠每次出牌前有20%的概率丢一张牌，当手牌数为1时不可丢弃。 【得到更多不一定是好事，失去一些也不见得是坏事】',
  MODU: '出牌阶段结束后，有10%的概率摸一张牌，有10%的概率丢一张牌，当地主手牌数为1时不可丢弃。【“阿拉魔都宁生下来就比你多些东西的”】',
  YANGZHOU: '出牌阶段结束后，有5%的概率获得一张点数大于K的牌。【欢迎来到长寿之乡，祝你的牌运如长江大泽一般悠远——当地村民】',
  RONGCHENG: '发牌阶段结束后，所有玩家进行一次1到100的随机数判定。点数>58则获得额外身份：蚬釹，否则获得额外身份：蝈楠。蚬釹每次出牌前有10%的概率从随机一名蝈楠处摸一张牌，当蝈楠手牌数为1时不可摸。蝈楠每次出牌前有5%的概率从随机另一名绸蝈楠处摸一张牌，当另一名蝈楠手牌数为1时不可摸。【和蝈楠的做秘密交易的不一定要是蚬釹。一切皆有可能。】',
  JIANGYU: '发牌阶段结束后，所有玩家手中的大王和小王将会被移除。【*保密涂抹*】',
  FUYOU: '发牌阶段结束后，所有玩家各得到一张A和一张J。【甫由高仿AJ，得勿包过验证】'
}

export function getStageKeyByValue(value: number): string | undefined {
  const keys = Object.keys(StageTypes).filter((key) => StageTypes[key] === value);
  return keys[0];
}
