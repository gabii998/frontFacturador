const SDK_URL = 'https://sdk.mercadopago.com/js/v2'

type MercadoPagoCheckoutPreference = {
  id: string
}

type MercadoPagoCheckoutOptions = {
  preference: MercadoPagoCheckoutPreference
  autoOpen?: boolean
}

export interface MercadoPagoInstance {
  checkout: (options: MercadoPagoCheckoutOptions) => void
}

type MercadoPagoConstructor = new (
  publicKey: string,
  options?: {
    locale?: string
  }
) => MercadoPagoInstance

declare global {
  interface Window {
    MercadoPago?: MercadoPagoConstructor
  }
}

let sdkLoadingPromise: Promise<void> | null = null

function appendScript(): Promise<void> {
  if (window.MercadoPago) {
    return Promise.resolve()
  }

  if (sdkLoadingPromise) {
    return sdkLoadingPromise
  }

  sdkLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SDK_URL
    script.async = true
    script.onload = () => {
      resolve()
    }
    script.onerror = () => {
      reject(new Error('No se pudo cargar la librería de Mercado Pago.'))
    }
    document.body.appendChild(script)
  })

  return sdkLoadingPromise
}

export async function initMercadoPago(
  publicKey: string,
  locale: string = 'es-AR'
): Promise<MercadoPagoInstance> {
  await appendScript()
  if (!window.MercadoPago) {
    throw new Error('Mercado Pago no está disponible en este momento.')
  }
  return new window.MercadoPago(publicKey, { locale })
}

export async function ensureMercadoPago(
  publicKey: string,
  locale?: string
): Promise<MercadoPagoInstance> {
  try {
    return await initMercadoPago(publicKey, locale)
  } catch (error) {
    sdkLoadingPromise = null
    throw error
  }
}

export {}
