import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { PostgresChangesPayload, RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeLicensesOptions {
  onLicenseChange: (payload: PostgresChangesPayload<Record<string, any>>) => void
  enabled?: boolean
  filter?: string
}

/**
 * Hook que escuta mudanças em tempo real na tabela `licenses` via Supabase Realtime (WebSocket).
 * Quando uma licença é ativada, desativada ou atualizada, o callback `onLicenseChange` é chamado
 * para disparar um refetch dos dados. Os eventos servem apenas como notificação de mudança.
 *
 * @param options.onLicenseChange - Callback executado quando uma licença muda (ex: refetch dos dados)
 * @param options.enabled - Se o listener deve estar ativo (default: true). Deve ser false quando o usuário não está logado.
 * @param options.filter - Filtro opcional no formato "column=eq.value" (ex: "user_id=eq.abc123")
 */
export function useRealtimeLicenses({
  onLicenseChange,
  enabled = true,
  filter,
}: UseRealtimeLicensesOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const callbackRef = useRef(onLicenseChange)

  // Manter a ref sempre atualizada com o callback mais recente
  useEffect(() => {
    callbackRef.current = onLicenseChange
  }, [onLicenseChange])

  useEffect(() => {
    if (!enabled) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      return
    }

    const channelName = `licenses-realtime-${filter || 'all'}-${Date.now()}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'licenses',
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          // Usar ref para sempre chamar o callback mais recente
          callbackRef.current(payload)
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [enabled, filter])

  return channelRef
}
