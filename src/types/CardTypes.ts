/**
 * 扑克牌定义
 */

// 用来生成number区间的类型
type BuildPowersOfToLengthArrays<N extends number, R extends never[][]> =
  R[0][N] extends never ? R : BuildPowersOfToLengthArrays<N, [[...R[0], ...R[0]], ...R]>;
type ConcatLargestUntilDone<N extends number, R extends never[][], B extends never[]> =
  B["length"] extends N ? B : [...R[0], ...B][N] extends never
    ? ConcatLargestUntilDone<N, R extends [R[0], ...infer U] ? U extends never[][] ? U : never : never, B>
    : ConcatLargestUntilDone<N, R extends [R[0], ...infer U] ? U extends never[][] ? U : never : never, [...R[0], ...B]>;
type Replace<R extends any[], T> = { [K in keyof R]: T }
type TupleOf<T, N extends number> = number extends N ? T[] : {
  [K in N]:
  BuildPowersOfToLengthArrays<K, [[never]]> extends infer U ? U extends never[][]
    ? Replace<ConcatLargestUntilDone<K, U, []>, T> : never : never;
}[N]
type RangeOf<N extends number> = Partial<TupleOf<unknown, N>>["length"];
type RangeOfTo<From extends number, To extends number> = Exclude<RangeOf<To>, RangeOf<From>> | From;

export interface CardTypes {
  cardValue: RangeOfTo<1, 15>;  // 牌值: 范围1到15，对应点数3到大王
  cardName: "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A" | "小王" | "大王";  // 点数: 3~10、J、Q、K、A、小王、大王
  cardColor?: "A" | "B" | "C" | "D";  // 花色: A、B、C、D，对应红桃、黑桃、梅花、方块
  cardUUID?: string;  // 卡片唯一标识
}
