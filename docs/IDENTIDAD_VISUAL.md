# AutonoService — Identidad visual aprobada

Versión de referencia: 29 de octubre de 2026. Fuente: kit visual facilitado para el proyecto.

## Principio

**Una marca, dos experiencias.** La identidad principal es clara, cálida y minimalista. La vista profesional prioriza la organización; la experiencia Cliente hace más visibles las categorías, perfiles, reservas y comercios cercanos. AutonoSuite es una mejora dentro de la misma aplicación, no una marca separada.

### Identidad y archivos implementados

- `public/branding/autonoservice-mark.svg`: símbolo vectorial aprobado (monograma negro con punto marrón cálido).
- `src/app/icon.svg`: icono de la app a partir del mismo símbolo, sobre blanco.
- `src/components/brand.tsx`: composición horizontal de logo con tipografía geométrica.
- `src/app/visual-identity.css`: tokens y ajustes para las experiencias de Empresa y Cliente.
- `src/components/theme-toggle.tsx`: modo claro predeterminado y modo oscuro opcional.
- `src/app/layout.tsx`: carga global del sistema visual.

## Paleta y tipografía

| Uso | Color |
| --- | --- |
| Texto y símbolo | `#1A1A1A` |
| Punto / detalle marrón | `#C7A075` |
| Fondo crema | `#F8F6F3` |
| Superficie | `#FFFFFF` |
| Texto secundario | `#6B6660` |
| Borde discreto | `#EBE8E4` |

Familia tipográfica recomendada: **Inter** con alternativas del sistema. No almacenar archivos de fuentes sin licencia de distribución. Contrastes y tamaños finales se verifican por accesibilidad.

## Ocho láminas de referencia del kit

Estas son referencias conceptuales, no pantallas listas para publicar.

1. **Manual de identidad:** escala de logo, usos, tipografía y colores.
2. **Bienvenida:** selector entre AutonoService (negocio) y Cliente (gratuito).
3. **Dashboard profesional:** navegación, agenda, clientes, presupuestos y trabajos.
4. **Explorar Cliente:** directorio, servicios cercanos y mapa; datos ficticios.
5. **AutonoSuite:** mejora voluntaria de pago único; precios ilustrativos.
6. **Ilustraciones del onboarding:** espacio, planificación, conexión y simplicidad.
7. **Estados vacíos:** reservas, presupuestos y resultados.
8. **Promocionales:** dirección de fotografía y composición para tiendas; sustituir por capturas reales antes de lanzamiento.

Las láminas PNG/HTML originales del ZIP son materiales de referencia adicionales. Los recursos ejecutables esenciales están integrados arriba; para conservar todas las láminas originales en GitHub, añadirlas a `docs/visual-kit/` desde el ZIP suministrado por el propietario. No sustituir componentes funcionales por capturas estáticas.

## Reglas de implementación

- Los componentes se implementan de forma real, con semántica accesible, y no como imágenes de interfaz.
- No cambiar el logo de Cliente ni crear otra app para AutonoSuite.
- En Cliente, usar superficies luminosas y recursos visuales de negocios; mantener contraste, tarjetas claras y filtros legibles.
- AutonoService profesional: navegación de productividad y densidad de información contenida.
- El modo oscuro es **opcional**, no la única apariencia. Respetar preferencias previas guardadas.
- Las rutas de demostración no afirman reservas, pagos, búsquedas o mapas reales.
- Mantener la compatibilidad con la exportación estática para Cloudflare mientras no exista backend.
- Antes del lanzamiento comprobar licencia de marca, imágenes, contraste, accesibilidad y capturas de tiendas.

## Verificación

En cada cambio visual probar `/`, `/onboarding`, `/empresa`, `/cliente`, `/explorar` y `/mi-plan` en escritorio y móvil; verificar ambos temas y los estados sin datos. Ejecutar `npm run typecheck`, `npm test` y `npm run build`.
