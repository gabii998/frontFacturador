import { Step } from "../props/Step"

const Steper = ({ steps }: { steps: Step[] }) => {
    //text-slate-400
    //text-blue-600
    return (<ol className="items-center w-full space-y-4 sm:flex sm:space-x-8 sm:space-y-0 rtl:space-x-reverse">
  {steps.map((step, index) => (
    <li
      key={index}
      className={`flex items-center space-x-2.5 rtl:space-x-reverse 
        ${step.isActive ? "text-blue-700" : "text-slate-500"}`}
    >
      <span
        className={`flex items-center justify-center w-8 h-8 border rounded-full shrink-0 
          ${step.isActive ? "border-blue-700" : "border-slate-400"}`}
      >
        {index + 1}
      </span>
      <span>
        <h3 className="font-medium leading-tight">{step.title}</h3>
        <p className="text-sm">{step.subtitle}</p>
      </span>
    </li>
  ))}
</ol>
)
}

export default Steper;