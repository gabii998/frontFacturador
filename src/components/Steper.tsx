import { IonBadge } from '@ionic/react'
import { Step } from '../props/Step'

const Steper = ({ steps }: { steps: Step[] }) => {
  return (
    <ol className="w-full space-y-4 sm:flex sm:space-x-8 sm:space-y-0 rtl:space-x-reverse">
      {steps.map((step, index) => (
        <li
          key={index}
          className={`flex items-center space-x-2.5 rtl:space-x-reverse ${step.isActive ? 'text-main' : 'text-inactive'}`}
        >
          <IonBadge
            className={`flex px-4 py-3 items-center justify-center rounded-full ${step.isActive ? 'badge-main' : 'badge-inactive'}`}
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
