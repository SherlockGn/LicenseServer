<template>
  <a href="javascript:" @click="click" :style="styleObject"><slot></slot></a>
</template>

<script setup>
import { defineProps, computed, defineEmit } from 'vue'

const props = defineProps({
  disabled: Boolean,
})

const styleObject = computed(() => {
  return {
    color: props.disabled ? '#6c757d' : '#007bff'
  }
})

const emit = defineEmit(["click"])

const click = () => {
  if (!props.disabled) {
    emit('click')
  }
}

</script>