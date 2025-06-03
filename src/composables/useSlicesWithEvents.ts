import { computed, type Ref } from 'vue'
import type { CalendarEvent } from '@/types/CalendarEvent'
import type { EventDot } from '@/types/EventDot'
import type { SliceData } from '@/types/SliceData'

interface DotPlacement {
  startRadiusFactor: number
  radiusIncrementFactor: number
  maxDotsPerSlice: number
}

export function useSlicesWithEvents(
  events: Ref<CalendarEvent[]>,
  numberOfSlices: number,
  viewBoxSize = 200,
  dotPlacement: DotPlacement
) {
  const center = viewBoxSize / 2
  const radius = (viewBoxSize / 2) * 0.95
  const dotVisualRadius = viewBoxSize * 0.018
  const toRadians = (deg: number) => deg * (Math.PI / 180)

  const slicesWithEvents = computed<SliceData[]>(() => {
    const result: SliceData[] = []
    const anglePerSlice = 360 / numberOfSlices
    const offset = -90

    for (let i = 0; i < numberOfSlices; i++) {
      const startDeg = i * anglePerSlice + offset
      const endDeg = (i + 1) * anglePerSlice + offset

      const startRad = toRadians(startDeg)
      const endRad = toRadians(endDeg)

      const x1 = center + radius * Math.cos(startRad)
      const y1 = center + radius * Math.sin(startRad)
      const x2 = center + radius * Math.cos(endRad)
      const y2 = center + radius * Math.sin(endRad)

      const d = [
        `M ${center} ${center}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 0 1 ${x2} ${y2}`,
        'Z',
      ].join(' ')

      const sliceEvents = events.value.filter(e => e.sliceIndex === i)
      const eventDots: EventDot[] = []
      const midRad = toRadians(startDeg + anglePerSlice / 2)

      sliceEvents.slice(0, dotPlacement.maxDotsPerSlice).forEach((ev, idx) => {
        const dist = radius * (
          dotPlacement.startRadiusFactor +
          idx * dotPlacement.radiusIncrementFactor
        )
        if (dist < radius * 0.88) {
          eventDots.push({
            id: ev.id,
            cx: center + dist * Math.cos(midRad),
            cy: center + dist * Math.sin(midRad),
            fill: ev.color,
            radius: dotVisualRadius
          })
        }
      })

      result.push({
        id: `slice-${i}`,
        d,
        eventDots,
        originalEvents: sliceEvents
      })
    }
    return result
  })

  return { slicesWithEvents }
}
