<template>
    <div class="pagination">
        <button class="button" :disabled="current === 1" @click="$emit('update:page', current - 1)">Prev</button>
        <span>Page {{ current }} from {{ last }}</span>
        <button class="button" :disabled="current >= last" @click="$emit('update:page', current + 1)">Next</button>
    </div>
</template>


<script setup>
defineProps({ current: { type: Number, required: true }, last: { type: Number, required: true } })
</script>