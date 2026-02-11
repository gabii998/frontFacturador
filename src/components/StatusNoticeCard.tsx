import { IonCard, IonCardContent } from '@ionic/react'
import type { ReactNode } from 'react'

type NoticeTone = 'neutral' | 'info' | 'warning'

type StatusNoticeCardProps = {
  children: ReactNode
  tone?: NoticeTone
}

const CARD_TONE_CLASS: Record<NoticeTone, string> = {
  neutral: 'border border-slate-200 bg-white',
  info: 'border border-blue-200 bg-blue-50',
  warning: 'border border-amber-200 bg-amber-50'
}

const CONTENT_TONE_CLASS: Record<NoticeTone, string> = {
  neutral: 'body-copy',
  info: 'text-sm text-blue-800',
  warning: 'text-sm text-amber-900'
}

export default function StatusNoticeCard({ children, tone = 'neutral' }: StatusNoticeCardProps) {
  return (
    <IonCard className={CARD_TONE_CLASS[tone]}>
      <IonCardContent className={CONTENT_TONE_CLASS[tone]}>
        {children}
      </IonCardContent>
    </IonCard>
  )
}
