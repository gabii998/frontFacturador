import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
}

export default class GlobalErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false
  }

  private handleWindowError = () => {
    this.setState({ hasError: true })
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled frontend error', error, errorInfo)
  }

  componentDidMount() {
    window.addEventListener('error', this.handleWindowError)
    window.addEventListener('unhandledrejection', this.handleWindowError)
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.handleWindowError)
    window.removeEventListener('unhandledrejection', this.handleWindowError)
  }

  render() {
    if (this.state.hasError) {
      return <GenericErrorScreen />
    }

    return this.props.children
  }
}

function GenericErrorScreen() {
  return (
    <div className="fatal-error-screen">
      <div className="fatal-error-screen__panel">
        <span className="fatal-error-screen__eyebrow">Error inesperado</span>
        <h1>La aplicación encontró un problema.</h1>
        <p>Recargá la página para continuar. Si el problema persiste, volvé a intentar en unos minutos.</p>
        <button
          type="button"
          className="btn-primary"
          onClick={() => window.location.reload()}
        >
          Recargar aplicación
        </button>
      </div>
    </div>
  )
}
