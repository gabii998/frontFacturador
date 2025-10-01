import { IconCheck } from "@tabler/icons-react"

export const Success = ({title,subtitle}:{title:string,subtitle:string}) => {
    return (<div className="card flex flex-col items-center gap-5 py-12 text-slate-500">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br bg-green-100 shadow-inner text-green-500">
            <IconCheck size={54}/>
        </div>
        <div className="space-y-2 text-center">
            <h2 className="text-lg font-semibold text-slate-700">{title}</h2>
            <p className="text-sm leading-relaxed">
                {subtitle}
            </p>
        </div>
    </div>)
}

export const SuccessLite = ({title,subtitle}:{title:string,subtitle:string}) => {
    return (<div className="flex flex-col items-center gap-5 py-12 text-slate-500">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br bg-green-100 shadow-inner text-green-500">
            <IconCheck size={54}/>
        </div>
        <div className="space-y-2 text-center">
            <h2 className="text-lg font-semibold text-slate-700">{title}</h2>
            <p className="text-sm leading-relaxed">
                {subtitle}
            </p>
        </div>
    </div>)
}