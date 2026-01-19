import { useCallback, useEffect, useMemo, useState } from 'react'

import { getProviders } from '@/lib/api/providers'
import type { ModelRef, ProviderConfig, ProviderModel } from '@/types'

export interface ModelOption {
  providerID: string
  modelID: string
  name: string
  providerName: string
}

function flattenModels(providers: ProviderConfig[]): ModelOption[] {
  const options: ModelOption[] = []
  providers.forEach((provider) => {
    const providerName = provider.name?.replace(/OpenCode\s*/i, '').trim() || provider.id
    Object.values(provider.models).forEach((model: ProviderModel) => {
      options.push({
        providerID: model.providerID || provider.id,
        modelID: model.id,
        name: model.name || model.id,
        providerName,
      })
    })
  })
  return options
}

function resolveDefaultModel(
  providers: ProviderConfig[],
  defaults: Record<string, string>
): ModelRef | null {
  for (const provider of providers) {
    const modelID = defaults[provider.id]
    if (modelID && provider.models[modelID]) {
      return { providerID: provider.id, modelID }
    }
  }
  const firstProvider = providers[0]
  if (!firstProvider) return null
  const firstModel = Object.keys(firstProvider.models)[0]
  if (!firstModel) return null
  return { providerID: firstProvider.id, modelID: firstModel }
}

export function useModels(directory?: string) {
  const [providers, setProviders] = useState<ProviderConfig[]>([])
  const [defaults, setDefaults] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getProviders({ directory })
      setProviders(response.providers || [])
      setDefaults(response.default || {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models')
    } finally {
      setLoading(false)
    }
  }, [directory])

  useEffect(() => {
    refresh()
  }, [refresh])

  const options = useMemo(() => flattenModels(providers), [providers])
  const defaultModel = useMemo(() => resolveDefaultModel(providers, defaults), [providers, defaults])

  return { options, defaultModel, loading, error, refresh }
}
