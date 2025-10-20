<template>
    <div class="container">

        <h2>Stocks (current day)</h2>

        <div class="card filters">
            <label>date <input type="date" v-model="filters.date" /></label>
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
import { fetchList } from '../../api'
import { todayYmd } from '../utils/date'
import LineChart from '../components/LineChart.vue'
import DataTable from '../components/DataTable.vue'
import Pagination from '../components/PaginationComponent.vue'
import Spinner from '../components/SpinnerComponent.vue'

const items = ref([])
const meta = reactive({ current_page: 1, last_page: 1 })
const filters = reactive({ date: '' })
const page = ref(1)
const loading = ref(false)
const chartOptions = ref({})

const tableHeaders = ['ID', 'Warehouse', 'Product', 'Quantity']
const tableKeys = ['id', 'warehouse', 'product', 'qty']

// load() 
async function load() {
    loading.value = true
    // stocks принимает dateFrom 
    const dateFrom = filters.date || todayYmd()
    try {
        // плучаем "сырые" данные
        const { items: raw, meta: m } = await fetchList('stocks', { dateFrom, page: page.value, limit: 500 })
        console.log('raw sample (stocks):', raw && raw[0])

        // нормализуем поля в единый формат, который используется в юи
        items.value = (raw || []).map(it => ({
            id: it.id ?? it.stock_id ?? it.income_id ?? null,
            // пробуем несколько вариантов названий поля склада
            warehouse: it.warehouse ?? it.warehouseName ?? it.warehouse_name ?? it.whs ?? it.name ?? 'Unknown',
            // пробуем несколько полей для названия продукта
            product: it.product ?? it.sku ?? it.supplier_article ?? it.tech_size ?? it.title ?? '',
            // возможные поля количества — конвертируем в число
            qty: Number(it.qty ?? it.quantity ?? it.quantity_balance ?? it.quantityInStock ?? 0),
            raw: it
        }))

        // нормализуем meta
        meta.current_page = m.current_page || m.page || 1
        meta.last_page = m.last_page || Math.ceil((m.total || items.value.length) / (m.per_page || 500))

        // Строим график
        buildChart()
    } catch (e) {
        console.error('Stocks load error', e)
        alert('Failed to load stocks: ' + (e?.response?.data ? JSON.stringify(e.response.data) : e.message))
    } finally {
        loading.value = false
    }
}

function buildChart() {
    const map = {}
    for (const it of items.value) {
        const key = it.warehouse || 'Unknown'
        map[key] = (map[key] || 0) + (Number(it.qty) || 0)
    }
    const keys = Object.keys(map)
    chartOptions.value = {
        title: { text: 'Stock by warehouse' },
        tooltip: {},
        xAxis: { type: 'category', data: keys },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: keys.map(k => map[k]) }]
    }
}

function reload() {
    page.value = 1
    load()
}
function onPage(p) {
    page.value = p
    load()
}

// initial: по умолчанию date = today
filters.date = todayYmd()
load()
</script>
