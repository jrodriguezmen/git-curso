# Método Oasis Daily App 🌴

La app diaria del **[Método Oasis](https://metodooasis.com/)**: para que el trabajo salga de tu cabeza y recuperes el tiempo que es tuyo.

- ☀️ **Hoy**
  - **Lo importante hoy**: tus 3 prioridades (lo que quedó ayer se ofrece para hoy).
  - **Agenda de hoy** con Google personal + trabajo: citas, tiempo ocupado, % de jornada, siguiente reunión y **huecos libres**.
  - **Modo Oasis**: fuera de tu jornada oculta el calendario del trabajo y te recuerda cuándo vuelves.
  - **Ritual de cierre** en la última hora de trabajo, con aviso 15 min antes.
  - **Check-in** diario: ánimo, carga, energía, sueño y si el trabajo invadió tu tiempo libre.
  - Seguimientos vencidos, tareas y agua.
- 🌿 **Oasis**: los 4 pilares del método (Diagnóstico, Límites, Descanso profundo, Plan de vuelta) con tus rutinas, tendencia de 7 días con alertas y **revisión semanal** (el foco de la semana aparece cada día en Hoy).
- 📅 **Agenda**: calendario mensual, eventos y recordatorios (una vez, diarios o semanales).
- 💶 **Gastos**: personal o **empresa** con foto del ticket, presupuesto y **nota de gastos** (CSV + tickets) para enviar a finanzas.
- 🤝 **Equipo**: seguimientos de lo que has delegado y lo que esperas de otros, por persona (ideal para preparar 1:1), y notas rápidas.
- ⚙️ **Ajustes**: cuentas de Google, horario y días de trabajo, notificaciones, moneda, presupuesto y copia de seguridad.

Tus datos se guardan en tu teléfono.

---

## 1. Instalarla en Android

### Opción A: desde Chrome (recomendada si quieres conectar Google)
1. Activa **GitHub Pages**: en GitHub → *Settings* → *Pages* → elige la rama y la carpeta `/ (root)` → *Save*.
2. Abre en Chrome del móvil la dirección que te da (algo como `https://jrodriguezmen.github.io/git-curso/`).
3. Pulsa **Instalar** (o menú ⋮ → *Añadir a pantalla de inicio*).

### Opción B: APK
1. Desde el móvil Android, abre en Chrome:
   **https://github.com/jrodriguezmen/git-curso/releases/latest/download/metodo-oasis-daily.apk**
2. Cuando termine la descarga, toca el archivo.
3. Si Android lo pide, permite a Chrome "Instalar apps desconocidas" y pulsa **Instalar**.

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

> Método Oasis es un programa de bienestar y no sustituye a un tratamiento médico ni psicológico.
