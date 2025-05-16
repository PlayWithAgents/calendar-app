<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

interface EventItem {
  id: string
  name: string
  color: string // We can use this for styling if needed
  // Add other event properties you might want to display
}

const props = defineProps<{
  isVisible: boolean
  events: EventItem[]
  sliceIdentifier?: string // Optional: to display which slice was clicked
}>()

const emit = defineEmits(['close'])

const closeModal = () => {
  emit('close')
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.isVisible) {
    closeModal()
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
  <div v-if="isVisible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <button class="modal-close-button" @click="closeModal">&times;</button>
      <h3>Events {{ sliceIdentifier ? `for ${sliceIdentifier}` : '' }}</h3>
      <ul v-if="events.length > 0" class="event-list">
        <li v-for="event in events" :key="event.id" class="event-item">
          <span class="event-color-indicator" :style="{ backgroundColor: event.color }"></span>
          {{ event.name }}
        </li>
      </ul>
      <p v-else>No events in this slice.</p>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  min-width: 300px;
  max-width: 80%;
  position: relative;
}

.modal-close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.event-list {
  list-style: none;
  padding: 0;
}
.event-item {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
}
.event-item:last-child {
  border-bottom: none;
}
.event-color-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 10px;
  display: inline-block;
}
</style>
