import { IonButton, IonCard, IonCardContent } from '@ionic/react'
import { useNavigate } from 'react-router-dom'
import DocumentSections, { type DocumentSection } from '../components/DocumentSections'
import PageHeroCard from '../components/PageHeroCard'

const sections: DocumentSection[] = [
  {
    title: '1. Introduccion',
    paragraphs: [
      'Estos Terminos y Condiciones regulan el acceso y uso de Facturador.',
      'Al utilizar la app aceptas estos terminos y la politica de privacidad.'
    ]
  },
  {
    title: '2. Descripcion del servicio',
    paragraphs: [
      'Facturador facilita emision, gestion y almacenamiento de facturas electronicas segun AFIP.'
    ]
  },
  {
    title: '3. Registro y uso del servicio',
    paragraphs: [
      'Para utilizar la app debes ser mayor de 18 anos, ingresar informacion veraz y proteger tus credenciales.'
    ]
  },
  {
    title: '4. Responsabilidad del usuario',
    paragraphs: [
      'El usuario debe usar la app con fines legales y segun normativa tributaria.',
      'No se permite emitir comprobantes falsos ni alterar registros.'
    ]
  },
  {
    title: '5. Limitacion de responsabilidad',
    paragraphs: [
      'El servicio se brinda segun disponibilidad. No garantizamos ausencia total de fallos.',
      'No respondemos por danos derivados del uso indebido o imposibilidad de uso.'
    ]
  },
  {
    title: '6. Propiedad intelectual',
    paragraphs: [
      'Los derechos del software, diseno y marcas pertenecen a sus titulares.',
      'No se permite copiar o distribuir sin autorizacion.'
    ]
  },
  {
    title: '7. Privacidad y datos',
    paragraphs: [
      'El tratamiento de datos personales se rige por la Politica de Privacidad.'
    ],
    link: {
      label: 'Ver politica de privacidad',
      href: 'https://facturador-ascurra-soluciones.web.app/politica-privacidad'
    }
  },
  {
    title: '8. Modificaciones',
    paragraphs: [
      'Podemos modificar estos terminos. El uso continuo implica aceptacion de la version vigente.'
    ]
  },
  {
    title: '9. Suspension o terminacion',
    paragraphs: [
      'Podemos suspender acceso ante uso indebido o incumplimiento.'
    ]
  },
  {
    title: '10. Ley aplicable y jurisdiccion',
    paragraphs: [
      'Estos terminos se rigen por leyes de la Republica Argentina y jurisdiccion de Mendoza.'
    ]
  }
]

export default function TermsConditionsPage() {
  const navigate = useNavigate()

  return (
    <div className="page-bg">
      <div className="page-shell">
        <PageHeroCard
          eyebrow="Terminos y Condiciones"
          title="Condiciones para operar con Facturador"
          description="Lee atentamente estas condiciones antes de usar la aplicacion."
          action={(
            <IonButton fill="outline" onClick={() => navigate('/login')}>
              Ir al inicio de sesion
            </IonButton>
          )}
        />

        <IonCard className="surface-card mt-8 ring-1 ring-slate-200">
          <IonCardContent>
            <p className="text-xs uppercase tracking-wide text-slate-400">Ultima actualizacion</p>
            <p className="body-copy mt-1">15 de octubre de 2025</p>
            <DocumentSections sections={sections} ordered className="mt-6 space-y-6" />
          </IonCardContent>
        </IonCard>
      </div>
    </div>
  )
}
