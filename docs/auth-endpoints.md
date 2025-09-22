# Endpoints de autenticación

Esta implementación de frontend asume los siguientes endpoints REST bajo el prefijo `/api/auth`. Todos retornan y aceptan JSON.

> **Formato de tokens**
>
> Las respuestas exitosas de login y registro devuelven un `token` (JWT de acceso) junto con `expiresIn` (segundos hasta expirar) y, opcionalmente, un `refreshToken` reutilizable. El frontend calcula `expiresAt = Date.now() + expiresIn * 1000` y cierra la sesión automáticamente cuando llega a cero.

## POST `/api/auth/register`
Crea un usuario y devuelve los tokens de autenticación iniciales.

- **Request body**
  ```json
  {
    "email": "usuario@example.com",
    "password": "mi-contraseña-segura",
    "name": "Nombre y Apellido",
    "cuit": "20123456789"
  }
  ```
  - `name` y `cuit` son opcionales según reglas del negocio.
- **Response 201**
  ```json
  {
    "token": "<jwt>",
    "refreshToken": "<token-refresh>",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "email": "usuario@example.com",
      "name": "Nombre y Apellido"
    }
  }
  ```
- **Errores**
  - `400` validación de campos.
  - `409` email ya registrado.

## POST `/api/auth/login`
Autentica un usuario existente y retorna tokens activos.

- **Request body**
  ```json
  {
    "email": "usuario@example.com",
    "password": "mi-contraseña-segura"
  }
  ```
- **Response 200**: mismo esquema que `/register`.
- **Errores**
  - `401` credenciales inválidas.
  - `423` usuario bloqueado (opcional).

## POST `/api/auth/logout`
Invalida el refresh token en el backend (si aplica). Puede recibir el refresh token en el body o deducirlo de la cookie de sesión.

- **Request body** (opcional)
  ```json
  {
    "refreshToken": "<token-refresh>"
  }
  ```
- **Response 204** sin contenido.

## POST `/api/auth/password/forgot`
Inicia el flujo de recuperación enviando un correo con un `resetToken` de un solo uso.

- **Request body**
  ```json
  {
    "email": "usuario@example.com"
  }
  ```
- **Response 202**
  ```json
  {
    "message": "Se enviaron las instrucciones de recuperación"
  }
  ```
  La respuesta debe ser genérica para no filtrar si un email existe o no.

## POST `/api/auth/password/reset`
Completa el restablecimiento con el `resetToken` recibido por email.

- **Request body**
  ```json
  {
    "token": "<reset-token>",
    "password": "nueva-contraseña"
  }
  ```
- **Response 200**
  ```json
  {
    "message": "Contraseña actualizada"
  }
  ```

## POST `/api/auth/token/refresh`
Renueva el token de acceso usando el `refreshToken` antes de que expire el acceso.

- **Request body**
  ```json
  {
    "refreshToken": "<token-refresh>"
  }
  ```
- **Response 200**
  ```json
  {
    "token": "<jwt>",
    "refreshToken": "<token-refresh-nuevo>",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "email": "usuario@example.com",
      "name": "Nombre y Apellido"
    }
  }
  ```
- **Errores**
  - `401` refresh token inválido o expirado.

## Seguridad y expiración de tokens

- El header `Authorization: Bearer <token>` protege todos los endpoints del backend que requieren autenticación.
- El token de acceso debe expirar en ventanas cortas (15 minutos por defecto). El frontend auto cierra la sesión cuando `expiresAt <= Date.now()`.
- Considere renovar tokens de manera anticipada (por ejemplo cuando restan 60 segundos) para mejorar la UX. De no implementarse refresh automático, el frontend solicitará credenciales nuevamente.
- Cuando `refreshToken` se compromete o es revocado se debe borrar del almacenamiento servidor y responder `401`.

