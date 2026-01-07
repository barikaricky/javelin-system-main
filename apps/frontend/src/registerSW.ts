import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('🔄 PWA: New version available!');
    if (confirm('New version available! Reload to update?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('✅ PWA: App ready to work offline');
  },
  onRegistered(registration) {
    console.log('✅ PWA: Service Worker registered', registration);
  },
  onRegisterError(error) {
    console.error('❌ PWA: Service Worker registration failed', error);
  },
});

console.log('🚀 PWA: Service Worker registration initiated');

export default updateSW;
