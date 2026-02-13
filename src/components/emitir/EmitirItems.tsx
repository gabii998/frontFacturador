import { IonButton, IonCard, IonCardContent, IonIcon, IonInput } from '@ionic/react'
import { removeOutline } from 'ionicons/icons'
import type { FacturaItem } from '../../models/afip'
import FormItemField from '../FormItemField'

const toFiniteNumber = (value: string | number | null | undefined) => {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0)
  return Number.isNaN(parsed) ? 0 : parsed
}

export const ItemCard = ({
  item,
  index,
  totalItems,
  onRemove,
  onUpdate
}: {
  item: FacturaItem
  index: number
  totalItems: number
  onRemove: (index: number) => void
  onUpdate: (index: number, patch: Partial<Pick<FacturaItem, 'descripcion' | 'cantidad' | 'precioUnitario'>>) => void
}) => (
  <IonCard className="item-card">
    <IonCardContent>
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Item #{index + 1}</span>
        {totalItems > 1 && (
          <IonButton
            type="button"
            size="small"
            fill="clear"
            color="danger"
            className='remove'
            onClick={() => onRemove(index)}
          >
            <IonIcon icon={removeOutline} slot="start" />
            Quitar
          </IonButton>
        )}
      </div>
      <FormItemField label="Descripcion">
          <IonInput
            value={item.descripcion}
            onIonInput={e => onUpdate(index, { descripcion: e.detail.value ?? '' })}
          />
        </FormItemField>
      <div className="item-container">
        
        <FormItemField label="Cantidad">
          <IonInput
            type="number"
            min={0}
            step="0.01"
            value={String(item.cantidad)}
            onIonInput={e => onUpdate(index, { cantidad: toFiniteNumber(e.detail.value) })}
          />
        </FormItemField>
        <FormItemField label="Precio unitario">
          <IonInput
            type="number"
            min={0}
            step="0.01"
            value={String(item.precioUnitario)}
            onIonInput={e => onUpdate(index, { precioUnitario: toFiniteNumber(e.detail.value) })}
          />
        </FormItemField>
      </div>
    </IonCardContent>
  </IonCard>
)

export const TotalSummary = ({ totalAmount }: { totalAmount: number }) => (
  <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
    <span>Total estimado</span>
    <span className="text-base font-semibold text-slate-900">
      {new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 2
      }).format(totalAmount)}
    </span>
  </div>
)
