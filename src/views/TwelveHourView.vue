<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import EventListModal from '../components/EventListModal.vue'
import { useSlicesWithEvents } from '@/composables/useSlicesWithEvents'
import type { CalendarEvent } from '../types/CalendarEvent'
import type { SliceData } from '../types/SliceData'

// --- Sample Event Data ---
// (sliceIndex: 0 is the first slice, typically 12 o'clock)
const events = ref<CalendarEvent[]>([
  { id: 'evt1', sliceIndex: 0, name: 'Morning Standup', color: 'tomato' },
  { id: 'evt2', sliceIndex: 0, name: 'Client Call', color: 'gold' },
  { id: 'evt3', sliceIndex: 2, name: 'Lunch with Team', color: 'limegreen' }, // 2 o'clock slice
  { id: 'evt4', sliceIndex: 3, name: 'Project X Work', color: 'deepskyblue' },
  { id: 'evt5', sliceIndex: 3, name: 'Review PRs', color: 'mediumpurple' },
  { id: 'evt6', sliceIndex: 3, name: 'Quick Sync', color: 'lightcoral' }, // Max 3 dots per slice with current settings
  { id: 'evt7', sliceIndex: 8, name: 'Evening Coding', color: 'darkorange' },
])

const numberOfSlices = 12
const viewBoxSize = 200 // Defines the coordinate system for the SVG
const dotPlacement = {
  startRadiusFactor: 0.45, // Start placing dots at 45% of the main radius from the center
  radiusIncrementFactor: 0.15, // Increment distance from center by 15% of main radius for each subsequent dot
  maxDotsPerSlice: 3, // Limit dots shown to prevent clutter, can be adjusted
}

// --- Modal State ---
const currentDateTime = ref(new Date()) // Represents the current date and time focus of the view
const isModalVisible = ref(false)
const selectedSliceEvents = ref<CalendarEvent[]>([])
const selectedSliceIdentifier = ref<string>('')

const { slicesWithEvents } = useSlicesWithEvents(events, numberOfSlices, viewBoxSize, dotPlacement)

// --- Navigation Logic ---
const moveForward = () => {
  // Advance the current time by one hour
  currentDateTime.value = new Date(currentDateTime.value.getTime() + 60 * 60 * 1000)
}

const moveBackward = () => {
  // Move the current time back by one hour
  currentDateTime.value = new Date(currentDateTime.value.getTime() - 60 * 60 * 1000)
}

// --- Computed properties for display ---
const currentHourAmPmForDisplay = computed(() => {
  const date = currentDateTime.value
  let hours = date.getHours()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12 // the hour '0' should be '12'
  return `${hours} ${ampm}`
})

const currentDateForDisplay = computed(() =>
  currentDateTime.value.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
)

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
  const sliceHour = sliceIndex === 0 ? 12 : sliceIndex // Hour number of the slice (1-12)
  // Determine AM/PM for the current 12-hour period based on currentDateTime
  const periodAmPm = currentDateTime.value.getHours() < 12 ? 'AM' : 'PM'
  selectedSliceIdentifier.value = `Hour ${sliceHour} ${periodAmPm}`
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
      <p>Currently: {{ currentHourAmPmForDisplay }} on {{ currentDateForDisplay }}</p>
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
