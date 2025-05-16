<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import EventListModal from '../components/EventListModal.vue'

// --- Data Structures ---
interface CalendarEvent {
  id: string // Unique ID for the event
  sliceIndex: number // 0-3, corresponds to the slice index (0 = first slice)
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
// For a 4-week view, sliceIndex could represent week 0 to week 3
const events = ref<CalendarEvent[]>([
  { id: 'evtWeek1', sliceIndex: 0, name: 'Week 1 Planning', color: 'tomato' },
  { id: 'evtWeek2', sliceIndex: 1, name: 'Week 2 Sprint', color: 'gold' },
  { id: 'evtWeek3', sliceIndex: 1, name: 'Mid-Sprint Review', color: 'limegreen' },
  { id: 'evtWeek4', sliceIndex: 3, name: 'Week 4 Wrap-up', color: 'deepskyblue' },
])

const numberOfSlices = 4 // Key change for this view
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
const currentPeriodIndex = ref(0) // State to track the current 4-week period
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

// --- Navigation Logic ---
const moveForward = () => {
  // In a real app, this would advance the date/time by 4 weeks
  currentPeriodIndex.value++
}

const moveBackward = () => {
  // In a real app, this would move the date/time back by 4 weeks
  if (currentPeriodIndex.value > 0) {
    currentPeriodIndex.value--
  }
}

// --- Keyboard Navigation ---
const handleViewKeydown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowRight') {
    moveForward()
    event.preventDefault() // Prevent default browser scroll/behavior
  } else if (event.key === 'ArrowLeft') {
    moveBackward()
    event.preventDefault() // Prevent default browser scroll/behavior
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleViewKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleViewKeydown)
})

// --- Modal Handling ---
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
  <div class="four-week-view">
    <!-- Updated class name -->
    <header class="view-header">
      <h2>4-Week View</h2>
      <p>Period: {{ currentPeriodIndex + 1 }}</p>
      <!-- In a real app, this would show actual date range -->
    </header>

    <!-- Add event listeners to the main div to capture key presses -->
    <!-- @keydown="handleViewKeydown" -->

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
.view-header {
  position: absolute;
  top: 20px;
  text-align: center;
  color: black;
}
.four-week-view {
  /* Updated class name */
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
  margin: 0;
  padding: 0;
  overflow: hidden; /* Hide potential scrollbars */
  box-sizing: border-box;
}

.pie-chart-svg {
  width: 90vmin;
  height: 90vmin;
  display: block;
}

.slice {
  fill: mediumseagreen; /* Different base color for this view */
  stroke: white;
  stroke-width: 1;
  transition: fill 0.2s ease-in-out;
  cursor: pointer; /* Add cursor pointer to indicate clickable slices */
}

.slice:hover {
  fill: seagreen; /* Different hover color */
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
