<script setup lang="ts">
import { ref, computed } from 'vue'
import EventListModal from '../components/EventListModal.vue'

// --- Data Structures ---
interface CalendarEvent {
  id: string // Unique ID for the event
  sliceIndex: number // 0-6, corresponds to the slice index (0 = first slice)
  name: string // Description of the event
  color: string // Color for the dot
}

interface EventDot {
  id: string
  cx: number
  cy: number
  fill: string
  radius: number
}

interface SliceData {
  id: string
  d: string // SVG path data for the slice
  eventDots: EventDot[]
  originalEvents: CalendarEvent[] // To pass to the modal
}

// --- Sample Event Data ---
// (sliceIndex: 0 is the first slice)
// For a 7-day view, sliceIndex could represent day 0 to day 6
const events = ref<CalendarEvent[]>([
  { id: 'evtDay1', sliceIndex: 0, name: 'Monday Meeting', color: 'tomato' },
  { id: 'evtDay2', sliceIndex: 0, name: 'Project Alpha', color: 'gold' },
  { id: 'evtDay3', sliceIndex: 2, name: 'Wednesday Workout', color: 'limegreen' },
  { id: 'evtDay4', sliceIndex: 4, name: 'Friday Review', color: 'deepskyblue' },
  { id: 'evtDay5', sliceIndex: 4, name: 'Weekend Prep', color: 'mediumpurple' },
])

const numberOfSlices = 7 // Key change for this view
const viewBoxSize = 200 // Defines the coordinate system for the SVG
const centerX = viewBoxSize / 2
const centerY = viewBoxSize / 2
const radius = (viewBoxSize / 2) * 0.95 // 95% of half the viewBox, leaving a small margin
const dotVisualRadius = viewBoxSize * 0.018 // Radius of the event dots
const dotPlacement = {
  startRadiusFactor: 0.45,
  radiusIncrementFactor: 0.15,
  maxDotsPerSlice: 3,
}

// --- Modal State ---
const isModalVisible = ref(false)
const selectedSliceEvents = ref<CalendarEvent[]>([])
const selectedSliceIdentifier = ref<string>('')

// Helper function to convert degrees to radians
const toRadians = (degrees: number): number => degrees * (Math.PI / 180)

// Computed property to generate SVG path data for each slice
const slicesWithEvents = computed<SliceData[]>(() => {
  const resultSlices: SliceData[] = []
  const anglePerSliceDegrees = 360 / numberOfSlices
  const angleOffsetDegrees = -90 // Start at 12 o'clock

  for (let i = 0; i < numberOfSlices; i++) {
    const startAngleDegrees = i * anglePerSliceDegrees + angleOffsetDegrees
    const endAngleDegrees = (i + 1) * anglePerSliceDegrees + angleOffsetDegrees

    const startAngleRad = toRadians(startAngleDegrees)
    const endAngleRad = toRadians(endAngleDegrees)

    const x1 = centerX + radius * Math.cos(startAngleRad)
    const y1 = centerY + radius * Math.sin(startAngleRad)
    const x2 = centerX + radius * Math.cos(endAngleRad)
    const y2 = centerY + radius * Math.sin(endAngleRad)

    const largeArcFlag = anglePerSliceDegrees <= 180 ? 0 : 1
    const sweepFlag = 1

    const d = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${x2} ${y2}`,
      'Z',
    ].join(' ')

    const sliceEvents = events.value.filter((event) => event.sliceIndex === i)
    const eventDots: EventDot[] = []

    const midAngleDegrees = startAngleDegrees + anglePerSliceDegrees / 2
    const midAngleRad = toRadians(midAngleDegrees)

    sliceEvents.slice(0, dotPlacement.maxDotsPerSlice).forEach((event, eventIndex) => {
      const distanceFromCenter =
        radius * (dotPlacement.startRadiusFactor + eventIndex * dotPlacement.radiusIncrementFactor)

      if (distanceFromCenter < radius * 0.88) {
        const dotCx = centerX + distanceFromCenter * Math.cos(midAngleRad)
        const dotCy = centerY + distanceFromCenter * Math.sin(midAngleRad)
        eventDots.push({
          id: event.id,
          cx: dotCx,
          cy: dotCy,
          fill: event.color,
          radius: dotVisualRadius,
        })
      }
    })

    resultSlices.push({
      id: `slice-${i}`,
      d: d,
      eventDots: eventDots,
      originalEvents: sliceEvents, // Store the original events for this slice
    })
  }
  return resultSlices
})

const handleSliceClick = (slice: SliceData, sliceIndex: number) => {
  selectedSliceEvents.value = slice.originalEvents
  selectedSliceIdentifier.value = `Week ${sliceIndex + 1}` // Example identifier
  isModalVisible.value = true
}
const closeModal = () => {
  isModalVisible.value = false
}
</script>

<template>
  <div class="seven-day-view">
    <svg :viewBox="`0 0 ${viewBoxSize} ${viewBoxSize}`" class="pie-chart-svg">
      <g
        v-for="sliceData in slicesWithEvents"
        :key="sliceData.id"
        class="slice-group"
        @click="handleSliceClick(sliceData, index)"
      >
        <path :d="sliceData.d" class="slice" />
        <circle
          v-for="dot in sliceData.eventDots"
          :key="dot.id"
          :cx="dot.cx"
          :cy="dot.cy"
          :r="dot.radius"
          :fill="dot.fill"
          class="event-dot"
        />
      </g>
    </svg>
    <EventListModal
      :is-visible="isModalVisible"
      :events="selectedSliceEvents"
      :slice-identifier="selectedSliceIdentifier"
      @close="closeModal"
    />
  </div>
</template>

<style scoped>
.seven-day-view {
  /* Updated class name */
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.pie-chart-svg {
  width: 90vmin;
  height: 90vmin;
  display: block;
}

.slice {
  fill: lightcoral; /* Different base color for this view */
  stroke: white;
  stroke-width: 1;
  transition: fill 0.2s ease-in-out;
  cursor: pointer; /* Add cursor pointer to indicate clickable slices */
}

.slice:hover {
  fill: crimson; /* Different hover color */
}

.event-dot {
  stroke: rgba(255, 255, 255, 0.7);
  stroke-width: 0.3;
  pointer-events: none; /* Ensure dots don't interfere with slice click */
}

.slice-group {
  /* Clicks will be handled by this group */
}
</style>
