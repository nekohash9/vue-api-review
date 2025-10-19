// src/utils/date.js
export function todayYmd() {
  return new Date().toISOString().slice(0, 10)
}
export function daysAgoYmd(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}
