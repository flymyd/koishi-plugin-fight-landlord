/**
 * 斗地主牌型枚举
 */
export enum PokerHandEnum {
  Single = 1, // 单牌
  Pair = 2, // 对子（一对相同点数的牌）
  ThreeOfAKind = 3, // 三张相同点数的牌
  ThreeWithSingle = 4, // 三带一（三张相同点数的牌 + 单牌）
  ThreeWithPair = 5, // 三带一对（三张相同点数的牌 + 一对）
  Straight = 6, // 顺子（连续的五张或更多点数相邻的牌）
  DoubleStraight = 7, // 连对（连续的两对或更多对点数相邻的牌）
  TripleStraight = 8, // 飞机不带翅膀（连续的两个或更多个三张相同点数的牌）
  TripleStraightWithSingle = 9, // 飞机带单牌（连续的两个或更多个三张相同点数的牌 + 相同数量的单牌）
  TripleStraightWithPair = 10, // 飞机带对子（连续的两个或更多个三张相同点数的牌 + 相同数量的对子）
  Bomb = 11, // 炸弹（四张点数相同的牌）
  JokerBomb = 12, // 王炸（即大王+小王）
  Invalid = 13, // 无效牌型（不符合任何有效牌型规则）
}
