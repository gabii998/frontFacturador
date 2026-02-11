import { post } from './api'

export interface DataDeletionPayload {
  email: string
}

export const requestDataDeletion = async (payload: DataDeletionPayload): Promise<void> => {
  await post('/api/privacy/data-deletion', payload, {
    includeAuthHeader: false,
    skipAuthHandling: true
  })
}
