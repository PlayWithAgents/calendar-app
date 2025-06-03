<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import EventListModal from '../components/EventListModal.vue'

// --- Data Structures ---
interface CalendarEvent {
  id: string // Unique ID for the event
  hour: number // 0-11, corresponds to the slice index (0 = 12 o'clock position)
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
// (hour: 0 is the first slice, typically 12 o'clock)
const events = ref<CalendarEvent[]>([
  { id: 'evt1', hour: 0, name: 'Morning Standup', color: 'tomato' },
  { id: 'evt2', hour: 0, name: 'Client Call', color: 'gold' },
  { id: 'evt3', hour: 2, name: 'Lunch with Team', color: 'limegreen' }, // 2 o'clock slice
  { id: 'evt4', hour: 3, name: 'Project X Work', color: 'deepskyblue' },
  { id: 'evt5', hour: 3, name: 'Review PRs', color: 'mediumpurple' },
  { id: 'evt6', hour: 3, name: 'Quick Sync', color: 'lightcoral' }, // Max 3 dots per slice with current settings
  { id: 'evt7', hour: 8, name: 'Evening Coding', color: 'darkorange' },
])

const numberOfSlices = 12
const viewBoxSize = 200 // Defines the coordinate system for the SVG
const centerX = viewBoxSize / 2
const centerY = viewBoxSize / 2
const radius = (viewBoxSize / 2) * 0.95 // 95% of half the viewBox, leaving a small margin
const dotVisualRadius = viewBoxSize * 0.018 // Radius of the event dots (e.g., 1.8% of viewBoxSize)
const dotPlacement = {
  startRadiusFactor: 0.45, // Start placing dots at 45% of the main radius from the center
  radiusIncrementFactor: 0.15, // Increment distance from center by 15% of main radius for each subsequent dot
  maxDotsPerSlice: 3, // Limit dots shown to prevent clutter, can be adjusted
}

// --- Modal State ---
const currentPeriodIndex = ref(0) // State to track the current 12-hour period
const isModalVisible = ref(false)
const selectedSliceEvents = ref<CalendarEvent[]>([])
const selectedSliceIdentifier = ref<string>('')

// Helper function to convert degrees to radians
const toRadians = (degrees: number): number => degrees * (Math.PI / 180)

// Computed property to generate SVG path data for each slice
const slicesWithEvents = computed<SliceData[]>(() => {
  const resultSlices: SliceData[] = []
  const anglePerSliceDegrees = 360 / numberOfSlices
  // Offset to start the first slice at the 12 o'clock position
  const angleOffsetDegrees = -90

  for (let i = 0; i < numberOfSlices; i++) {
    const startAngleDegrees = i * anglePerSliceDegrees + angleOffsetDegrees
    const endAngleDegrees = (i + 1) * anglePerSliceDegrees + angleOffsetDegrees

    const startAngleRad = toRadians(startAngleDegrees)
    const endAngleRad = toRadians(endAngleDegrees)

    // Calculate the start point of the arc (x1, y1)
    const x1 = centerX + radius * Math.cos(startAngleRad)
    const y1 = centerY + radius * Math.sin(startAngleRad)

    // Calculate the end point of the arc (x2, y2)
    const x2 = centerX + radius * Math.cos(endAngleRad)
    const y2 = centerY + radius * Math.sin(endAngleRad)

    // SVG arc flags
    const largeArcFlag = anglePerSliceDegrees <= 180 ? 0 : 1 // For 30-degree slices, this is 0
    const sweepFlag = 1 // Draw arc in a "positive-angle" direction (clockwise)

    // Construct the SVG path data string for a pie slice
    // M = Move to center
    // L = Line to arc start point (x1, y1)
    // A = Arc command (rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y)
    // Z = Close path (line back to the starting point, i.e., the center)
    const d = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${x2} ${y2}`,
      'Z',
    ].join(' ')

    // --- Event Dot Calculation for this slice ---
    const sliceEvents = events.value.filter((event) => event.hour === i)
    const eventDots: EventDot[] = []

    // Calculate the middle angle of the current slice for dot placement
    const midAngleDegrees = startAngleDegrees + anglePerSliceDegrees / 2
    const midAngleRad = toRadians(midAngleDegrees)

    sliceEvents.slice(0, dotPlacement.maxDotsPerSlice).forEach((event, eventIndex) => {
      // Place dots radially outwards from the center along the mid-angle of the slice
      const distanceFromCenter =
        radius * (dotPlacement.startRadiusFactor + eventIndex * dotPlacement.radiusIncrementFactor)

      // Ensure dots don't go beyond the main radius (with a small margin)
      if (distanceFromCenter < radius * 0.88) {
        // Cap at 88% of radius to stay well within
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
  // In a real app, this would advance the date/time by 12 hours
  currentPeriodIndex.value++
}

const moveBackward = () => {
  // In a real app, this would move the date/time back by 12 hours
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
  // Correct identifier for 12-hour view
  const displayHour = sliceIndex === 0 ? 12 : sliceIndex
  selectedSliceIdentifier.value = `Hour ${displayHour}`
  isModalVisible.value = true
}
const closeModal = () => {
  isModalVisible.value = false
}
</script>

<template>
  <div class="twelve-hour-view">
    <header class="view-header">
      <h2>12-Hour View</h2>
      <p>Period: {{ currentPeriodIndex + 1 }}</p>
      <!-- In a real app, this would show actual date/time range -->
    </header>

    <!-- Add event listeners to the main div to capture key presses -->
    <!-- @keydown="handleViewKeydown" -->

    <svg :viewBox="`0 0 ${viewBoxSize} ${viewBoxSize}`" class="pie-chart-svg">
      <!-- Group for each slice and its dots -->
      <g
        v-for="(sliceData, index) in slicesWithEvents"
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
.twelve-hour-view {
  /* Updated class name */
  width: 100vw; /* Full viewport width */
  height: 100vh; /* Full viewport height */
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0; /* A light background for the page */
  margin: 0; /* Remove any default body margin effects */
  padding: 0; /* Ensure no padding interferes with full screen */
  box-sizing: border-box;
  overflow: hidden; /* Hide potential scrollbars */
}

.pie-chart-svg {
  width: 90vmin; /* Responsive: 90% of the smaller viewport dimension */
  height: 90vmin;
  display: block; /* Helps with layout and scaling */
}

.slice {
  fill: lightskyblue; /* Default color for slices */
  stroke: white; /* Color for the lines between slices */
  stroke-width: 1; /* Width of the lines, relative to viewBoxSize */
  transition: fill 0.2s ease-in-out; /* Smooth transition for hover effect */
  cursor: pointer; /* Add cursor pointer to indicate clickable slices */
}

.slice:hover {
  fill: steelblue; /* Color when a slice is hovered over */
}

.event-dot {
  stroke: rgba(255, 255, 255, 0.7); /* Optional: slight white border for better visibility */
  stroke-width: 0.3; /* Relative to viewBoxSize */
  pointer-events: none; /* Ensure dots don't interfere with slice click */
}

.slice-group {
  /* Clicks will be handled by this group */
}
</style>
