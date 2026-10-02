import { useEffect } from 'react'
import { Platform } from 'react-native'
import { requireOptionalNativeModule } from 'expo'

// Google Play In-App Updates: avisa quando há uma nova versão nativa na Play Store
// (as versões patch chegam por OTA, via useAppUpdates).
// Usa o fluxo imediato (tela cheia do Play, na abertura do app): no fluxo flexível
// a lib chama completeUpdate() assim que o download termina e reiniciaria o app no
// meio do uso. O usuário pode recusar; a checagem se repete na próxima abertura.
export function useStoreUpdates() {
  useEffect(() => {
    if (__DEV__ || Platform.OS !== 'android') return
    // Binários sem o módulo nativo (Expo Go, builds anteriores a ele) não podem
    // importar expo-in-app-updates: o import lança erro ao carregar.
    if (!requireOptionalNativeModule('ExpoInAppUpdates')) return

    async function checkStoreUpdate() {
      try {
        const ExpoInAppUpdates = await import('expo-in-app-updates')
        const result = await ExpoInAppUpdates.checkForUpdate()
        if (!result.updateAvailable || !result.immediateAllowed) return
        await ExpoInAppUpdates.startUpdate(true)
      } catch {
        // falha silenciosa — ex.: app não instalado pela Play Store
      }
    }

    void checkStoreUpdate()
  }, [])
}
