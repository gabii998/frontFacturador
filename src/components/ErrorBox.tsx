import { ApiError } from '../services/api'

export default function ErrorBox({ error }: { error?: unknown }) {
  if (!error) return null

  let message: string

  if (error instanceof ApiError) {
    const suffix = error.message?.trim() || 'Error desconocido'
    message = `${error.status} ${suffix}`
  } else if (error instanceof Error) {
    message = error.message
  } else {
    message = String(error)
  }

  return (
    <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">
      {message}
    </div>
  )
}
