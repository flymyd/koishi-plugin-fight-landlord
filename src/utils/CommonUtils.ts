/**
 * 生成8位短UUID
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
