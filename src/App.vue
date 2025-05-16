<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Define the view stack order by route names
// Top (less detail) to Bottom (more detail)
const viewStackOrder = ['4week', '7day', '12hour']

const handleKeydown = (event: KeyboardEvent) => {
  const currentRouteName = route.name?.toString()
  if (!currentRouteName) return

  const currentIndex = viewStackOrder.indexOf(currentRouteName)
  if (currentIndex === -1) return // Current route not in our defined stack

  let nextIndex = -1

  if (event.key === 'ArrowUp') {
    // Move "up" the stack (e.g., from 12hour to 7day, or 7day to 4week)
    nextIndex = currentIndex > 0 ? currentIndex - 1 : viewStackOrder.length - 1 // Loop to bottom if at top
  } else if (event.key === 'ArrowDown') {
    // Move "down" the stack (e.g., from 4week to 7day, or 7day to 12hour)
    nextIndex = currentIndex < viewStackOrder.length - 1 ? currentIndex + 1 : 0 // Loop to top if at bottom
  }

  if (nextIndex !== -1 && nextIndex !== currentIndex) {
    router.push({ name: viewStackOrder[nextIndex] })
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <RouterView />
</template>

<style scoped>
/* You can add global styles for your app here if needed, or keep it empty for now */
</style>
