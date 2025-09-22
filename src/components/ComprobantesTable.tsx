import type { ComprobanteEmitido } from '../models/afip'
export default function ComprobantesTable({data}:{data:ComprobanteEmitido[]}){
  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Comprobantes</h2>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr className="border-b">
              <th className="th">PV</th>
              <th className="th">Tipo</th>
              <th className="th">Número</th>
              <th className="th">Fecha</th>
              <th className="th">Total</th>
              <th className="th">CAE</th>
              <th className="th">Vto</th>
            </tr>
          </thead>
          <tbody>
            {data.map(c => (
              <tr key={`${c.puntoVenta}-${c.tipoAfip}-${c.numero}`} className="border-b">
                <td className="td">{c.puntoVenta}</td>
                <td className="td">{c.tipoAfip}</td>
                <td className="td font-medium">{c.numero}</td>
                <td className="td">{c.fechaCbte ?? '-'}</td>
                <td className="td">{c.impTotal ?? '-'}</td>
                <td className="td">{c.cae ?? '-'}</td>
                <td className="td">{c.caeVto ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}