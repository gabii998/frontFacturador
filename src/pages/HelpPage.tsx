import { Link } from 'react-router-dom'

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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-0">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-blue-600">Centro de ayuda</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Respondemos las dudas frecuentes de Facturador</h1>
            <p className="mt-3 text-sm text-slate-600">
              Reunimos los pasos básicos para operar, guías sobre comprobantes y enlaces para que puedas contactarnos si necesitás soporte.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Volver al panel
          </Link>
        </header>

        <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Cómo comenzar</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {quickStart.map((step) => (
              <article key={step.title} className="space-y-2">
                <p className="text-sm font-semibold text-blue-600">{step.title}</p>
                <p className="text-sm text-slate-600">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Temas destacados</h2>
          <div className="space-y-6">
            {helpTopics.map((topic) => (
              <article key={topic.title} className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-800">{topic.title}</h3>
                <ul className="space-y-2">
                  {topic.items.map((item) => (
                    <li key={item} className="text-sm text-slate-600">
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50 p-8">
          <h2 className="text-lg font-semibold text-blue-900">¿Necesitás más ayuda?</h2>
          <p className="text-sm text-blue-900/80">
            Escribinos a <a className="font-medium underline" href="mailto:soporte@facturador.app">soporte@facturador.app</a> para recibir asistencia personalizada.
          </p>
          <div className="grid gap-4 text-sm text-blue-900/80 sm:grid-cols-2">
            <Link to="/politica-privacidad" className="hover:text-blue-800 hover:underline">
              Revisar la política de privacidad
            </Link>
            <Link to="/eliminar-datos" className="hover:text-blue-800 hover:underline">
              Solicitar eliminación de datos
            </Link>
            <Link to="/terminos-condiciones" className="hover:text-blue-800 hover:underline">
              Ver términos y condiciones del servicio
            </Link>
            <a href="https://www.afip.gob.ar" target="_blank" rel="noreferrer" className="hover:text-blue-800 hover:underline">
              Ir al sitio de AFIP para más recursos oficiales
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
