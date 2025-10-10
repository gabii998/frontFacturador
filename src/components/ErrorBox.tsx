import { IconError404, IconExclamationCircle } from '@tabler/icons-react'
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

  return (<div className="card flex flex-col items-center gap-5 py-12 text-red-500 bg-red-100 w-100">
    <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br bg-white shadow-inner text-red-500">
      <IconExclamationCircle size="35px" />
    </div>
    <div className="space-y-2 text-center">
      <h2 className="text-lg font-semibold text-red-700">Ha ocurrido un error</h2>
      <p className="text-sm leading-relaxed">
        {message}
      </p>
    </div>
  </div>)
}
