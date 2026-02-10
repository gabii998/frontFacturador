# Migration Plan (React + Vite -> Ionic + Angular + SCSS)

## Current Routes (React)
- Public: /login, /registrarse, /recuperar-clave
- Private: /, /puntos-venta, /comprobantes, /comprobantes/carga-masiva, /emitir, /configuracion, /configuracion/planes
- Public standalone: /politica-privacidad, /terminos-condiciones, /ayuda, /eliminar-datos

## Current Services
- src/services/afip.ts
- src/services/api.ts
- src/services/auth.ts
- src/services/payments.ts
- src/services/plans.ts
- src/services/privacy.ts
- src/services/profile.ts

## Tasks
1. Scaffold Ionic Angular app under migration/front-facturador (done)
2. Define route structure and layout wrappers (done)
3. Create AuthService + bearer interceptor + guard (done)
4. Port services and models (done)
5. Migrate base layout (navbar/footer) and public/private shells (done)
6. Port pages and UI components (login/registro/recuperar-clave/eliminar-datos/política/terminos/ayuda/dashboard/puntos-venta/comprobantes/emitir/configuracion/planes done, carga masiva omitida)
7. Migrate utilities (xlsx/jszip)
8. Configure PWA (Angular service worker + manifest)
9. QA: routing, auth, API, layout
