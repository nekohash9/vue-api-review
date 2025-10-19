<template>
    <div class="container">
        <h2>Orders</h2>

        <div class="card filters">
            <label>dateFrom <input type="date" v-model="filters.dateFrom" /></label>
            <label>dateTo <input type="date" v-model="filters.dateTo" /></label>
            <label>search <input v-model="filters.q" placeholder="search" /></label>
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
const filters = reactive({ dateFrom: '', dateTo: '', q: '' })
const page = ref(1)
const loading = ref(false)
const chartOptions = ref({})

// подписи и ключи для таблицы — под реальные поля ответа
const tableHeaders = ['G number', 'Date', 'Last change', 'Supplier article', 'Tech size', 'Barcode']
const tableKeys = ['g_number', 'date', 'last_change_date', 'supplier_article', 'tech_size', 'barcode']

// Загрузка 
async function load() {
    loading.value = true
    const dateFrom = filters.dateFrom || daysAgoYmd(7)
    const dateTo = filters.dateTo || todayYmd()
    try {
        const { items: raw, meta: m } = await fetchList('orders', {
            dateFrom,
            dateTo,
            page: page.value,
            limit: 100,
            extra: { q: filters.q || undefined }
        })

        console.log('raw orders sample:', raw && raw[0])

        if (!raw || !raw.length) {
            items.value = []
            meta.current_page = m.current_page || m.page || 1
            meta.last_page = m.last_page || Math.ceil((m.total || items.value.length) / (m.per_page || 100))
            buildChart()
            return
        }

        // нормализация — используем реально существующие поля (fallbacks на возможные названия)
        items.value = (raw || []).map(it => {
            return {
                // в этом API g_number однозначно есть — используем как ид
                g_number: it.g_number ?? it.number ?? it.id ?? null,
                // полная дата/время
                date: (it.date ?? it.created_at ?? it.created ?? '').slice(0, 19),
                last_change_date: (it.last_change_date ?? it.lastChangeDate ?? '').slice(0, 19),
                supplier_article: it.supplier_article ?? it.article ?? it.sku ?? '',
                tech_size: it.tech_size ?? it.size ?? '',
                barcode: it.barcode ?? it.bar_code ?? it.barCode ?? '',
                // оставим статус как есть, но он может отсутствовать
                status: it.status ?? it.order_status ?? it.state ?? 'unknown',
                raw: it
            }
        })

        // лог уникальных статусов (для информации)
        const uniq = {}
        for (const it of items.value) {
            const s = (it.status ?? 'unknown') + ''
            uniq[s] = (uniq[s] || 0) + 1
        }
        console.log('Unique order statuses (value -> count):', uniq)

        meta.current_page = m.current_page || m.page || 1
        meta.last_page = m.last_page || Math.ceil((m.total || items.value.length) / (m.per_page || 100))

        buildChart()
    } catch (e) {
        console.error('Orders load error', e)
        alert('Failed to load orders: ' + (e?.response?.data ? JSON.stringify(e.response.data) : e.message))
    } finally {
        loading.value = false
    }
}

// строим график по ДНЯМ (группируем по дате YYYY-MM-DD) — это даст несколько точек
function buildChart() {
    const map = {}
    for (const it of items.value) {
        // date в format 'YYYY-MM-DD HH:MM:SS' — первые 10 символов
        const d = (it.date || '').slice(0, 10) || 'unknown'
        map[d] = (map[d] || 0) + 1
    }
    const days = Object.keys(map).sort()
    chartOptions.value = {
        title: { text: 'Orders count by day' },
        tooltip: { trigger: 'axis' },
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
