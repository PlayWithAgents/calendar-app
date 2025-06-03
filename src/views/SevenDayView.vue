<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import EventListModal from '../components/EventListModal.vue'
import { useSlicesWithEvents } from '@/composables/useSlicesWithEvents'
import type { CalendarEvent } from '../types/CalendarEvent'
import type { SliceData } from '../types/SliceData'


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
const dotPlacement = {
  startRadiusFactor: 0.45,
  radiusIncrementFactor: 0.15,
  maxDotsPerSlice: 3,
}

// --- Modal State ---
const currentPeriodIndex = ref(0) // State to track the current 7-day period
const isModalVisible = ref(false)
const selectedSliceEvents = ref<CalendarEvent[]>([])
const selectedSliceIdentifier = ref<string>('')

const { slicesWithEvents } =
  useSlicesWithEvents(events, numberOfSlices, viewBoxSize, dotPlacement)

// --- Navigation Logic ---
const moveForward = () => {
  // In a real app, this would advance the date/time by 7 days
  currentPeriodIndex.value++
}

const moveBackward = () => {
  // In a real app, this would move the date/time back by 7 days
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
  selectedSliceIdentifier.value = `Day ${sliceIndex + 1}` // Correct identifier for 7-day view
  isModalVisible.value = true
}

const closeModal = () => {
  isModalVisible.value = false
}
</script>

<template>
  <div class="seven-day-view">
    <!-- Updated class name -->
    <header class="view-header">
      <h2>7-Day View</h2>
      <p>Period: {{ currentPeriodIndex + 1 }}</p>
      <!-- In a real app, this would show actual date range -->
    </header>

    <!-- Add event listeners to the main div to capture key presses -->
    <!-- @keydown="handleViewKeydown" -->

    <svg :viewBox="`0 0 ${viewBoxSize} ${viewBoxSize}`" class="pie-chart-svg">
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
.seven-day-view {
  /* Updated class name */
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
