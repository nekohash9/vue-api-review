<template>
    <div class="container">

        <h2>Incomes</h2>

        <div class="card filters">
            <label>dateFrom <input type="date" v-model="filters.dateFrom" /></label>
            <label>dateTo <input type="date" v-model="filters.dateTo" /></label>
            <button class="button" @click="reload">Apply</button>
        </div>

        <div class="card">
            <Spinner v-if="loading" />
            <LineChart v-else-if="items.length" :options="chartOptions" />
        </div>

        <div class="card">
            <DataTable :headers="tableHeaders" :rows="items" :keys="tableKeys" />
        </div>

        <div class="card">
            <Pagination :current="meta.current_page" :last="meta.last_page" @update:page="onPage" />
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { fetchList } from '../api'
import { todayYmd, daysAgoYmd } from '../utils/date'
import LineChart from '../components/LineChart.vue'
import DataTable from '../components/DataTable.vue'
import Pagination from '../components/PaginationComponent.vue'
import Spinner from '../components/SpinnerComponent.vue'

const items = ref([])
const meta = reactive({ current_page: 1, last_page: 1 })
const filters = reactive({ dateFrom: '', dateTo: '' })
const page = ref(1)
const loading = ref(false)
const chartOptions = ref({})

const tableHeaders = ['income_id', 'number', 'date', 'supplier_article', 'barcode', 'quantity']
const tableKeys = ['income_id', 'number', 'date', 'supplier_article', 'barcode', 'quantity']

async function load() {
    loading.value = true
    const dateFrom = filters.dateFrom || daysAgoYmd(7)
    const dateTo = filters.dateTo || todayYmd()
    try {
        const { items: data, meta: m } = await fetchList('incomes', { dateFrom, dateTo, page: page.value, limit: 100 })
        items.value = data || []
        meta.current_page = m.current_page || 1
        meta.last_page = m.last_page || 1
        buildChart()
    } catch (e) {
        console.error('Incomes load error', e)
        // понятное сообщение для 403 (невалидный ключ)
        if (e?.response?.status === 403) {
            alert('Access is denied (403). Check the API key: put the correct token in localStorage under the key "api_token"')
        } else if (e?.response?.data) {
            alert('Error: ' + JSON.stringify(e.response.data))
        } else {
            alert('Network error: ' + e.message)
        }
    } finally {
        loading.value = false
    }
}

function buildChart() {
    const map = {}
    for (const it of items.value) {
        const d = (it.date || '').slice(0, 10)
        map[d] = (map[d] || 0) + (Number(it.quantity || 0))
    }
    const days = Object.keys(map).sort()
    chartOptions.value = {
        title: { text: 'Incomes querity by day' },
        tooltip: {},
        xAxis: { type: 'category', data: days },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: days.map(d => map[d]) }]
    }
}

function reload() { page.value = 1; load() }
function onPage(p) { page.value = p; load() }

// initial load
load()
</script>
