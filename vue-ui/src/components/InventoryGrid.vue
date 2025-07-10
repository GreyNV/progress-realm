<script setup>
import { ref, onMounted } from 'vue'

const items = ref([])

function update() {
  if (window.Inventory && window.Inventory.getItems) {
    items.value = window.Inventory.getItems()
  }
}

onMounted(() => {
  update()
  if (window.PubSub && window.PubSub.subscribe) {
    window.PubSub.subscribe('inventory:changed', update)
  }
})
</script>

<template>
  <div class="inventory-grid">
    <div v-for="item in items" :key="item.id" class="slot" :class="`rarity-${item.rarity}`" :style="{ backgroundImage: item.image ? `url(${item.image})` : 'none' }">
      <span class="label">{{ item.name }}</span>
      <span class="count">{{ item.quantity }}</span>
    </div>
  </div>
</template>

<style scoped>
.inventory-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.slot {
  position: relative;
  width: 64px;
  height: 64px;
  background-size: cover;
  border: 1px solid #555;
}
.label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.5);
  color: #fff;
  font-size: 12px;
  text-align: center;
}
.count {
  position: absolute;
  top: 0;
  right: 2px;
  background: rgba(0,0,0,0.5);
  color: #fff;
  font-size: 12px;
}
</style>
