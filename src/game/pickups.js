// 道中に落ちているピザアイテムの定義(拾うと所持ピザ+1)
let pickupSeq = 0

export function createPickup(laneCount, speed) {
  return {
    id: `pk${pickupSeq++}`,
    lane: Math.floor(Math.random() * laneCount),
    y: -0.08,
    speed,
  }
}
