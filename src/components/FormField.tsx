import { IonInput, IonItem, IonLabel } from '@ionic/react'
import { FormFielProps } from '../props/FormFieldProps'

const FormField = (props: FormFielProps) => {
  return (
    <IonItem lines="none" className="auth-input-item shadow-sm">
      <IonLabel position="stacked" className="auth-field__label">{props.label}</IonLabel>
      {props.children ? (
        <select
          name={props.name}
          className="input"
          value={props.value}
          onChange={props.onChange}
          required={props.required}
        >
          {props.children}
        </select>
      ) : (
        <IonInput
          type={props.type as any}
          name={props.name}
          value={props.value}
          required={props.required}
          minlength={props.minLength}
          className="input"
          onIonInput={(event) => {
            const value = event.detail.value ?? ''
            props.onChange({
              target: { name: props.name, value }
            } as React.ChangeEvent<HTMLInputElement>)
          }}
        />
      )}
    </IonItem>
  )
}

export default FormField
