import { post } from './api'

export async function requestDataDeletion(email: string): Promise<void> {
  await post('/api/privacy/data-deletion', { email }, {
    includeAuthHeader: false,
    skipAuthHandling: true
  })
}
