import type { MappedLine } from './anchor'

/**
 * 计算某一播放时刻（毫秒）应当叠加展示的字幕索引，按字幕原始顺序返回。
 * 以校准后的起止时间为准：
 * - 时间重叠的字幕同时展示（保持字幕顺序，不按时间重排）；
 * - 校准后为负时间的字幕不提前展示（一律不展示）；
 * - 时长非正的字幕不展示。
 */
export function activeCueIndexes(lines: MappedLine[], timeMs: number): number[] {
  const result: number[] = []
  for (const line of lines) {
    if (line.newStart < 0) continue
    if (line.newEnd <= line.newStart) continue
    if (timeMs >= line.newStart && timeMs < line.newEnd) result.push(line.index)
  }
  return result
}

/**
 * 把跳转目标（毫秒）夹取到视频可播放范围内，返回秒。
 * 负时间夹到 0；超出视频时长则停在末尾；时长未知时返回 0。
 */
export function clampSeekTime(targetMs: number, durationSec: number): number {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return 0
  const sec = targetMs / 1000
  if (sec <= 0) return 0
  if (sec >= durationSec) return durationSec
  return sec
}
