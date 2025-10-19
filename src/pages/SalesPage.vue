<template>
    <div class="container">
        <h2>Sales</h2>

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

const tableHeaders = ['ID', 'Product', 'Quantity', 'Sum', 'Date']
const tableKeys = ['id', 'product', 'qty', 'sum', 'date']

async function load() {
    loading.value = true
    const dateFrom = filters.dateFrom || daysAgoYmd(7)
    const dateTo = filters.dateTo || todayYmd()
    try {
        const { items: raw, meta: m } = await fetchList('sales', { dateFrom, dateTo, page: page.value, limit: 100 })
        console.log('raw sales sample:', raw && raw[0])
        items.value = (raw || []).map(it => ({
            id: it.id ?? it.sale_id ?? it._id ?? null,
            product: it.product ?? it.title ?? it.sku ?? it.supplier_article ?? (it.item && it.item.title) ?? '',
            qty: Number(it.qty ?? it.quantity ?? it.count ?? 0),
            sum: Number(it.sum ?? it.total ?? it.amount ?? it.price ?? 0),
            date: (it.date ?? it.created_at ?? it.created ?? '').slice(0, 10),
            raw: it
        }))
        meta.current_page = m.current_page || m.page || 1
        meta.last_page = m.last_page || Math.ceil((m.total || items.value.length) / (m.per_page || 100))
        buildChart()
    } catch (e) {
        console.error('Sales load error', e)
        alert('Failed to load sales: ' + (e?.response?.data ? JSON.stringify(e.response.data) : e.message))
    } finally {
        loading.value = false
    }
}

function buildChart() {
    const map = {}
    for (const it of items.value) {
        const d = it.date || 'unknown'
        map[d] = (map[d] || 0) + (Number(it.sum) || 0)
    }
    const days = Object.keys(map).sort()
    chartOptions.value = { title: { text: 'Daily sales' }, tooltip: {}, xAxis: { type: 'category', data: days }, yAxis: { type: 'value' }, series: [{ type: 'line', data: days.map(d => map[d]) }] }

}

function reload() { page.value = 1; load() }
function onPage(p) { page.value = p; load() }

load()
</script>
