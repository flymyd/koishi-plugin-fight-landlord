import {Context, Logger, Schema} from 'koishi'
import {resetDB} from "./utils/DbUtils";
import {CONST} from "./utils/CONST";
import {initHand} from "./core/CardUtils";
import {list} from "./commands/List";
import {create} from "./commands/Create";
import {join} from "./commands/Join";
import {quit} from "./commands/Quit";
import {start} from "./commands/Start";
import {disband} from "./commands/Disband";
import {info} from "./commands/Info";
import {play} from "./commands/Play";


export const name = 'fight-landlord'
export const using = ['database']

export interface Config {
}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  const logger = new Logger(CONST.LOGGER)

  // TODO _.session.author 待迁移为 let {userId, username} = _.session;

  // TODO 插件重启时总是重置数据表
  // resetDB(ctx).then(() => logger.info(`斗地主数据表 ${CONST.DB} 初始化成功`))

  // 房间列表
  ctx.command('ddz.list', '列出当前可用的斗地主房间')
    .action(async (_) => (await list(ctx, _, logger)))

  // 创建房间
  ctx.command('ddz.create', '创建斗地主房间，添加参数-m以指定模式。0：经典模式，1：魔改模式。')
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
      resetDB(ctx).then(() => logger.info(`斗地主数据表 ${CONST.DB} 初始化成功`))
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

  // TODO rule help
  ctx.command('ddz.test').action(async (_) => {
    initHand(3)
    initHand(4)
    initHand(5)
    initHand(6)
  })
}
