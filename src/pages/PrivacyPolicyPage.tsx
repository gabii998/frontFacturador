import { IonButton, IonCard, IonCardContent } from '@ionic/react'
import { useNavigate } from 'react-router-dom'
import DocumentSections, { type DocumentSection } from '../components/DocumentSections'
import PageHeroCard from '../components/PageHeroCard'

const sections: DocumentSection[] = [
  {
    title: '1. Introduccion',
    paragraphs: [
      'Esta Politica de Privacidad describe como Facturador recopila, utiliza y protege los datos personales de sus usuarios.',
      'Nos comprometemos a la confidencialidad y seguridad de la informacion en linea con la normativa argentina aplicable.'
    ]
  },
  {
    title: '2. Responsable del tratamiento',
    paragraphs: [
      'Nombre del responsable: Gabriel Ascurra.',
      'Domicilio: San Isidro 2028, Rivadavia, Mendoza, Argentina.'
    ]
  },
  {
    title: '3. Datos personales que recopilamos',
    paragraphs: [
      'La App puede almacenar CUIT/CUIL, nombre o razon social, domicilio fiscal y datos de facturacion.',
      'Estos datos pueden ser ingresados por el usuario o provenientes de integraciones con AFIP.'
    ]
  },
  {
    title: '4. Finalidad del tratamiento',
    paragraphs: [
      'Emitir facturas electronicas mediante servicios web de AFIP.',
      'Mantener historial de comprobantes y cumplir obligaciones legales.',
      'Permitir consulta, exportacion y descarga de comprobantes.'
    ]
  },
  {
    title: '5. Conservacion de los datos',
    paragraphs: [
      'Los datos se conservan mientras la cuenta este activa o exista obligacion legal.',
      'Luego se eliminan o anonimizan de forma segura.'
    ]
  },
  {
    title: '6. Seguridad de la informacion',
    paragraphs: [
      'Aplicamos medidas tecnicas y organizativas para proteger la informacion.',
      'Ningun sistema es invulnerable, pero reducimos riesgos de manera continua.'
    ]
  },
  {
    title: '7. Cesion o transferencia',
    paragraphs: [
      'No compartimos datos con terceros salvo requerimiento legal o necesidades tecnicas de operacion bajo acuerdos de confidencialidad.'
    ]
  },
  {
    title: '8. Servicios de terceros',
    paragraphs: [
      'La app puede integrarse con servicios externos para su funcionamiento. Recomendamos revisar sus politicas de privacidad.'
    ]
  },
  {
    title: '9. Modificaciones',
    paragraphs: [
      'Podemos actualizar esta politica. Los cambios relevantes se notificaran por los canales habituales.'
    ]
  }
]

export default function PrivacyPolicyPage() {
  const navigate = useNavigate()

  return (
    <div className="page-bg">
      <div className="page-shell">
        <PageHeroCard
          eyebrow="Politica de privacidad"
          title="Tu informacion, tratada con responsabilidad"
          description="Esta politica describe como manejamos los datos personales y operativos en Facturador."
          action={(
            <IonButton fill="outline" onClick={() => navigate('/')}>
              Volver al panel
            </IonButton>
          )}
        />

        <IonCard className="surface-card mt-8 ring-1 ring-slate-200">
          <IonCardContent className="space-y-8">
            <DocumentSections sections={sections} />
          </IonCardContent>
        </IonCard>

        <p className="caption-copy mt-6">Ultima actualizacion: Octubre 2025</p>
      </div>
    </div>
  )
}
