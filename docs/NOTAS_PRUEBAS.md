# Verificación manual del Hito 0

- Abrir `/` y comprobar enlace de alta, panel, explorar y cliente.
- En `/onboarding` probar 4 perfiles: Fotografía, Peluquería, Panadería y Otro/Mixto.
- Cambiar modo local/domicilio/online/mixto.
- Quitar proyectos y comprobar que desaparece su pestaña en `/empresa`.
- Confirmar que el módulo Clientes sigue marcado como base.
- Cambiar nombre/ciudad; finalizar, navegar a `/empresa`, recargar y comprobar persistencia SOLO local.
- Abrir `/cliente`, cambiar pestañas y comprobar aviso de datos ficticios.
- En `/explorar`, filtrar por sector y alternar mapa; confirmar que NO aparece un mapa con negocios inventados.
- Revisar a 360px, 768px y 1440px; navegación por teclado y foco visible.
- Ejecutar `npm run typecheck` y `npm run build` desde Codex.
- Confirmar que no hay claves de entorno, usuarios reales, cobros ni flujos falsamente confirmados.
