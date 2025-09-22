import type { PuntoVenta } from '../models/afip'
export default function PuntosVentaTable({data}:{data:PuntoVenta[]}){
  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Puntos de venta</h2>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr className="border-b">
              <th className="th">Nro</th>
              <th className="th">Emisión</th>
              <th className="th">Bloqueado</th>
              <th className="th">Baja</th>
            </tr>
          </thead>
          <tbody>
            {data.map(pv => (
              <tr key={pv.nro} className="border-b">
                <td className="td font-medium">{pv.nro}</td>
                <td className="td">{pv.emisionTipo}</td>
                <td className="td">{pv.bloqueado ? 'Sí' : 'No'}</td>
                <td className="td">{pv.fchBaja ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}