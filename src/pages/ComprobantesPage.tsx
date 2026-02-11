import { Fragment, useEffect, useState } from 'react'
import { IonButton, IonCard, IonCardContent } from '@ionic/react'
import { useNavigate } from 'react-router-dom'
import { IconFileTypeXls, IconFilter, IconInfoCircle } from '@tabler/icons-react'
import { refreshOutline, searchOutline } from 'ionicons/icons'
import { AfipService } from '../services/afip'
import type { ComprobanteEmitido } from '../models/afip'
import ErrorBox from '../components/ErrorBox'
import ComprobantesTable from '../components/ComprobantesTable'
import SectionHeader from '../components/SectionHeader'
import ActionButtonsGroup from '../components/ActionButtonsGroup'
import EmptyContent from '../components/EmptyContent'
import LoadingContent from '../components/LoadingContent'
import FormFieldsArray, { type FormFieldConfig } from '../components/FormFieldsArray'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { useFormState } from '../hooks/useFormState'
import { ComprobanteHeaderInfoProps } from '../props/ComprobantesProps'

const DEFAULT_PV = 2
const DEFAULT_TIPO = 11
const DEFAULT_LIMITE = 20

type FiltrosValues = {
  pv: string
  tipo: string
  limite: string
}

const FILTER_FIELDS: FormFieldConfig<FiltrosValues>[] = [
  {
    name: 'pv',
    label: 'Punto de venta',
    type: 'number',
    variant: 'default'
  },
  {
    name: 'tipo',
    label: 'Tipo de factura',
    kind: 'select',
    variant: 'default',
    options: [
      { value: '1', label: 'Factura A' },
      { value: '6', label: 'Factura B' },
      { value: '11', label: 'Factura C' }
    ]
  },
  {
    name: 'limite',
    label: 'Ultimos N',
    type: 'number',
    variant: 'default'
  }
]

const parseNumber = (value: string, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const ComprobantesPage = () => {
  const { values, setField, setFields } = useFormState<FiltrosValues>({
    pv: String(DEFAULT_PV),
    tipo: String(DEFAULT_TIPO),
    limite: String(DEFAULT_LIMITE)
  })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const {
    data,
    loading,
    error,
    load
  } = useAsyncResource<ComprobanteEmitido[]>([])

  const fetchData = async (
    nextPv = values.pv,
    nextTipo = values.tipo,
    nextLimite = values.limite
  ) => {
    await load(() => AfipService.listar(
      parseNumber(nextPv, DEFAULT_PV),
      parseNumber(nextTipo, DEFAULT_TIPO),
      { limite: parseNumber(nextLimite, DEFAULT_LIMITE) }
    ))
  }

  useEffect(() => {
    void fetchData(String(DEFAULT_PV), String(DEFAULT_TIPO), String(DEFAULT_LIMITE))
  }, [])

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={<IconInfoCircle />}
        title="Comprobantes"
        subtitle="Consulta y audita tus ultimas emisiones agrupadas por punto de venta y tipo AFIP."
        rightContent={<ComprobanteHeaderInfo filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen} />}
      />

      <section className="space-y-6">
        {filtersOpen && (
          <FiltrosComprobantes
            loading={loading}
            values={values}
            setField={setField}
            setFields={setFields}
            fetchData={fetchData}
          />
        )}

        {loading && <LoadingContent />}
        <ErrorBox error={error} />
        {!loading && !error && (
          data.length > 0 ? (
            <ComprobantesTable data={data} />
          ) : (
            <EmptyContent
              title="No hay comprobantes para mostrar"
              subtitle="Ajusta los filtros o verifica que AFIP haya emitido comprobantes para este punto de venta y tipo."
              icon={<IconInfoCircle />}
            />
          )
        )}
      </section>
    </div>
  )
}

type FiltrosFormProps = {
  loading: boolean
  values: FiltrosValues
  setField: <K extends keyof FiltrosValues>(field: K, value: FiltrosValues[K]) => void
  setFields: (patch: Partial<FiltrosValues>) => void
  fetchData: (pv?: string, tipo?: string, limite?: string) => Promise<void>
}

const FiltrosComprobantes = ({ loading, values, setField, setFields, fetchData }: FiltrosFormProps) => (
  <IonCard className="card">
    <IonCardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-3">
        <div className="flex flex-col pb-1">
          <h2 className="text-lg font-semibold text-slate-800">Filtros de busqueda</h2>
          <p className="caption-copy">Ajusta los parametros para consultar comprobantes especificos.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <FormFieldsArray fields={FILTER_FIELDS} values={values} setField={setField} />
        </div>
      </div>
      <ActionButtonsGroup
        className="flex flex-col gap-3 lg:w-[280px]"
        secondary={{
          label: 'Restablecer',
          icon: refreshOutline,
          onClick: () => {
            setFields({
              pv: String(DEFAULT_PV),
              tipo: String(DEFAULT_TIPO),
              limite: String(DEFAULT_LIMITE)
            })
            void fetchData(String(DEFAULT_PV), String(DEFAULT_TIPO), String(DEFAULT_LIMITE))
          }
        }}
        primary={{
          label: 'Buscar',
          loadingLabel: 'Consultando...',
          loading,
          icon: searchOutline,
          onClick: () => {
            void fetchData(values.pv, values.tipo, values.limite)
          }
        }}
      />
    </IonCardContent>
  </IonCard>
)

const ComprobanteHeaderInfo = (props: ComprobanteHeaderInfoProps) => {
  const enableExcel = import.meta.env.VITE_ENABLE_EXCEL_UPLOAD ?? false
  const navigate = useNavigate()
  return (
    <Fragment>
      <IonButton fill="outline" onClick={() => props.setFiltersOpen(prev => !prev)}>
        <IconFilter /> {props.filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
      </IonButton>

      {enableExcel && (
        <IonButton color="success" fill="outline" onClick={() => navigate('/comprobantes/carga-masiva')}>
          <IconFileTypeXls /> Cargar excel
        </IonButton>
      )}
    </Fragment>
  )
}

export default ComprobantesPage
