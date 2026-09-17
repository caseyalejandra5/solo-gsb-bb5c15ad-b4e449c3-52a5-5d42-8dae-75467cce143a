import { useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { MappedLine } from '../lib/anchor'

/** 已载入的本地视频：仅通过对象 URL 在本地使用，不会上传。 */
export interface VideoSource {
  url: string
  name: string
}

interface Props {
  video: VideoSource | null
  videoRef: RefObject<HTMLVideoElement>
  /** 当前时刻应叠加展示的字幕（以校准后起止时间为准，按字幕顺序）。 */
  activeLines: MappedLine[]
  onPickVideo: (file: File) => void
  onUnloadVideo: () => void
  onTimeChange: (ms: number) => void
  onVideoError: () => void
}

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2]

/**
 * 本地视频同步预览：原生播放 / 暂停 / 拖动 + 倍速控制，
 * 按校准后的起止时间在画面上叠加当前字幕。
 */
export default function VideoPreview({
  video,
  videoRef,
  activeLines,
  onPickVideo,
  onUnloadVideo,
  onTimeChange,
  onVideoError,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rate, setRate] = useState(1)

  /** 播放进度变化（含拖动）时，把视频当前时间同步给上层以刷新高亮行。 */
  const syncTime = () => {
    const v = videoRef.current
    if (v) onTimeChange(v.currentTime * 1000)
  }

  return (
    <section className="preview-panel" aria-label="视频同步预览">
      <div className="preview-toolbar">
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onPickVideo(f)
            e.target.value = ''
          }}
        />
        <button className="btn" onClick={() => fileRef.current?.click()}>
          {video ? '更换视频' : '选择视频'}
        </button>
        {video ? (
          <>
            <button
              className="btn btn-ghost"
              onClick={onUnloadVideo}
              title="卸载视频并释放对象 URL"
            >
              移除视频
            </button>
            <span className="preview-name" title={video.name}>
              {video.name}
            </span>
            <label className="rate-label">
              倍速
              <select
                className="rate-select"
                value={rate}
                onChange={(e) => {
                  const next = Number(e.target.value)
                  setRate(next)
                  const v = videoRef.current
                  if (v) v.playbackRate = next
                }}
              >
                {RATES.map((r) => (
                  <option key={r} value={r}>
                    {r}×
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <span className="preview-hint">
            可选择浏览器可播放的本地视频进行同步预览；文件仅通过对象 URL 在本地使用，不会上传。
          </span>
        )}
      </div>
      {video && (
        <div className="video-stage">
          <video
            ref={videoRef}
            src={video.url}
            controls
            preload="metadata"
            onLoadedMetadata={(e) => {
              // 更换视频后浏览器会把倍速重置为 1，这里恢复当前选择
              e.currentTarget.playbackRate = rate
              syncTime()
            }}
            onTimeUpdate={syncTime}
            onSeeking={syncTime}
            onSeeked={syncTime}
            onRateChange={(e) => setRate(e.currentTarget.playbackRate)}
            onError={onVideoError}
          />
          <div className="subtitle-overlay">
            {activeLines.map((line) => (
              <div key={line.index} className="overlay-cue">
                {line.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
