import { IonButton, IonIcon, IonSpinner } from '@ionic/react'
import type { ComponentProps } from 'react'

type IonButtonProps = ComponentProps<typeof IonButton>

type ActionButtonConfig = {
  label: string
  loadingLabel?: string
  loading?: boolean
  disabled?: boolean
  icon?: ComponentProps<typeof IonIcon>['icon']
  type?: IonButtonProps['type']
  fill?: IonButtonProps['fill']
  color?: IonButtonProps['color']
  size?: IonButtonProps['size']
  className?: string
  showLoadingSpinner?: boolean
  onClick?: () => void | Promise<void>
  buttonProps?: Omit<IonButtonProps, 'children' | 'onClick'>
}

type ActionButtonsGroupProps = {
  primary: ActionButtonConfig
  secondary?: ActionButtonConfig
  className?: string
  stickyOnMobile?: boolean
}

const DEFAULT_CONTAINER_CLASS = 'flex flex-col gap-3 md:flex-row md:items-center md:justify-end'

const joinClassNames = (...classes: Array<string | undefined>) => classes.filter(Boolean).join(' ')

const renderButton = (config: ActionButtonConfig, defaultFill: IonButtonProps['fill']) => {
  const buttonProps = config.buttonProps ?? {}
  const isLoading = Boolean(config.loading)
  const isDisabled = Boolean(config.disabled || buttonProps.disabled || isLoading)
  const label = isLoading && config.loadingLabel ? config.loadingLabel : config.label

  return (
    <IonButton
      {...buttonProps}
      type={config.type ?? buttonProps.type ?? 'button'}
      fill={config.fill ?? buttonProps.fill ?? defaultFill}
      color={config.color ?? buttonProps.color}
      size={config.size ?? buttonProps.size}
      className={joinClassNames(buttonProps.className, config.className)}
      onClick={() => {
        const maybePromise = config.onClick?.()
        if (maybePromise && typeof (maybePromise as Promise<void>).catch === 'function') {
          void maybePromise
        }
      }}
      disabled={isDisabled}
      aria-busy={isLoading}
    >
      {isLoading
        ? (
          (config.showLoadingSpinner ?? true) && <IonSpinner slot="start" name="crescent" />
          )
        : (
          config.icon && <IonIcon slot="start" icon={config.icon} />
          )}
      {label}
    </IonButton>
  )
}

const ActionButtonsGroup = ({ primary, secondary, className, stickyOnMobile = false }: ActionButtonsGroupProps) => {
  const baseClass = className ?? DEFAULT_CONTAINER_CLASS
  const stickyClass = stickyOnMobile
    ? 'action-buttons--sticky-mobile'
    : undefined
  return (
    <div className={joinClassNames(baseClass, stickyClass)}>
      {secondary && renderButton(secondary, 'outline')}
      {renderButton(primary, 'solid')}
    </div>
  )
}

export default ActionButtonsGroup
