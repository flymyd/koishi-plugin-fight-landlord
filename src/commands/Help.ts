export const help = async ()=>{
  let res = [];
  res.push('ddz.list: 列出当前可用的斗地主房间')
  res.push('ddz.create: 创建一个新的斗地主房间，添加参数-m以开启特殊模式。如ddz.create创建经典房间，ddz.create -m 1创建魔改斗地主房间')
  res.push('ddz.join id: 加入指定ID的斗地主房间，ID从ddz.list中查找。如: ddz.join 1')
  res.push('ddz.start: 只有房主可以操作，需要房间内玩家人数至少3人')
  res.push('ddz.info（或：手牌）: 查看手牌详情，私聊机器人使用以防露牌')
  res.push('ddz.play 牌组（或: 出 牌组）: 进行出牌，输入牌名。牌序可以是乱的，但只接受数字、英文字母和小王、大王两个中文词。不接则输入"过"。如：出 大王小王, 出 3334, 出 过')
  res.push('ddz.quit: 退出斗地主房间。下一顺位的玩家将会成为新房主')
  res.push('ddz.disband: 解散斗地主房间。无论该房间是否在游戏中都会被强制解散')
  res.push('ddz.reset: 重置全部斗地主房间，用于出问题后进行重置')
  res.push('ddz.rule: 查看适用的斗地主出牌规则')
  return res.join("\n")
}
