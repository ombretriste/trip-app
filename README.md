# TripCTRL

*by OmT Finance*

Versión **0.1.5** (se muestra en la pantalla de inicio). Las correcciones y ajustes suben el último número (0.1.1); las novedades, el del medio (0.2.0).

App web instalable (PWA) para organizar los viajes: plan día a día, documentos de cada viajero en regla (con DocCTRL), gastos y maleta. Mismo estilo que las demás apps de OmT, en tonos coral.

## Funcionamiento

- Pantalla de inicio con el logo; al pulsar **Entrar** se pasa a la app. Siempre en vertical.
- **Próximo viaje**: cuenta atrás (o «En curso · día X de N»), viajes próximos, días de viaje del año y avisos de documentos.
- Filtro **Próximos / Pasados / Todos** y buscador (destino, notas, reservas, lugares…).
- **Viaje**: destino, ida y vuelta, dónde (España, Europa UE/Schengen o resto del mundo), quién viaja, presupuesto y notas. Ficha con cuatro pestañas:
  - **Plan**: un bloque por día con vuelos, trenes o buses, coche de alquiler, alojamiento, actividades, restaurantes y otros, con hora, lugar (enlace al mapa), localizador (se copia con un toque) y precio. Alojamiento y coche muestran los días que siguen activos. **Al calendario** descarga un `.ics` con el viaje y cada reserva.
  - **Papeles**: lo que necesita cada viajero según el destino (DNI; DNI o pasaporte y tarjeta sanitaria europea en Europa; pasaporte con 6 meses de validez fuera; carnet si hay coche) y, fuera de Europa, visado y seguro de viaje. Con DocCTRL vinculado se comprueba la caducidad sola; sin él, se marca a mano.
  - **Gastos**: total (lo reservado en el plan + los gastos apuntados), por persona, barra del presupuesto y reparto por categorías.
  - **Maleta**: lista con casillas, «Lista básica» según el destino y «Desmarcar todo».
- Menú ⋯: Viajeros, Vínculo con DocCTRL, Sincronización en la nube, Opciones de visualización (oscuro/claro/automático y cuatro fondos: Coral, Laguna, Atardecer y Noche), Exportar copia e Importar copia.

## Vínculo con DocCTRL

Igual que PayCTRL con UnderCTRL: con la nube activada en las dos apps con el **mismo usuario**, se introduce una vez la contraseña de DocCTRL; el dispositivo deriva sus claves (sales `docctrl-…`, la contraseña no se guarda) y `api/sync` (`peer-pull`) devuelve el bloque cifrado de la cuenta `doc:` de la misma base de datos. Se descifra aquí y solo se guarda tipo, caducidad e id de DNI, pasaporte, tarjeta sanitaria europea y carnet de conducir de cada persona (ni números ni fotos). Las personas se emparejan por nombre. Desde cada documento, ↗ abre su ficha en DocCTRL (`?open=id`) y «+» abre DocCTRL para añadir el que falta.

## Sincronización en la nube

Como DocCTRL y TaskCTRL (`api/sync.js`): usuario y contraseña derivan con PBKDF2 una clave de acceso y otra de cifrado (sales `tripctrl-…`), los datos se cifran con AES-GCM en el dispositivo y el servidor solo guarda bloques ilegibles (claves `trip:`). Se fusiona viaje a viaje (gana el cambio más reciente; los borrados se respetan). Crear cuenta pide la misma clave de registro que UnderCTRL.

## Configuración en Vercel

1. **Storage → Upstash Redis**: conecta la misma base de datos que usan las otras apps (sobre todo DocCTRL, para el vínculo) y vuelve a desplegar.
2. Comprueba `https://<tu-app>.vercel.app/api/sync`: debe decir `"configured": true`.

Los datos se guardan en el propio dispositivo (`localStorage`, `tripctrl:v1`).

## Desarrollo

Sitio estático sin dependencias ni paso de compilación:

```bash
python3 -m http.server 8000
```

Al cambiar archivos, sube `APP_VERSION` en `app.js`, la línea de versión de este README y la versión de `CACHE` en `sw.js`.

## Despliegue

Importa el repositorio en [Vercel](https://vercel.com/new) con el preset **Other** (sin comando de compilación). Cada `git push` a `main` se despliega automáticamente.
