// ===== Conexión con Google Calendar (varias cuentas: personal y trabajo) =====
// Usa Google Identity Services en el navegador. Requiere un "ID de cliente OAuth"
// de tipo "Aplicación web" creado en Google Cloud (ver README).

const GoogleCal = (() => {
    const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events';
    const API = 'https://www.googleapis.com/calendar/v3';
    let cargando = null;

    function esAppNativa() {
        return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    }

    function cargarGIS() {
        if (window.google && google.accounts && google.accounts.oauth2) return Promise.resolve();
        if (cargando) return cargando;
        cargando = new Promise((ok, mal) => {
            const s = document.createElement('script');
            s.src = 'https://accounts.google.com/gsi/client';
            s.async = true;
            s.onload = () => ok();
            s.onerror = () => { cargando = null; mal(new Error('No se pudo cargar Google. ¿Tienes conexión a internet?')); };
            document.head.append(s);
        });
        return cargando;
    }

    // Abre la ventana de Google para elegir cuenta y dar permiso.
    // Devuelve { token, expira, email }.
    async function pedirToken(clientId, email) {
        if (esAppNativa()) {
            throw new Error('Para conectar Google usa la versión instalada desde Chrome (ver README). Google no permite iniciar sesión dentro del APK sin configuración extra.');
        }
        if (!clientId) throw new Error('Falta el ID de cliente de Google. Añádelo en Ajustes → Configuración de Google.');
        await cargarGIS();
        const respuesta = await new Promise((ok, mal) => {
            const cliente = google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: SCOPES,
                prompt: email ? '' : 'select_account consent',
                hint: email || undefined,
                callback: (r) => (r.error ? mal(new Error(r.error_description || r.error)) : ok(r)),
                error_callback: (e) => mal(new Error(e.type === 'popup_closed' ? 'Ventana cerrada' : (e.message || 'Error de Google'))),
            });
            cliente.requestAccessToken();
        });
        if (!google.accounts.oauth2.hasGrantedAllScopes(respuesta, ...SCOPES.split(' '))) {
            throw new Error('Necesito permiso para ver y crear eventos del calendario.');
        }
        const token = respuesta.access_token;
        const expira = Date.now() + (Number(respuesta.expires_in) || 3600) * 1000 - 60000;
        const primario = await llamar(token, '/calendars/primary');
        return { token, expira, email: primario.id };
    }

    async function llamar(token, ruta, opciones = {}) {
        const r = await fetch(API + ruta, {
            ...opciones,
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opciones.headers || {}) },
        });
        if (r.status === 401) {
            const e = new Error('La sesión de Google ha caducado');
            e.caducado = true;
            throw e;
        }
        if (!r.ok) throw new Error(`Google respondió ${r.status}`);
        return r.status === 204 ? null : r.json();
    }

    function tokenValido(cuenta) {
        return cuenta.token && cuenta.expira > Date.now();
    }

    // Eventos de todos los calendarios visibles de la cuenta entre dos fechas.
    async function eventos(cuenta, desde, hasta) {
        const lista = await llamar(cuenta.token, '/users/me/calendarList?minAccessRole=reader');
        const calendarios = (lista.items || []).filter((c) => c.selected || c.primary);
        const resultados = await Promise.all(calendarios.map(async (cal) => {
            const q = new URLSearchParams({
                timeMin: desde.toISOString(),
                timeMax: hasta.toISOString(),
                singleEvents: 'true',
                orderBy: 'startTime',
                maxResults: '250',
            });
            try {
                const datos = await llamar(cuenta.token, `/calendars/${encodeURIComponent(cal.id)}/events?${q}`);
                return (datos.items || [])
                    .filter((ev) => ev.status !== 'cancelled')
                    .map((ev) => {
                        const todoElDia = !!ev.start.date;
                        const inicio = todoElDia ? new Date(ev.start.date + 'T00:00:00') : new Date(ev.start.dateTime);
                        const fin = todoElDia ? new Date(ev.end.date + 'T00:00:00') : new Date(ev.end.dateTime);
                        return {
                            id: `${cuenta.id}:${ev.id}`,
                            titulo: ev.summary || '(Sin título)',
                            inicio,
                            fin,
                            todoElDia,
                            origen: cuenta.etiqueta,
                            trabajo: cuenta.etiqueta === 'Trabajo',
                            color: cuenta.color,
                        };
                    });
            } catch (e) {
                if (e.caducado) throw e;
                return [];
            }
        }));
        return resultados.flat();
    }

    async function crearEvento(cuenta, { titulo, inicio, minutos = 60 }) {
        const fin = new Date(inicio.getTime() + minutos * 60000);
        const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return llamar(cuenta.token, '/calendars/primary/events', {
            method: 'POST',
            body: JSON.stringify({
                summary: titulo,
                start: { dateTime: inicio.toISOString(), timeZone: zona },
                end: { dateTime: fin.toISOString(), timeZone: zona },
            }),
        });
    }

    function revocar(cuenta) {
        try {
            if (cuenta.token && window.google && google.accounts) google.accounts.oauth2.revoke(cuenta.token, () => {});
        } catch (e) { /* nada */ }
    }

    return { esAppNativa, pedirToken, tokenValido, eventos, crearEvento, revocar };
})();
