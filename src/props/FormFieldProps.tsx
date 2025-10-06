export interface FormFielProps{
  label: string
  name: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  required?: boolean
  minLength?: number
  children?: React.ReactNode // para soportar <select>
}