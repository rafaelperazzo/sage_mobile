import '../global.css'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '../src/contexts/AuthContext'
import { PeriodoProvider } from '../src/contexts/PeriodoContext'
import { useAppUpdates } from '../src/hooks/useAppUpdates'

export default function RootLayout() {
  useAppUpdates()
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider>
          <PeriodoProvider>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="login"
                options={{ title: 'Login', presentation: 'modal', headerShown: true }}
              />
              <Stack.Screen
                name="sobre"
                options={{ title: 'Sobre o SAGE', headerShown: true }}
              />
              <Stack.Screen
                name="grade-curricular"
                options={{ title: 'Grade Curricular', headerShown: true }}
              />
              <Stack.Screen
                name="disciplinas"
                options={{ title: 'Disciplinas', headerShown: true }}
              />
              <Stack.Screen
                name="salas-livres"
                options={{ title: 'Salas Livres Agora', headerShown: true }}
              />
              <Stack.Screen
                name="rural"
                options={{ title: 'SAGE Rural', headerShown: true }}
              />
              <Stack.Screen
                name="rural/create"
                options={{ title: 'Nova Alocação Rural', presentation: 'modal' }}
              />
              <Stack.Screen
                name="rural/[id]/edit"
                options={{ title: 'Editar Alocação Rural', presentation: 'modal' }}
              />
              <Stack.Screen
                name="rural/[id]/view"
                options={{ title: 'Alocação Rural', presentation: 'modal' }}
              />
              <Stack.Screen
                name="infra/[sala]/edit"
                options={{ title: 'Editar Infraestrutura', presentation: 'modal' }}
              />
              <Stack.Screen
                name="map/create"
                options={{ title: 'Nova Alocação', presentation: 'modal' }}
              />
              <Stack.Screen
                name="map/[id]/edit"
                options={{ title: 'Editar Alocação', presentation: 'modal' }}
              />
              <Stack.Screen
                name="map/[id]/view"
                options={{ title: 'Alocação', presentation: 'modal' }}
              />
              <Stack.Screen
                name="auditorio/create"
                options={{ title: 'Nova Reserva', presentation: 'modal' }}
              />
              <Stack.Screen
                name="auditorio/[id]/edit"
                options={{ title: 'Editar Reserva', presentation: 'modal' }}
              />
              <Stack.Screen
                name="auditorio/[id]/view"
                options={{ title: 'Reserva', presentation: 'modal' }}
              />
              <Stack.Screen
                name="manutencao/create"
                options={{ title: 'Novo Chamado', presentation: 'modal' }}
              />
              <Stack.Screen
                name="manutencao/[id]/edit"
                options={{ title: 'Editar Chamado', presentation: 'modal' }}
              />
              <Stack.Screen
                name="manutencao/[id]/view"
                options={{ title: 'Chamado', presentation: 'modal' }}
              />
            </Stack>
          </PeriodoProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
