<template>
    <div ref="root" style="height:320px"></div>
</template>


<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'


const props = defineProps({ options: { type: Object, required: true } })
const root = ref(null)
let chart = null


onMounted(() => {
    chart = echarts.init(root.value)
    chart.setOption(props.options)
})


watch(() => props.options, (o) => { if (chart) chart.setOption(o) }, { deep: true })


onBeforeUnmount(() => { if (chart) chart.dispose() })
</script>