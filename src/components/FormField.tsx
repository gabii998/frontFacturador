import { FormFielProps } from "../props/FormFieldProps"

const FormField = (props:FormFielProps) => {
    return (
    <label className="auth-field">
      <span className="auth-field__label">{props.label}</span>
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
        <input
          type={props.type}
          name={props.name}
          className="input"
          value={props.value}
          onChange={props.onChange}
          required={props.required}
          minLength={props.minLength}
        />
      )}
    </label>
  )
}

export default FormField;