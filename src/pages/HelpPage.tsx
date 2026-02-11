import { IonButton, IonCard, IonCardContent, IonItem, IonLabel } from '@ionic/react'
import { useNavigate } from 'react-router-dom'
import PageHeroCard from '../components/PageHeroCard'

const quickStart = [
  {
    title: '1. Prepara tu cuenta',
    description:
      'Verifica que tu token de AFIP este vigente y que tengas configurados los datos fiscales basicos en Configuracion.'
  },
  {
    title: '2. Carga tus puntos de venta',
    description:
      'Ingresa a Puntos de venta para sincronizar los puntos habilitados en AFIP y poder emitir comprobantes.'
  },
  {
    title: '3. Emite tu primer comprobante',
    description:
      'Desde Emitir sigue los pasos guiados. La app valida automaticamente la informacion obligatoria antes de enviar a AFIP.'
  }
]

const helpTopics = [
  {
    title: 'Gestion de comprobantes',
    items: [
      'El tablero principal muestra resumen de ultimos comprobantes y sus estados.',
      'Puedes descargar en PDF desde la seccion Comprobantes.',
      'Si emites en lote, usa la opcion de carga masiva con plantilla.'
    ]
  },
  {
    title: 'Tokens y vencimientos',
    items: [
      'Controlamos el vencimiento de certificados al ingresar a la app.',
      'Recibiras alertas cuando un token este proximo a expirar.'
    ]
  },
  {
    title: 'Privacidad y datos personales',
    items: [
      'Tus datos se protegen segun la politica de privacidad.',
      'Puedes solicitar eliminacion de datos cuando lo necesites.'
    ]
  }
]

export default function HelpPage() {
  const navigate = useNavigate()

  return (
    <div className="page-bg">
      <div className="page-shell flex flex-col gap-8">
        <PageHeroCard
          eyebrow="Centro de ayuda"
          title="Preguntas frecuentes de Facturador"
          description="Reunimos pasos basicos para operar, guias de comprobantes y enlaces de soporte."
          action={(
            <IonButton fill="outline" onClick={() => navigate('/')}>
              Volver al panel
            </IonButton>
          )}
        />

        <IonCard className="surface-card">
          <IonCardContent>
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Como comenzar</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {quickStart.map((step) => (
                <article key={step.title} className="space-y-2 rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-blue-600">{step.title}</p>
                  <p className="body-copy">{step.description}</p>
                </article>
              ))}
            </div>
          </IonCardContent>
        </IonCard>

        <IonCard className="surface-card">
          <IonCardContent>
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Temas destacados</h2>
            <div className="space-y-5">
              {helpTopics.map((topic) => (
                <article key={topic.title} className="space-y-3">
                  <h3 className="text-lg font-semibold text-slate-800">{topic.title}</h3>
                  {topic.items.map((item) => (
                    <IonItem key={item} lines="none" className="rounded-lg border border-slate-100 bg-slate-50">
                      <IonLabel>{item}</IonLabel>
                    </IonItem>
                  ))}
                </article>
              ))}
            </div>
          </IonCardContent>
        </IonCard>

        <IonCard className="border border-blue-100 bg-blue-50">
          <IonCardContent>
            <h2 className="text-lg font-semibold text-blue-900">Necesitas mas ayuda?</h2>
            <p className="mt-2 text-sm text-blue-900/80">
              Escribenos a <a className="font-medium underline" href="mailto:soporte@facturador.app">soporte@facturador.app</a>.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <IonButton fill="clear" size="small" onClick={() => navigate('/politica-privacidad')}>Politica de privacidad</IonButton>
              <IonButton fill="clear" size="small" onClick={() => navigate('/eliminar-datos')}>Eliminar datos</IonButton>
              <IonButton fill="clear" size="small" onClick={() => navigate('/terminos-condiciones')}>Terminos y condiciones</IonButton>
              <IonButton fill="clear" size="small" href="https://www.afip.gob.ar" target="_blank" rel="noreferrer">Sitio AFIP</IonButton>
            </div>
          </IonCardContent>
        </IonCard>
      </div>
    </div>
  )
}
