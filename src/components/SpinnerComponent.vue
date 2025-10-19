<template>
    <div class="spinner" role="status" style="display:flex;align-items:center;justify-content:center;padding:18px">
        <svg width="32" height="32" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" stroke-width="5" stroke="rgba(0,0,0,0.1)" />
            <path d="M45 25a20 20 0 0 1-20 20" stroke="#111827" stroke-width="5" stroke-linecap="round" fill="none">
                <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s"
                    repeatCount="indefinite" />
            </path>
        </svg>
    </div>
</template>