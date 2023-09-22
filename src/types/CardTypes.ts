/**
 * 扑克牌定义
 */
export interface CardTypes {
  cardValue: number;  // 牌值: 范围1到15，对应点数3到大王
  cardName: string
  cardColor?: string;  // 花色: A、B、C、D，对应红桃、方块、黑桃、梅花
  cardUUID?: string;  // 卡片唯一标识
}
