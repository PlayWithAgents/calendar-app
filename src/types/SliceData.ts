import type { EventDot } from './EventDot'
import type { CalendarEvent } from './CalendarEvent'

export interface SliceData {
  id: string
  d: string
  eventDots: EventDot[]
  originalEvents: CalendarEvent[]
}
