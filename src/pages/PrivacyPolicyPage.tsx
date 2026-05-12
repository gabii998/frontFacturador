import { Link } from 'react-router-dom'
import PublicContentLayout from '../components/PublicContentLayout'

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
    <PublicContentLayout
      eyebrow="Política de privacidad"
      title="Tu información, tratada con responsabilidad"
      subtitle="Esta política describe cómo manejamos los datos personales y operativos que ingresás en Facturador, con criterios claros de seguridad y confidencialidad."
      action={(
        <Link to="/eliminar-datos" className="btn btn-primary">
          Solicitar eliminación de datos
        </Link>
      )}
    >
      <div className="public-document">
        <p className="public-document-meta">Última actualización: Octubre 2025</p>
        <div className="public-article-list">
          {sections.map((section) => (
            <section key={section.title} className="public-article">
              <h2>{section.title}</h2>
              <div>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>
                  {paragraph.startsWith('- ') ? `• ${paragraph.slice(2)}` : paragraph}
                </p>
              ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </PublicContentLayout>
  )
}
