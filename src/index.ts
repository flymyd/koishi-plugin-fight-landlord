import {Context, Logger, Schema} from 'koishi'
import {resetDB} from "./utils/DbUtils";
import {CONST} from "./utils/CONST";
import {list} from "./commands/List";
import {create} from "./commands/Create";
import {join} from "./commands/Join";
import {quit} from "./commands/Quit";
import {start} from "./commands/Start";
import {disband} from "./commands/Disband";
import {info} from "./commands/Info";
import {play} from "./commands/Play";
import {rule} from "./commands/Rule";
import {help} from "./commands/Help";
import {RoomTypes} from "./types/RoomTypes";
import {getAnotherPlayer} from "./utils/GameUtils";

export const name = 'fight-landlord';
export const using = ['database'];
export interface Config {
}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  const logger = new Logger(CONST.LOGGER)

  // TODO _.session.author 待迁移为 let {userId, username} = _.session;

  // 插件重启时总是重置数据表
  resetDB(ctx).then(() => logger.info(`斗地主数据表 ${CONST.DB} 初始化成功`))

  ctx.command('ddz', '欢乐斗地主').action(async (_) => (await help()))

  // 房间列表
  ctx.command('ddz.list', '列出当前可用的斗地主房间')
    .action(async (_) => (await list(ctx, _, logger)))

  // 创建房间
  ctx.command('ddz.create', '创建斗地主房间，添加参数-m以指定模式。0：经典模式，1：魔改模式，2：万宁模式。')
    .option('mode', '-m <value:number>', {fallback: 0})
    .action(async (_) => (await create(ctx, _, logger)))

  // 加入房间
  ctx.command('ddz.join', '加入斗地主房间')
    .action(async (_, rid: string) => (await join(ctx, _, logger, rid)))

  // 退出房间
  ctx.command('ddz.quit', '退出斗地主房间')
    .action(async (_) => (await quit(ctx, _, logger)))

  // 开始游戏
  ctx.command('ddz.start', '开始游戏')
    .action(async (_) => (await start(ctx, _, logger)))

  // 重置数据表
  ctx.command('ddz.reset', '重置全部斗地主房间')
    .action(async (_) => {
      await resetDB(ctx)
      logger.info(`斗地主数据表 ${CONST.DB} 初始化成功`)
      return `斗地主数据表初始化成功`
    })

  // 解散房间
  ctx.command('ddz.disband', '解散斗地主房间')
    .action(async (_) => (await disband(ctx, _, logger)))

  // 查看手牌
  ctx.command('ddz.info', '查看手牌详情，私聊机器人使用以防露牌')
    .alias('手牌').alias('查看手牌')
    .action(async (_) => (await info(ctx, _, logger)))

  // 出牌
  ctx.command('ddz.play <message:text>', '进行出牌，输入牌名。不接则输入"过"')
    .alias('出')
    .action(async (_, card: string) => (await play(ctx, _, logger, card)))

  // 出牌规则
  ctx.command('ddz.rule', '查看适用的斗地主出牌规则').action(async (_) => (await rule()))

  // 使用说明
  ctx.command('ddz.help', '查看斗地主指令使用说明').action(async (_) => (await help()))

  ctx.command('ddz.test', '测试').action(async (_) => {
    const room = await ctx.database.get(CONST.DB, 1) as Array<RoomTypes>
    let {userId, username} = _.session.author;
    const id = getAnotherPlayer(room[0], userId)
    console.log(id)
  })
}

