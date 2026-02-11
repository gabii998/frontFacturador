import { IonBadge } from '@ionic/react'
import { Step } from '../props/Step'

const Steper = ({ steps }: { steps: Step[] }) => {
  return (
    <ol className="w-full space-y-4 sm:flex sm:space-x-8 sm:space-y-0 rtl:space-x-reverse">
      {steps.map((step, index) => (
        <li
          key={index}
          className={`flex items-center space-x-2.5 rtl:space-x-reverse ${step.isActive ? 'text-blue-700' : 'text-slate-500'}`}
        >
          <IonBadge
            color={step.isActive ? 'primary' : 'medium'}
            className="flex h-8 w-8 items-center justify-center rounded-full"
          >
            {index + 1}
          </IonBadge>
          <span>
            <h3 className="font-medium leading-tight">{step.title}</h3>
            <p className="text-sm">{step.subtitle}</p>
          </span>
        </li>
      ))}
    </ol>
  )
}

export default Steper
