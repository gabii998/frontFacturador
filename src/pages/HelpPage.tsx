import { Link } from 'react-router-dom'
import PublicContentLayout from '../components/PublicContentLayout'

const quickStart = [
  {
    title: '1. Prepará tu cuenta',
    description:
      'Verificá que tu token de AFIP esté vigente y que tengas configurados los datos fiscales básicos en el apartado de Configuración.'
  },
  {
    title: '2. Cargá tus puntos de venta',
    description:
      'Ingresá a Puntos de venta para sincronizar los puntos habilitados en AFIP. Esto asegura que puedas emitir comprobantes desde Facturador.'
  },
  {
    title: '3. Emití tu primer comprobante',
    description:
      'Desde la opción Emitir seguí los pasos guiados. La app valida automáticamente la información obligatoria antes de enviarla a AFIP.'
  }
]

const helpTopics = [
  {
    title: 'Gestión de comprobantes',
    items: [
      'El tablero principal muestra un resumen de los últimos comprobantes emitidos y sus estados.',
      'Podés descargar en formato PDF o XML desde la sección Comprobantes.',
      'Si emitís en lote, usá la opción de carga masiva con la plantilla que se indica en la página.'
    ]
  },
  {
    title: 'Tokens y vencimientos',
    items: [
      'Controlamos el vencimiento de los certificados cada vez que ingresás a la app.',
      'Recibirás alertas cuando un token esté próximo a expirar para que puedas renovarlo sin perder operatividad.'
    ]
  },
  {
    title: 'Privacidad y datos personales',
    items: [
      'Tus datos se protegen según nuestra Política de privacidad y no se comparten con terceros.',
      'Podés solicitar la eliminación de tus datos en cualquier momento desde la sección dedicada.'
    ]
  }
]

export default function HelpPage() {
  return (
    <PublicContentLayout
      eyebrow="Centro de ayuda"
      title="Respondemos las dudas frecuentes de Facturador"
      subtitle="Reunimos los pasos básicos para operar, guías sobre comprobantes y enlaces para que puedas contactarnos si necesitás soporte."
    >
      <section className="public-section">
        <h2 className="public-section__title">Cómo comenzar</h2>
        <div className="public-grid">
          {quickStart.map((step) => (
            <article key={step.title} className="public-info-card">
              <p>{step.title}</p>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section">
        <h2 className="public-section__title">Temas destacados</h2>
        <div className="public-topic-list">
          {helpTopics.map((topic) => (
            <article key={topic.title} className="public-topic">
              <h3>{topic.title}</h3>
              <ul>
                {topic.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section public-section--soft">
        <h2 className="public-section__title">¿Necesitás más ayuda?</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Escribinos a <a className="public-link" href="mailto:soporte@facturador.app">soporte@facturador.app</a> para recibir asistencia personalizada.
        </p>
        <div className="public-links">
          <Link to="/politica-privacidad">
            Revisar la política de privacidad
          </Link>
          <Link to="/eliminar-datos">
            Solicitar eliminación de datos
          </Link>
          <Link to="/terminos-condiciones">
            Ver términos y condiciones del servicio
          </Link>
          <a href="https://www.afip.gob.ar" target="_blank" rel="noreferrer">
            Ir al sitio de AFIP para más recursos oficiales
          </a>
        </div>
      </section>
    </PublicContentLayout>
  )
}