export const usage = `
# 更新插件后建议使用ddz.reset重置数据表

## 最近更新

* 调整：狸猫换太子、偷天换日、乾坤大挪移现在将会选择一名其它玩家作为目标，不会出现选择自己作为目标的情况了
* 新增：三山四海-当前玩家随机获得1~4张3或1~4张4

## 基本指令用法

- ddz: 查询斗地主指令列表
- ddz.list: 列出当前可用的斗地主房间
- ddz.create: 创建一个新的斗地主房间，添加参数-m以开启特殊模式。如ddz.create创建经典房间，ddz.create -m 1创建魔改斗地主房间, -m 2创建万宁斗地主房间
- ddz.join id: 加入指定ID的斗地主房间，ID从ddz.list中查找。如: ddz.join 1
- ddz.start: 只有房主可以操作，需要房间内玩家人数至少3人
- ddz.info（或：手牌）: 查看手牌详情，私聊机器人使用以防露牌
- ddz.play 牌组（或: 出 牌组）: 进行出牌，输入牌名。牌序可以是乱的，但只接受数字、英文字母和小王、大王两个中文词。不接则输入"过"。如：出 大王小王, 出 3334, 出 过
- ddz.quit: 退出斗地主房间。下一顺位的玩家将会成为新房主
- ddz.disband: 解散斗地主房间。无论该房间是否在游戏中都会被强制解散
- ddz.reset: 重置全部斗地主房间，用于出问题后进行重置
- ddz.rule: 查看适用的斗地主出牌规则

## 默认的快捷指令

- ddz.play => 出
- ddz.info => 手牌、查看手牌

## 快速开始

* 使用ddz.list查询是否已经有可用房间。如果没有的话，赶紧呼朋唤友准备开始吧
* 要加入准备中的房间，使用ddz.join ID，如ddz.join 1
* 要创建房间，使用ddz.create。添加参数-m以指定模式。0：经典模式，1：魔改模式，2：万宁模式。如ddz.create -m 1
* 当人满后，房主使用ddz.start开始游戏
* 私聊机器人，使用ddz.info 或 手牌 以获取手牌等信息
* 使用ddz.play 或 出 以出牌，输入ddz.play 过 / 出 过 则可以直接跳过本轮
* 使用ddz.quit退出当前房间。若房主退出，则房主身份会顺延到下一位玩家
* 使用ddz.disband解散当前房间（仅房主可用）
* 当出现问题时，使用ddz.reset以重置数据表

## 规则介绍

### 规则：当玩家人数为4~6人时

#### 4人场

分地主队和农民队，地主没有额外的牌。使用一副完整牌 + 去掉黑桃、草花、大小王的半副牌。每人20张牌。

#### 5人场

2地主对3农民。使用两副完整牌。每人20张牌，每个地主有4张地主牌。

#### 6人场

分地主队和农民队，地主没有额外的牌。使用三副完整牌。每人27张牌。

### 规则：经典斗地主

本游戏采用经典斗地主规则：

* 单牌
* 对子（一对相同点数的牌）
* 三张相同点数的牌
* 三带一（三张相同点数的牌 + 单牌）
* 三带一对（三张相同点数的牌 + 一对）
* 顺子（连续的五张或更多点数相邻的牌）
* 连对（连续的两对或更多对点数相邻的牌）
* 飞机不带翅膀（连续的两个或更多个三张相同点数的牌）
* 飞机带单牌（连续的两个或更多个三张相同点数的牌 + 相同数量的单牌）
* 飞机带对子（连续的两个或更多个三张相同点数的牌 + 相同数量的对子）
* 炸弹（四张点数相同的牌）
* 王炸（即大王+小王）

### 规则：魔改斗地主

在经典斗地主的基础上扩充而来，在出牌阶段随机触发事件。使用ddz.create -m 1以启用。 事件如下：

* 以小博大-最大的手牌变为2
* 昙花一现-随机让一位玩家明牌
* 散财童子-当手牌数大于1时，随机丢掉一张手牌
* 阳光普照-每人获得一张牌
* 偷天换日-将一名玩家的一张手牌和自己的一张手牌交换
* 狸猫换太子-将一名玩家的身份和自己的身份交换
* 乾坤大挪移-将一名玩家的全部手牌和自己的全部手牌交换
* 反转了-翻转出牌顺序

### 规则：万宁斗地主

在魔改斗地主的基础上扩充而来，技能触发概率增大。使用ddz.create -m 2以启用。
`
