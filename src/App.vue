<template>
  <div>
    <nav class="app-nav">
      <div class="nav-inner">
        <router-link to="/orders">Orders</router-link>
        <router-link to="/sales">Sales</router-link>
        <router-link to="/incomes">Incomes</router-link>
        <router-link to="/stocks">Stocks</router-link>

        <div style="margin-left:auto; display:flex; gap:8px; align-items:center">
          <input v-model="tokenLocal" placeholder="Token" class="small-input"
            style="padding:6px 8px; border-radius:8px; border:1px solid #e6eef6" />
          <button class="button" @click="saveToken">Save</button>
        </div>
      </div>
    </nav>

    <main class="container">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const tokenLocal = ref('')
onMounted(() => { tokenLocal.value = localStorage.getItem('api_token') || '' })
function saveToken() { localStorage.setItem('api_token', tokenLocal.value); alert('Token saved') }
</script>

<style>
.small-input {
  font-size: 13px;
}
</style>
