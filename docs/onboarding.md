# Onboarding AFIP

El frontend requiere dos endpoints REST adicionales para gestionar el proceso de onboarding:

## POST `/api/onboarding/afip-credentials`
Guarda o reemplaza las credenciales proporcionadas por AFIP.

- **Request body**
  ```json
  {
    "certificate": "<archivo PEM codificado en Base64>",
    "privateKey": "<clave privada PEM codificada en Base64>",
    "alias": "wsaa-alias"
  }
  ```
- **Response** `204 No Content`
- **Validaciones**
  - Todos los campos son obligatorios.
  - El backend encripta certificado, clave y alias con AES-GCM utilizando `app.security.master-key` antes de persistirlos.

## GET `/api/onboarding/afip-credentials/status`
Permite conocer el estado del onboarding sin exponer los secretos.

- **Response** `200 OK`
  ```json
  {
    "configured": true,
    "alias": "wsaa-alias",
    "updatedAt": "2025-01-10T14:33:20.123Z"
  }
  ```
  - `configured` es `false` si nunca se guardaron credenciales.
  - `alias` se devuelve desencriptado solo para referencia del operador.

## Seguridad

- Configurar `app.security.master-key` con un valor seguro (idealmente a través de variables de entorno o secret manager). El valor de ejemplo en `application.yml` debe reemplazarse en cada ambiente.
- Las columnas `certificate_encrypted`, `private_key_encrypted` y `alias_encrypted` almacenan los datos encriptados. Al invocar el servicio, el backend sólo desencripta el alias para mostrarlo en pantalla.
- Los archivos se envían codificados en Base64 desde el frontend para evitar problemas con caracteres especiales en JSON.

