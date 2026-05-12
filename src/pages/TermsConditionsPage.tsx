import { Link } from 'react-router-dom'
import PublicContentLayout from '../components/PublicContentLayout'

const sections = [
  {
    title: '1. Introducción',
    paragraphs: [
      'Estos Términos y Condiciones regulan el acceso y uso de la aplicación Facturador (en adelante, “la App”), desarrollada por Ascurra Soluciones.',
      'Al descargar, acceder o utilizar la App, el usuario acepta quedar vinculado por los presentes Términos y por nuestra Política de Privacidad.',
      'Si no estás de acuerdo con alguna de las condiciones aquí establecidas, te recomendamos no utilizar la aplicación.'
    ]
  },
  {
    title: '2. Descripción del servicio',
    paragraphs: [
      'Facturador es una aplicación destinada a facilitar la emisión, gestión y almacenamiento de facturas electrónicas conforme a los requisitos de la Administración Federal de Ingresos Públicos (AFIP).',
      'El servicio permite registrar datos fiscales, generar comprobantes electrónicos y acceder al historial de facturación.'
    ]
  },
  {
    title: '3. Registro y uso del servicio',
    paragraphs: [
      'Para utilizar la App, el usuario debe:'
    ],
    bullets: [
      'Ser mayor de 18 años.',
      'Ingresar información veraz, completa y actualizada.',
      'Mantener la confidencialidad de sus credenciales de acceso.'
    ],
    closing: [
      'El usuario es el único responsable por la veracidad de los datos ingresados y por el uso de la aplicación bajo su cuenta.'
    ]
  },
  {
    title: '4. Responsabilidad del usuario',
    paragraphs: [
      'El usuario se compromete a utilizar la App exclusivamente para fines legales y conforme a la normativa tributaria vigente.',
      'Está prohibido utilizar la plataforma para emitir comprobantes falsos, alterar registros o realizar actividades ilícitas.',
      'Ascurra Soluciones no se responsabiliza por errores en los datos ingresados por el usuario ni por las consecuencias fiscales o legales derivadas del uso indebido de la aplicación.'
    ]
  },
  {
    title: '5. Limitación de responsabilidad',
    paragraphs: [
      'La App se ofrece “tal cual” y “según disponibilidad”.',
      'Aunque tomamos todas las medidas razonables para garantizar su correcto funcionamiento, no garantizamos que esté libre de errores, interrupciones o fallos en la comunicación con los servicios de AFIP.',
      'En ningún caso Ascurra Soluciones será responsable por daños directos, indirectos o consecuentes derivados del uso o imposibilidad de uso de la App.'
    ]
  },
  {
    title: '6. Propiedad intelectual',
    paragraphs: [
      'Todos los derechos de propiedad intelectual sobre el software, diseño, logotipos, marcas y contenido de la App pertenecen a Ascurra Soluciones o a sus respectivos titulares.',
      'Está prohibido copiar, modificar, distribuir o crear obras derivadas sin autorización previa y por escrito.'
    ]
  },
  {
    title: '7. Privacidad y protección de datos',
    paragraphs: [
      'El tratamiento de los datos personales se rige por la Política de Privacidad, disponible en:'
    ],
    link: {
      label: 'Politica de privacidad',
      href: 'https://facturador-ascurra-soluciones.web.app/politica-privacidad'
    }
  },
  {
    title: '8. Modificaciones',
    paragraphs: [
      'Nos reservamos el derecho de modificar estos Términos en cualquier momento.',
      'Las versiones actualizadas se publicarán en esta página, indicando la fecha de la última revisión.',
      'El uso continuado de la App tras una actualización implica la aceptación de los nuevos términos.'
    ]
  },
  {
    title: '9. Suspensión o terminación del servicio',
    paragraphs: [
      'Podemos suspender o cancelar el acceso a la App si detectamos uso indebido, incumplimiento de estos términos o actividades que pongan en riesgo la seguridad o el cumplimiento legal del sistema.'
    ]
  },
  {
    title: '10. Ley aplicable y jurisdicción',
    paragraphs: [
      'Estos Términos se rigen por las leyes de la República Argentina.',
      'Ante cualquier controversia, las partes se someten a la jurisdicción de los tribunales ordinarios de la ciudad de Mendoza, Argentina.'
    ]
  }
]

export default function TermsConditionsPage() {
  return (
    <PublicContentLayout
      eyebrow="Términos y condiciones"
      title="Condiciones para operar con Facturador"
      subtitle="Leé atentamente estas condiciones. Al continuar utilizando la aplicación aceptás cada uno de los puntos detallados más abajo."
      action={(
        <Link to="/" className="btn btn-primary">
          Volver al inicio
        </Link>
      )}
    >
      <div className="public-document">
        <p className="public-document-meta">Última actualización: 15 de octubre de 2025</p>
        <ol className="public-article-list">
            {sections.map(({ title, paragraphs = [], bullets, closing = [], link }) => (
              <li key={title} className="public-article">
                <h2>{title}</h2>
                <div>
                  {paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {bullets && (
                    <ul>
                      {bullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {link && (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="public-link inline-flex"
                    >
                      {link.label}
                    </a>
                  )}
                  {closing.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </li>
            ))}
        </ol>
      </div>
    </PublicContentLayout>
  )
}
