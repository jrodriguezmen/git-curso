# Mi Día 📱

App para Android que te ayuda a organizar tu vida diaria:

- ☀️ **Hoy**: tareas del día, vasos de agua (meta: 8) y cómo te sientes.
- 🔁 **Hábitos**: marca tus hábitos cada día y mira tu racha 🔥 y los últimos 7 días.
- 📝 **Notas**: apunta ideas, compras o recordatorios.

Todo se guarda en tu propio teléfono y funciona sin internet.

## Cómo instalarla en Android

### Opción A: APK (app normal)
1. En GitHub, ve a la pestaña **Actions** → **Generar APK de Android**.
2. Abre la última ejecución en verde y descarga **mi-dia-apk** (abajo, en *Artifacts*).
3. Descomprime el zip y pasa `app-debug.apk` a tu móvil.
4. Ábrelo y acepta "Instalar apps de origen desconocido" cuando Android lo pida.

### Opción B: desde Chrome (PWA)
1. Publica la carpeta con **GitHub Pages** (Settings → Pages → rama y carpeta raíz).
2. Abre la dirección en Chrome desde el móvil.
3. Pulsa **Instalar** (o menú ⋮ → *Añadir a pantalla de inicio*).

## Probarla en el ordenador
```bash
python3 -m http.server 8000
# abre http://localhost:8000
```
