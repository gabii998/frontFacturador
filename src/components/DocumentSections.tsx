export type DocumentSectionLink = {
  label: string
  href: string
}

export type DocumentSection = {
  title: string
  paragraphs: string[]
  link?: DocumentSectionLink
}

type DocumentSectionsProps = {
  sections: DocumentSection[]
  ordered?: boolean
  className?: string
}

const itemClassName = 'space-y-2'
const titleClassName = 'text-xl font-semibold text-slate-800'
const paragraphsClassName = 'space-y-2 text-sm leading-relaxed text-slate-600'

const DocumentSections = ({
  sections,
  ordered = false,
  className = 'space-y-8'
}: DocumentSectionsProps) => {
  if (ordered) {
    return (
      <ol className={className}>
        {sections.map(({ title, paragraphs, link }) => (
          <li key={title} className={itemClassName}>
            <h2 className={titleClassName}>{title}</h2>
            <div className={paragraphsClassName}>
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {link && (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                >
                  {link.label}
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
    )
  }

  return (
    <div className={className}>
      {sections.map(({ title, paragraphs, link }) => (
        <section key={title} className={itemClassName}>
          <h2 className={titleClassName}>{title}</h2>
          <div className={paragraphsClassName}>
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {link && (
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
              >
                {link.label}
              </a>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}

export default DocumentSections
