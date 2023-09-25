export function addPrefix(userId) {
  const sponsorList = {
    2078546589: '[👑 超级管理员]',
    727304268: '[🐰✊🐮🍺👴] ',
    761241962: '[🔥 萧炎] ',
    1582568861: '[🍸 原始赞助商]',
    76073715: '[🐮 牛子猎杀者]'
  }
  const prefix = sponsorList[userId]
  if (prefix) {
    return prefix
  } else return ''
}
