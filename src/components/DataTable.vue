<template>
    <div class="card">
        <table class="table">
            <thead>
                <tr>
                    <th v-for="h in headers" :key="h">{{ h }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(row, rIndex) in rows" :key="row.id || rIndex">
                    <td v-for="k in keys" :key="k">{{ formatCell(row[k]) }}</td>
                </tr>
                <tr v-if="rows.length === 0">
                    <td :colspan="headers.length" class="small-muted">No data</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup>
const { headers = [], rows = [], keys = [] } = defineProps({
    headers: { type: Array, default: () => [] },
    rows: { type: Array, default: () => [] },
    keys: { type: Array, default: () => [] }
})

function formatCell(val) {
    if (val === null || val === undefined) return ''
    // pretty-print dates like YYYY-MM-DD HH:MM:SS -> only date
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T?/.test(val)) return val.slice(0, 19).replace('T', ' ')
    return val
}
</script>
