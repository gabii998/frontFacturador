import { Fragment } from 'react/jsx-runtime'
import EmitirForm from '../components/EmitirForm'
import SectionHeader from '../components/SectionHeader'
import { CONSUMIDOR_FINAL_IDENTIFICATION_THRESHOLD } from '../config/afip'
import ComprobanteIcon from '../icon/ComprobanteIcon'
import HeaderPill from '../components/HeaderPill'
import EmitirIcon from '../icon/EmitirIcon'

const formatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0
})

const identificationThreshold = formatter.format(CONSUMIDOR_FINAL_IDENTIFICATION_THRESHOLD)

const EmitirPage = () => {
  return (
    <div className="space-y-6">
      <SectionHeader
        section='Emisión'
        title='Emití tus comprobantes desde un solo lugar'
        subtitle='Centralizá la operatoria con AFIP WSFE y generá comprobantes con validaciones automáticas y seguimiento en tiempo real.'
        icon={<EmitirIcon />}
        rightContent={<EmitirHeaderInfo />}
      />

      <section>
        <EmitirForm />
      </section>
    </div>
  )
}

const EmitirHeaderInfo = () => {
  return (
    <Fragment>
      <HeaderPill label='Servicio WSFE activo' dotColor='bg-emerald-500' />
      <HeaderPill label={`Umbral sin identificación: ${identificationThreshold}`} dotColor='bg-indigo-500' />
    </Fragment>
  )
}

export default EmitirPage;


