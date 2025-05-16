<script setup lang="ts">
import { computed } from 'vue'

const numberOfSlices = 12
const viewBoxSize = 200 // Defines the coordinate system for the SVG
const centerX = viewBoxSize / 2
const centerY = viewBoxSize / 2
const radius = (viewBoxSize / 2) * 0.95 // 95% of half the viewBox, leaving a small margin

// Helper function to convert degrees to radians
const toRadians = (degrees: number): number => degrees * (Math.PI / 180)

// Computed property to generate SVG path data for each slice
const slices = computed(() => {
  const resultSlices = []
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

    resultSlices.push({
      id: `slice-${i}`,
      d: d,
    })
  }
  return resultSlices
})
</script>

<template>
  <div class="calendar-view">
    <svg :viewBox="`0 0 ${viewBoxSize} ${viewBoxSize}`" class="pie-chart-svg">
      <g class="slices-group">
        <path v-for="slice in slices" :key="slice.id" :d="slice.d" class="slice" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.calendar-view {
  width: 100vw; /* Full viewport width */
  height: 100vh; /* Full viewport height */
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0; /* A light background for the page */
  margin: 0; /* Remove any default body margin effects */
  padding: 0; /* Ensure no padding interferes with full screen */
  box-sizing: border-box;
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
}

.slice:hover {
  fill: steelblue; /* Color when a slice is hovered over */
}
</style>
