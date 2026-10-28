# Nexo — Base de la plataforma modular de negocios (Hito 0)

**Estado:** prototipo navegable. No es un SaaS listo para usar ni un backend conectado.

## Incluye
- Landing con dos experiencias: empresas y clientes.
- Onboarding con 28 plantillas de actividad, catálogo de 25 módulos y opción de actividad híbrida.
- Panel empresarial que cambia la navegación según los módulos elegidos.
- Ejemplo de cuenta de cliente unificada.
- Directorio de demostración con filtros y explicación del futuro mapa.
- Documentación de arquitectura, alcance y prompts para Codex.

## Ejecutar en local
Requisitos: Node.js >=20.9 y conexión a npm para instalar paquetes.

```bash
npm install
npm run dev
```
Abre `http://localhost:3000`.

Comprobación previa al despliegue:
```bash
npm run typecheck
npm run build
```

## Cómo empezar con Codex
1. Crea un repositorio **privado** nuevo en GitHub, p. ej. `nexo-business-platform`.
2. Sube el **contenido** de esta carpeta a la raíz del repositorio (no el ZIP dentro del repo).
3. En Codex selecciona ese repositorio y lee `AGENTS.md`.
4. Copia el primer prompt desde `docs/PROMPTS_CODEX.md`.
5. Revisa el resultado antes de pasar al Hito 1.

## Avisos
- El nombre Nexo es provisional; debe comprobarse disponibilidad comercial y de marca antes de utilizarlo públicamente.
- Las opciones y los datos ficticios se guardan solo en `localStorage`, no en una base de datos real.
- El directorio y el mapa no representan negocios reales ni muestran disponibilidad de reservas.
- El código de la demo NO implementa autenticación, pagos, autorización multiempresa, envío de correos ni privacidad en producción.
- No subir datos de clientes reales a esta versión.
