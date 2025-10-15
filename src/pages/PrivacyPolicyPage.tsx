import { Link } from 'react-router-dom'

const sections = [
  {
    title: '1. Introducción',
    paragraphs: [
      'Esta Política de Privacidad describe cómo Facturador (en adelante, “la App”, “nosotros” o “nuestro servicio”) recopila, utiliza y protege los datos personales de los usuarios que utilizan nuestra plataforma de facturación electrónica.',
      'Nos comprometemos a garantizar la confidencialidad y seguridad de la información de acuerdo con la Ley N.º 25.326 de Protección de los Datos Personales de la República Argentina y las normas complementarias dictadas por la Agencia de Acceso a la Información Pública (AAIP).'
    ]
  },
  {
    title: '2. Responsable del tratamiento de datos',
    paragraphs: [
      'Nombre del responsable: Gabriel Ascurra',
      'Domicilio: San Isidro 2028, Rivadavia , Mendoza, Argentina'
    ]
  },
  {
    title: '3. Datos personales que recopilamos',
    paragraphs: [
      'La App recopila y almacena los siguientes datos con el único fin de permitir la emisión, gestión y almacenamiento de comprobantes fiscales:',
      '- CUIT o CUIL',
      '- Nombre o razón social',
      '- Domicilio fiscal',
      '- Datos de facturación',
      'Estos datos pueden ser ingresados por el propio usuario o recibidos de sistemas externos (por ejemplo, la API de AFIP).'
    ]
  },
  {
    title: '4. Finalidad del tratamiento',
    paragraphs: [
      'Los datos se utilizan exclusivamente para:',
      '- Emitir facturas electrónicas a través de los servicios web de AFIP.',
      '- Mantener un registro histórico de los comprobantes emitidos.',
      '- Cumplir con obligaciones fiscales y legales.',
      '- Permitir al usuario consultar, exportar o descargar sus comprobantes.',
      'No utilizamos los datos con fines comerciales, publicitarios ni de perfilado.'
    ]
  },
  {
    title: '5. Conservación de los datos',
    paragraphs: [
      'Los datos personales se conservarán mientras el usuario mantenga una cuenta activa o mientras sea necesario para cumplir con las obligaciones fiscales y legales vigentes.',
      'Una vez vencido ese plazo, los datos serán eliminados o anonimizados de manera segura.'
    ]
  },
  {
    title: '6. Seguridad de la información',
    paragraphs: [
      'Implementamos medidas técnicas y organizativas adecuadas para proteger la información, incluyendo cifrado, control de acceso, y almacenamiento en servidores seguros.',
      'Ningún sistema es 100% invulnerable, pero trabajamos continuamente para minimizar los riesgos.'
    ]
  },
  {
    title: '7. Cesión o transferencia de datos',
    paragraphs: [
      'No compartimos ni transferimos datos personales a terceros, salvo que sea necesario para:',
      '- Cumplir con obligaciones legales ante la AFIP u organismos gubernamentales.',
      '- Prestar servicios tecnológicos esenciales (por ejemplo, hosting o almacenamiento en la nube), los cuales están sujetos a acuerdos de confidencialidad.'
    ]
  },
  {
    title: '8. Uso de servicios de terceros',
    paragraphs: [
      'La App puede integrarse con servicios externos (por ejemplo, AFIP Web Services, Firebase o Cloudflare R2) para el correcto funcionamiento del sistema.',
      'Estos servicios cuentan con sus propias políticas de privacidad, que recomendamos consultar.'
    ]
  },
  {
    title: '9. Modificaciones a esta política',
    paragraphs: [
      'Nos reservamos el derecho de actualizar esta Política de Privacidad.',
      'En caso de cambios relevantes, notificaremos a los usuarios por los medios habituales (correo electrónico o notificación en la app).'
    ]
  }
]

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-0">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-blue-600">Politica de privacidad</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Tu informacion, tratada con responsabilidad</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              Esta politica describe como manejamos los datos personales y operativos que ingresas en Facturador.
              Buscamos ser claros para que sepas en todo momento como cuidamos tu informacion.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Volver al panel
          </Link>
        </header>

        <div className="mt-10 space-y-10 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-xl font-semibold text-slate-800">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-relaxed text-slate-600">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <p className="mt-8 text-xs text-slate-500">Ultima actualizacion: Octubre 2025</p>
      </div>
    </div>
  )
}
