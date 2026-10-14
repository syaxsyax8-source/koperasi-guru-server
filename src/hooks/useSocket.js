// Socket.io diganti dengan Firebase Realtime Database
// Real-time sekarang langsung dari Firebase tanpa server terpisah

// Hook dummy agar import di GuruLayout dan AdminLayout tidak error
export function useAdminSocket() {}
export function useGuruSocket() {}
export function getSocket() { return null }
