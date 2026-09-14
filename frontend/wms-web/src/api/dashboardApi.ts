import type { Dashboard } from '../types/dashboard'

export async function getDashboard(): Promise<Dashboard> {
  const response = await fetch('/api/dashboard')

  if (!response.ok) {
    throw new Error('Dashboard bilgileri alınamadı.')
  }

  return response.json()
}
