# Método Oasis Daily App 🌴

La app diaria del **Método Oasis**: tu día en calma, todo en un solo lugar.

- ☀️ **Hoy**: tu agenda del día (Google personal + trabajo), tareas, agua y ánimo.
- 📅 **Agenda**: calendario mensual con tus eventos de Google y del móvil, y **recordatorios** (una vez, cada día o cada semana).
- 💶 **Gastos**: apunta gastos por categoría, mira el total del mes y tu presupuesto.
- 🔁 **Hábitos**: marca tus hábitos y mira tu racha 🔥.
- 📝 **Notas**: ideas, compras, apuntes.
- ⚙️ **Ajustes**: cuentas de Google, notificaciones, moneda, presupuesto y copia de seguridad.

Tus datos se guardan en tu teléfono.

---

## 1. Instalarla en Android

### Opción A: desde Chrome (recomendada si quieres conectar Google)
1. Activa **GitHub Pages**: en GitHub → *Settings* → *Pages* → elige la rama y la carpeta `/ (root)` → *Save*.
2. Abre en Chrome del móvil la dirección que te da (algo como `https://jrodriguezmen.github.io/git-curso/`).
3. Pulsa **Instalar** (o menú ⋮ → *Añadir a pantalla de inicio*).

### Opción B: APK
1. En GitHub → pestaña **Actions** → **Generar APK de Android** → última ejecución en verde.
2. Descarga **metodo-oasis-daily-apk**, descomprime y pasa el `.apk` al móvil.
3. Ábrelo y permite "Instalar apps de origen desconocido".

| | Chrome (PWA) | APK |
|---|---|---|
| Conectar Google Calendar | ✅ | ❌ (Google no permite iniciar sesión dentro del APK sin configuración extra) |
| Recordatorios con la app cerrada | ⚠️ Solo con la app abierta o en segundo plano reciente | ✅ Notificaciones nativas |

---

## 2. Conectar tu Google personal y el del trabajo

Google pide que cada app tenga su propio "ID de cliente". Se hace **una sola vez** (10 minutos):

1. Entra en <https://console.cloud.google.com/> con tu cuenta **personal** y crea un proyecto llamado `Metodo Oasis`.
2. Menú → *APIs y servicios* → *Biblioteca* → busca **Google Calendar API** → **Habilitar**.
3. *APIs y servicios* → *Pantalla de consentimiento de OAuth*:
   - Tipo de usuario: **Externo**.
   - Nombre de la app: `Método Oasis Daily App`, y tu email.
   - En **Usuarios de prueba** añade tu Gmail personal **y tu email del trabajo**.
4. *APIs y servicios* → *Credenciales* → *Crear credenciales* → **ID de cliente de OAuth**:
   - Tipo: **Aplicación web**.
   - *Orígenes de JavaScript autorizados*: `https://jrodriguezmen.github.io`
5. Copia el **ID de cliente** (termina en `.apps.googleusercontent.com`).
6. En la app: ⚙️ Ajustes → *Configuración de Google* → pega el ID.
7. Pulsa **+ Personal** y elige tu Gmail; luego **+ Trabajo** y elige la cuenta del trabajo.

Notas:
- Por seguridad, Google da acceso por 1 hora. Cuando caduque, verás **Reconectar** en Ajustes (un toque).
- Si tu empresa usa Google Workspace, el administrador puede bloquear apps externas. Si al conectar el trabajo sale "acceso bloqueado", pídele a TI que permita la app o comparte tu calendario del trabajo con tu Gmail personal (así lo verás desde la cuenta personal).

---

## Probarla en el ordenador
```bash
python3 -m http.server 8000
# abre http://localhost:8000
```
