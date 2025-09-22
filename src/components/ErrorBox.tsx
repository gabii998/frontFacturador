export default function ErrorBox({error}:{error?:unknown}){
  if(!error) return null
  const msg = error instanceof Error ? error.message : String(error)
  return <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">{msg}</div>
}