export const rule = async () => {
  let res = [];
  res.push("当玩家人数为4~6人时的特别发牌规则如下：")
  res.push("4人场：分地主队和农民队，地主没有额外的牌。使用一副完整牌 + 去掉黑桃、草花、大小王的半副牌。每人20张牌。")
  res.push("5人场：2地主对3农民。使用两副完整牌。每人20张牌，每个地主有4张地主牌。")
  res.push("6人场：分地主队和农民队，地主没有额外的牌。使用三副完整牌。每人27张牌。")
  res.push("")
  res.push("接受的出牌规则如下：")
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
  return res.join("\n")
}
