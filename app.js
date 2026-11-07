// ===== Método Oasis Daily App =====

const META_AGUA = 8;
const ANIMOS = ['😞', '😕', '😐', '🙂', '😄'];
const CATEGORIAS = [
    { id: 'comida', nombre: 'Comida', emoji: '🛒' },
    { id: 'casa', nombre: 'Casa', emoji: '🏠' },
    { id: 'facturas', nombre: 'Facturas', emoji: '💡' },
    { id: 'transporte', nombre: 'Transporte', emoji: '🚗' },
    { id: 'salud', nombre: 'Salud', emoji: '💊' },
    { id: 'ocio', nombre: 'Ocio', emoji: '🎉' },
    { id: 'ropa', nombre: 'Ropa', emoji: '👕' },
    { id: 'otros', nombre: 'Otros', emoji: '📦' },
];
const COLORES_CUENTA = { Personal: '#2563eb', Trabajo: '#d97706' };

// ---------- Utilidades ----------
const $ = (sel) => document.querySelector(sel);

function claveDia(fecha = new Date()) {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
function fechaDeClave(clave) {
    const [y, m, d] = clave.split('-').map(Number);
    return new Date(y, m - 1, d);
}
function diasAtras(n) {
    const f = new Date();
    f.setDate(f.getDate() - n);
    return claveDia(f);
}
function horaTexto(fecha) {
    return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}
function mayuscula(t) {
    return t.charAt(0).toUpperCase() + t.slice(1);
}
function id() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function crear(tag, props = {}, hijos = []) {
    const el = document.createElement(tag);
    Object.assign(el, props);
    hijos.forEach((h) => el.append(h));
    return el;
}
function botonBorrar(etiqueta, accion) {
    return crear('button', { className: 'borrar', textContent: '✕', ariaLabel: etiqueta, onclick: accion });
}
function vacio(texto) {
    return crear('li', { className: 'vacio', textContent: texto });
}

let temporizadorAviso;
function aviso(texto) {
    const el = $('#aviso');
    el.textContent = texto;
    el.hidden = false;
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => { el.hidden = true; }, 3500);
}

// ---------- Datos (guardados en el teléfono) ----------
const CLAVE = 'oasis-daily-v1';
const CLAVE_ANTIGUA = 'mi-dia-v1';

function base() {
    return {
        tareas: [], habitos: [], notas: [], agua: {}, animo: {},
        eventos: [], recordatorios: [], gastos: [], cuentas: [],
        ajustes: { moneda: 'EUR', presupuesto: null, clientId: '' },
    };
}

function cargar() {
    for (const clave of [CLAVE, CLAVE_ANTIGUA]) {
        try {
            const guardado = JSON.parse(localStorage.getItem(clave));
            if (guardado) {
                const d = { ...base(), ...guardado };
                d.ajustes = { ...base().ajustes, ...(guardado.ajustes || {}) };
                return d;
            }
        } catch (e) { /* datos dañados o sin acceso */ }
    }
    return base();
}

let datos = cargar();

function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) { aviso('No se pudo guardar: memoria llena'); }
}

function nuevoDia() {
    const hoy = claveDia();
    datos.tareas = datos.tareas.filter((t) => !(t.hecha && t.dia !== hoy));
    datos.tareas.forEach((t) => { t.dia = hoy; });
    guardar();
}

function moneda(n) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: datos.ajustes.moneda || 'EUR' }).format(n);
}

// ---------- Cabecera ----------
function pintarCabecera() {
    const h = new Date().getHours();
    $('#saludo').textContent = h < 6 ? 'Buenas noches' : h < 13 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
    $('#fecha').textContent = mayuscula(new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }));
}

// =====================================================================
// TAREAS
// =====================================================================
function pintarTareas() {
    const lista = $('#lista-tareas');
    lista.replaceChildren();
    const hechas = datos.tareas.filter((t) => t.hecha).length;
    $('#contador-tareas').textContent = datos.tareas.length ? `${hechas}/${datos.tareas.length}` : '';
    $('#limpiar-tareas').hidden = hechas === 0;
    if (!datos.tareas.length) { lista.append(vacio('Nada pendiente. ¡Añade tu primera tarea!')); return; }

    [...datos.tareas].sort((a, b) => a.hecha - b.hecha).forEach((t) => {
        const check = crear('button', {
            className: 'check' + (t.hecha ? ' on' : ''), textContent: t.hecha ? '✓' : '',
            ariaLabel: t.hecha ? 'Marcar como pendiente' : 'Marcar como hecha',
            onclick: () => { t.hecha = !t.hecha; guardar(); pintarTareas(); },
        });
        lista.append(crear('li', { className: t.hecha ? 'hecha' : '' }, [
            check, crear('span', { className: 'texto', textContent: t.texto }),
            botonBorrar('Borrar tarea', () => { datos.tareas = datos.tareas.filter((x) => x.id !== t.id); guardar(); pintarTareas(); }),
        ]));
    });
}
$('#form-tarea').addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = $('#input-tarea').value.trim();
    if (!texto) return;
    datos.tareas.push({ id: id(), texto, hecha: false, dia: claveDia() });
    $('#input-tarea').value = '';
    guardar(); pintarTareas();
});
$('#limpiar-tareas').addEventListener('click', () => {
    datos.tareas = datos.tareas.filter((t) => !t.hecha);
    guardar(); pintarTareas();
});

// =====================================================================
// AGUA Y ÁNIMO
// =====================================================================
function pintarAgua() {
    const n = datos.agua[claveDia()] || 0;
    $('#contador-agua').textContent = `${n}/${META_AGUA} vasos` + (n >= META_AGUA ? ' 🎉' : '');
    const vasos = $('#vasos');
    vasos.replaceChildren();
    for (let i = 0; i < Math.max(META_AGUA, n); i++) vasos.append(crear('div', { className: 'vaso' + (i < n ? ' lleno' : '') }));
}
function cambiarAgua(delta) {
    const hoy = claveDia();
    datos.agua[hoy] = Math.max(0, (datos.agua[hoy] || 0) + delta);
    guardar(); pintarAgua();
}
$('#agua-mas').addEventListener('click', () => cambiarAgua(1));
$('#agua-menos').addEventListener('click', () => cambiarAgua(-1));

function pintarAnimo() {
    const actual = datos.animo[claveDia()];
    const cont = $('#animos');
    cont.replaceChildren();
    ANIMOS.forEach((emoji, i) => cont.append(crear('button', {
        className: actual === i ? 'on' : '', textContent: emoji, ariaLabel: `Ánimo ${i + 1} de 5`,
        onclick: () => { datos.animo[claveDia()] = actual === i ? undefined : i; guardar(); pintarAnimo(); },
    })));
}

// =====================================================================
// HÁBITOS
// =====================================================================
function racha(habito) {
    const hechos = new Set(habito.dias);
    let n = 0;
    let i = hechos.has(diasAtras(0)) ? 0 : 1;
    while (hechos.has(diasAtras(i))) { n++; i++; }
    return n;
}
function pintarHabitos() {
    const lista = $('#lista-habitos');
    lista.replaceChildren();
    const hoy = claveDia();
    if (!datos.habitos.length) { lista.append(vacio('Aún no tienes hábitos. Prueba con "Meditar 10 min" o "Caminar 30 min".')); return; }

    datos.habitos.forEach((h) => {
        const hecho = h.dias.includes(hoy);
        const r = racha(h);
        const semana = crear('div', { className: 'semana' });
        for (let i = 6; i >= 0; i--) semana.append(crear('i', { className: h.dias.includes(diasAtras(i)) ? 'on' : '' }));
        lista.append(crear('li', {}, [
            crear('button', {
                className: 'check' + (hecho ? ' on' : ''), textContent: hecho ? '✓' : '',
                ariaLabel: hecho ? 'Desmarcar hoy' : 'Marcar hecho hoy',
                onclick: () => { h.dias = hecho ? h.dias.filter((d) => d !== hoy) : [...h.dias, hoy]; guardar(); pintarHabitos(); },
            }),
            crear('div', { className: 'texto' }, [
                crear('span', { textContent: h.nombre }),
                crear('span', { className: 'racha', textContent: r ? `🔥 ${r} ${r === 1 ? 'día seguido' : 'días seguidos'}` : 'Empieza hoy' }),
                semana,
            ]),
            botonBorrar('Borrar hábito', () => {
                if (!confirm(`¿Borrar el hábito "${h.nombre}" y su historial?`)) return;
                datos.habitos = datos.habitos.filter((x) => x.id !== h.id);
                guardar(); pintarHabitos();
            }),
        ]));
    });
}
$('#form-habito').addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = $('#input-habito').value.trim();
    if (!nombre) return;
    datos.habitos.push({ id: id(), nombre, dias: [] });
    $('#input-habito').value = '';
    guardar(); pintarHabitos();
});

// =====================================================================
// NOTAS
// =====================================================================
function pintarNotas() {
    const lista = $('#lista-notas');
    lista.replaceChildren();
    if (!datos.notas.length) { lista.append(vacio('Tus notas aparecerán aquí.')); return; }
    datos.notas.forEach((n) => {
        const fecha = new Date(n.fecha).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        lista.append(crear('li', {}, [
            crear('div', { className: 'cuerpo', textContent: n.texto }, [crear('small', { textContent: fecha })]),
            botonBorrar('Borrar nota', () => { datos.notas = datos.notas.filter((x) => x.id !== n.id); guardar(); pintarNotas(); }),
        ]));
    });
}
$('#form-nota').addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = $('#input-nota').value.trim();
    if (!texto) return;
    datos.notas.unshift({ id: id(), texto, fecha: Date.now() });
    $('#input-nota').value = '';
    guardar(); pintarNotas();
});

// =====================================================================
// CUENTAS DE GOOGLE
// =====================================================================
const cacheGoogle = {}; // 'YYYY-MM' -> eventos de Google de ese mes
let errorGoogle = '';

function cuentasActivas() {
    return datos.cuentas.filter((c) => GoogleCal.tokenValido(c));
}

async function conectarCuenta(etiqueta, cuentaExistente) {
    try {
        const r = await GoogleCal.pedirToken(datos.ajustes.clientId.trim(), cuentaExistente && cuentaExistente.email);
        let cuenta = datos.cuentas.find((c) => c.email === r.email);
        if (!cuenta) {
            cuenta = { id: id(), etiqueta, email: r.email, color: COLORES_CUENTA[etiqueta] || '#7c3aed' };
            datos.cuentas.push(cuenta);
        }
        cuenta.token = r.token;
        cuenta.expira = r.expira;
        guardar();
        Object.keys(cacheGoogle).forEach((k) => delete cacheGoogle[k]);
        aviso(`Conectado: ${r.email}`);
        pintarCuentas();
        refrescarAgenda();
    } catch (e) {
        aviso(e.message);
    }
}

function pintarCuentas() {
    const lista = $('#lista-cuentas');
    lista.replaceChildren();
    if (!datos.cuentas.length) { lista.append(vacio('Ninguna cuenta conectada.')); return; }
    datos.cuentas.forEach((c) => {
        const activa = GoogleCal.tokenValido(c);
        lista.append(crear('li', {}, [
            crear('i', { className: 'punto', style: `background:${c.color}` }),
            crear('div', { className: 'texto' }, [
                crear('span', { textContent: `${c.etiqueta}` }),
                crear('span', { className: 'racha', textContent: c.email }),
            ]),
            activa
                ? crear('span', { className: 'etiqueta ok', textContent: 'Conectada' })
                : crear('button', { className: 'mini', textContent: 'Reconectar', onclick: () => conectarCuenta(c.etiqueta, c) }),
            botonBorrar('Quitar cuenta', () => {
                if (!confirm(`¿Desconectar ${c.email}?`)) return;
                GoogleCal.revocar(c);
                datos.cuentas = datos.cuentas.filter((x) => x.id !== c.id);
                Object.keys(cacheGoogle).forEach((k) => delete cacheGoogle[k]);
                guardar(); pintarCuentas(); refrescarAgenda();
            }),
        ]));
    });
}

$('#conectar-personal').addEventListener('click', () => conectarCuenta('Personal'));
$('#conectar-trabajo').addEventListener('click', () => conectarCuenta('Trabajo'));
$('#google-client-id').addEventListener('change', (e) => {
    datos.ajustes.clientId = e.target.value.trim();
    guardar();
    aviso('ID de cliente guardado');
});

function eventosGoogleMes(anio, mes) {
    const clave = `${anio}-${mes}`;
    if (!cacheGoogle[clave]) cacheGoogle[clave] = cargarGoogleMes(anio, mes);
    return cacheGoogle[clave];
}

async function cargarGoogleMes(anio, mes) {
    const activas = cuentasActivas();
    if (!activas.length) return [];
    const desde = new Date(anio, mes, 1);
    const hasta = new Date(anio, mes + 1, 1);
    errorGoogle = '';
    const listas = await Promise.all(activas.map((c) => GoogleCal.eventos(c, desde, hasta).catch((e) => {
        if (e.caducado) { c.expira = 0; guardar(); }
        errorGoogle = e.caducado ? 'Una cuenta de Google necesita reconectarse (Ajustes ⚙️).' : 'No se pudieron cargar algunos eventos de Google.';
        return [];
    })));
    return listas.flat();
}

// =====================================================================
// RECORDATORIOS Y EVENTOS LOCALES
// =====================================================================
// ¿El recordatorio ocurre el día indicado? (tiene en cuenta repeticiones)
function ocurrenciaEn(rec, clave) {
    const inicio = new Date(rec.cuando);
    const dia = fechaDeClave(clave);
    const diaInicio = fechaDeClave(claveDia(inicio));
    if (dia < diaInicio) return null;
    const enFecha = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), inicio.getHours(), inicio.getMinutes());
    if (!rec.repetir) return claveDia(inicio) === clave ? inicio : null;
    if (rec.repetir === 'diario') return enFecha;
    if (rec.repetir === 'semanal') return dia.getDay() === inicio.getDay() ? enFecha : null;
    return null;
}

function proximaOcurrencia(rec, desde = new Date()) {
    let f = new Date(rec.cuando);
    if (!rec.repetir) return f;
    const paso = rec.repetir === 'diario' ? 1 : 7;
    while (f <= desde) f.setDate(f.getDate() + paso);
    return f;
}

async function itemsDelDia(clave) {
    const dia = fechaDeClave(clave);
    const items = [];

    datos.eventos.filter((e) => claveDia(new Date(e.inicio)) === clave).forEach((e) => items.push({
        tipo: 'evento', ref: e, titulo: e.titulo, hora: new Date(e.inicio), origen: 'En el móvil', color: 'var(--primario)',
    }));
    datos.recordatorios.forEach((r) => {
        const cuando = ocurrenciaEn(r, clave);
        if (cuando) items.push({ tipo: 'recordatorio', ref: r, titulo: r.texto, hora: cuando, origen: r.repetir ? `Recordatorio · ${r.repetir}` : 'Recordatorio', color: '#db2777' });
    });
    const google = await eventosGoogleMes(dia.getFullYear(), dia.getMonth());
    google.filter((e) => claveDia(e.inicio) === clave).forEach((e) => items.push({
        tipo: 'google', titulo: e.titulo, hora: e.inicio, todoElDia: e.todoElDia, origen: `Google ${e.origen}`, color: e.color,
    }));

    return items.sort((a, b) => (!!b.todoElDia - !!a.todoElDia) || (a.hora - b.hora));
}

function filaItem(item, alBorrar) {
    const hijos = [
        crear('span', { className: 'hora', textContent: item.todoElDia ? 'Todo el día' : horaTexto(item.hora) }),
        crear('i', { className: 'punto', style: `background:${item.color}` }),
        crear('div', { className: 'texto' }, [
            crear('span', { textContent: (item.tipo === 'recordatorio' ? '🔔 ' : '') + item.titulo }),
            crear('span', { className: 'racha', textContent: item.origen }),
        ]),
    ];
    if (item.tipo === 'evento') {
        hijos.push(botonBorrar('Borrar evento', () => { datos.eventos = datos.eventos.filter((x) => x.id !== item.ref.id); guardar(); alBorrar(); }));
    } else if (item.tipo === 'recordatorio') {
        hijos.push(botonBorrar('Borrar recordatorio', () => borrarRecordatorio(item.ref.id)));
    }
    return crear('li', {}, hijos);
}

function borrarRecordatorio(idRec) {
    datos.recordatorios = datos.recordatorios.filter((x) => x.id !== idRec);
    guardar();
    programarNotificaciones();
    refrescarAgenda();
}

async function pintarAgendaHoy() {
    const lista = $('#agenda-hoy');
    const items = await itemsDelDia(claveDia());
    lista.replaceChildren();
    if (!items.length) {
        lista.append(vacio(datos.cuentas.length ? 'Día libre. Disfruta tu oasis 🌴' : 'Sin eventos. Conecta tus calendarios de Google en Ajustes ⚙️'));
        return;
    }
    items.forEach((it) => lista.append(filaItem(it, pintarAgendaHoy)));
}

// ---------- Calendario mensual ----------
let mesVisto = new Date(); mesVisto.setDate(1);
let diaSeleccionado = claveDia();

async function pintarCalendario() {
    const anio = mesVisto.getFullYear();
    const mes = mesVisto.getMonth();
    $('#mes-titulo').textContent = mayuscula(mesVisto.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));

    const google = await eventosGoogleMes(anio, mes);
    $('#estado-google').textContent = errorGoogle
        || (datos.cuentas.length ? `Calendarios conectados: ${datos.cuentas.map((c) => c.etiqueta).join(' y ')}` : 'Conecta tu Google personal y el del trabajo en Ajustes ⚙️');

    const conCosas = new Set();
    google.forEach((e) => conCosas.add(claveDia(e.inicio)));
    datos.eventos.forEach((e) => conCosas.add(claveDia(new Date(e.inicio))));

    const cal = $('#calendario');
    cal.replaceChildren();
    const primero = new Date(anio, mes, 1);
    const huecos = (primero.getDay() + 6) % 7; // semana empieza en lunes
    for (let i = 0; i < huecos; i++) cal.append(crear('span'));
    const diasMes = new Date(anio, mes + 1, 0).getDate();
    const hoy = claveDia();
    for (let d = 1; d <= diasMes; d++) {
        const clave = claveDia(new Date(anio, mes, d));
        // Los recordatorios diarios no se marcan (llenarían todo el mes)
        const tieneRec = datos.recordatorios.some((r) => r.repetir !== 'diario' && ocurrenciaEn(r, clave));
        const clases = ['dia'];
        if (clave === hoy) clases.push('hoy');
        if (clave === diaSeleccionado) clases.push('sel');
        const marcas = crear('span', { className: 'marcas' });
        if (conCosas.has(clave)) marcas.append(crear('i'));
        if (tieneRec) marcas.append(crear('i', { className: 'rec' }));
        cal.append(crear('button', {
            className: clases.join(' '),
            ariaLabel: fechaDeClave(clave).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }),
            onclick: () => { diaSeleccionado = clave; pintarCalendario(); pintarDia(); },
        }, [crear('span', { textContent: String(d) }), marcas]));
    }
}

async function pintarDia() {
    const f = fechaDeClave(diaSeleccionado);
    $('#dia-titulo').textContent = diaSeleccionado === claveDia() ? 'Hoy' : mayuscula(f.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }));
    const items = await itemsDelDia(diaSeleccionado);
    const lista = $('#lista-dia');
    lista.replaceChildren();
    if (!items.length) lista.append(vacio('Nada este día.'));
    items.forEach((it) => lista.append(filaItem(it, refrescarAgenda)));
}

function pintarRecordatorios() {
    const lista = $('#lista-recordatorios');
    lista.replaceChildren();
    const ahora = new Date();
    const proximos = datos.recordatorios
        .map((r) => ({ r, cuando: proximaOcurrencia(r, ahora) }))
        .filter((x) => x.r.repetir || x.cuando > ahora)
        .sort((a, b) => a.cuando - b.cuando);
    if (!proximos.length) { lista.append(vacio('No tienes recordatorios pendientes.')); return; }
    proximos.forEach(({ r, cuando }) => {
        const texto = cuando.toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        lista.append(crear('li', {}, [
            crear('span', { textContent: '🔔' }),
            crear('div', { className: 'texto' }, [
                crear('span', { textContent: r.texto }),
                crear('span', { className: 'racha', textContent: texto + (r.repetir === 'diario' ? ' · cada día' : r.repetir === 'semanal' ? ' · cada semana' : '') }),
            ]),
            botonBorrar('Borrar recordatorio', () => borrarRecordatorio(r.id)),
        ]));
    });
}

function refrescarAgenda() {
    pintarAgendaHoy();
    pintarCalendario();
    pintarDia();
    pintarRecordatorios();
}

$('#mes-ant').addEventListener('click', () => { mesVisto.setMonth(mesVisto.getMonth() - 1); pintarCalendario(); });
$('#mes-sig').addEventListener('click', () => { mesVisto.setMonth(mesVisto.getMonth() + 1); pintarCalendario(); });

// ---------- Hoja: nuevo evento / recordatorio ----------
let modoHoja = 'evento';
function abrirHoja(modo) {
    modoHoja = modo;
    $('#hoja-titulo').textContent = modo === 'evento' ? 'Nuevo evento' : 'Nuevo recordatorio';
    $('#hoja-texto').placeholder = modo === 'evento' ? 'Título del evento' : '¿Qué quieres recordar?';
    $('#hoja-texto').value = '';
    $('#hoja-fecha').value = diaSeleccionado;
    const ahora = new Date(); ahora.setMinutes(0); ahora.setHours(ahora.getHours() + 1);
    $('#hoja-hora').value = horaTexto(ahora);
    $('#hoja-repetir').value = '';
    $('#hoja-repetir-campo').hidden = modo !== 'recordatorio';
    $('#hoja-destino-campo').hidden = modo !== 'evento';
    const destino = $('#hoja-destino');
    destino.replaceChildren(crear('option', { value: 'local', textContent: 'Solo en este móvil' }));
    cuentasActivas().forEach((c) => destino.append(crear('option', { value: c.id, textContent: `Google ${c.etiqueta} (${c.email})` })));
    $('#hoja').showModal();
    $('#hoja-texto').focus();
}
$('#nuevo-evento').addEventListener('click', () => abrirHoja('evento'));
$('#nuevo-recordatorio').addEventListener('click', () => abrirHoja('recordatorio'));
$('#hoja-cancelar').addEventListener('click', () => $('#hoja').close());

$('#form-hoja').addEventListener('submit', async (e) => {
    e.preventDefault();
    const titulo = $('#hoja-texto').value.trim();
    if (!titulo) return;
    const [h, m] = $('#hoja-hora').value.split(':').map(Number);
    const inicio = fechaDeClave($('#hoja-fecha').value);
    inicio.setHours(h, m, 0, 0);

    if (modoHoja === 'recordatorio') {
        datos.recordatorios.push({ id: id(), texto: titulo, cuando: inicio.toISOString(), repetir: $('#hoja-repetir').value, avisado: false });
        guardar();
        $('#hoja').close();
        await pedirPermisoNotificaciones();
        programarNotificaciones();
        aviso('Recordatorio guardado 🔔');
    } else {
        const destino = $('#hoja-destino').value;
        if (destino === 'local') {
            datos.eventos.push({ id: id(), titulo, inicio: inicio.toISOString() });
            guardar();
            $('#hoja').close();
            aviso('Evento guardado');
        } else {
            const cuenta = datos.cuentas.find((c) => c.id === destino);
            $('#hoja-guardar').disabled = true;
            try {
                await GoogleCal.crearEvento(cuenta, { titulo, inicio });
                delete cacheGoogle[`${inicio.getFullYear()}-${inicio.getMonth()}`];
                $('#hoja').close();
                aviso(`Evento creado en Google ${cuenta.etiqueta}`);
            } catch (err) {
                aviso(err.caducado ? 'Reconecta la cuenta en Ajustes ⚙️' : 'No se pudo crear el evento en Google');
            } finally {
                $('#hoja-guardar').disabled = false;
            }
        }
    }
    refrescarAgenda();
});

// ---------- Notificaciones ----------
// En el APK se usan notificaciones nativas programadas (llegan aunque la app esté cerrada).
// En la versión de Chrome se avisa mientras la app está abierta o en segundo plano reciente.
function notifNativas() {
    return GoogleCal.esAppNativa() && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications;
}

async function pedirPermisoNotificaciones() {
    try {
        const nativas = notifNativas();
        if (nativas) {
            const r = await nativas.requestPermissions();
            return r.display === 'granted';
        }
        if (!('Notification' in window)) return false;
        if (Notification.permission === 'default') await Notification.requestPermission();
        return Notification.permission === 'granted';
    } catch (e) { return false; } finally { pintarEstadoNotif(); }
}

function numeroNotif(texto) {
    let h = 0;
    for (const c of texto) h = (h * 31 + c.charCodeAt(0)) | 0;
    return Math.abs(h) % 2000000000;
}

async function programarNotificaciones() {
    const nativas = notifNativas();
    if (!nativas) return;
    try {
        const pendientes = await nativas.getPending();
        if (pendientes.notifications.length) await nativas.cancel({ notifications: pendientes.notifications.map((n) => ({ id: n.id })) });
        const ahora = new Date();
        const lista = datos.recordatorios
            .map((r) => ({ r, cuando: proximaOcurrencia(r, ahora) }))
            .filter((x) => x.cuando > ahora)
            .map(({ r, cuando }) => ({
                id: numeroNotif(r.id),
                title: 'Método Oasis 🌴',
                body: r.texto,
                schedule: r.repetir
                    ? { at: cuando, repeats: true, every: r.repetir === 'diario' ? 'day' : 'week', allowWhileIdle: true }
                    : { at: cuando, allowWhileIdle: true },
            }));
        if (lista.length) await nativas.schedule({ notifications: lista });
    } catch (e) { /* sin permiso */ }
}

async function mostrarNotificacion(texto) {
    if (!('Notification' in window) || Notification.permission !== 'granted') { aviso(`🔔 ${texto}`); return; }
    try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) reg.showNotification('Método Oasis 🌴', { body: texto, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' });
        else new Notification('Método Oasis 🌴', { body: texto, icon: 'icons/icon-192.png' });
    } catch (e) { aviso(`🔔 ${texto}`); }
}

// Revisa cada 30 s si toca algún recordatorio (versión web) y avanza los repetidos.
function revisarRecordatorios() {
    const ahora = new Date();
    let cambio = false;
    datos.recordatorios.forEach((r) => {
        const cuando = new Date(r.cuando);
        if (cuando > ahora || r.avisado) return;
        // Solo avisamos si no pasaron más de 12 h (para no avisar de cosas muy viejas)
        if (!notifNativas() && ahora - cuando < 12 * 3600 * 1000) mostrarNotificacion(r.texto);
        if (r.repetir) r.cuando = proximaOcurrencia(r, ahora).toISOString();
        else r.avisado = true;
        cambio = true;
    });
    if (cambio) { guardar(); pintarRecordatorios(); }
}

function pintarEstadoNotif() {
    let texto;
    if (notifNativas()) texto = 'Las notificaciones llegarán aunque la app esté cerrada.';
    else if (!('Notification' in window)) texto = 'Este navegador no permite notificaciones. Verás los avisos dentro de la app.';
    else if (Notification.permission === 'granted') texto = 'Notificaciones activadas ✅ Te avisaremos mientras la app esté abierta o en segundo plano. Para avisos con la app cerrada, usa el APK.';
    else if (Notification.permission === 'denied') texto = 'Notificaciones bloqueadas. Actívalas en los ajustes del navegador para este sitio.';
    else texto = 'Activa las notificaciones para recibir tus recordatorios.';
    $('#estado-notif').textContent = texto;
    $('#pedir-notif').hidden = !notifNativas() && 'Notification' in window && Notification.permission !== 'default';
}
$('#pedir-notif').addEventListener('click', async () => {
    const ok = await pedirPermisoNotificaciones();
    if (ok) { programarNotificaciones(); aviso('Notificaciones activadas'); }
});

// =====================================================================
// GASTOS
// =====================================================================
let mesGastos = new Date(); mesGastos.setDate(1);
let categoriaElegida = 'comida';

function pintarChipsCategorias() {
    const cont = $('#gasto-cats');
    cont.replaceChildren();
    CATEGORIAS.forEach((c) => cont.append(crear('button', {
        type: 'button',
        className: 'chip' + (c.id === categoriaElegida ? ' on' : ''),
        textContent: `${c.emoji} ${c.nombre}`,
        onclick: () => { categoriaElegida = c.id; pintarChipsCategorias(); },
    })));
}

function pintarGastos() {
    const prefijo = claveDia(mesGastos).slice(0, 7);
    $('#gastos-mes').textContent = mayuscula(mesGastos.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));
    const delMes = datos.gastos.filter((g) => g.fecha.startsWith(prefijo)).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.creado - a.creado);
    const total = delMes.reduce((s, g) => s + g.importe, 0);
    $('#gastos-total').textContent = moneda(total);

    const presupuesto = Number(datos.ajustes.presupuesto) || 0;
    const barra = $('#presupuesto-barra');
    if (presupuesto > 0) {
        const pct = Math.min(100, (total / presupuesto) * 100);
        barra.hidden = false;
        barra.firstElementChild.style.width = pct + '%';
        barra.classList.toggle('pasado', total > presupuesto);
        $('#presupuesto-texto').textContent = total > presupuesto
            ? `Te has pasado ${moneda(total - presupuesto)} del presupuesto (${moneda(presupuesto)}).`
            : `Te quedan ${moneda(presupuesto - total)} de ${moneda(presupuesto)}.`;
    } else {
        barra.hidden = true;
        $('#presupuesto-texto').textContent = delMes.length ? `${delMes.length} gastos este mes.` : '';
    }

    const porCat = CATEGORIAS.map((c) => ({ ...c, suma: delMes.filter((g) => g.cat === c.id).reduce((s, g) => s + g.importe, 0) }))
        .filter((c) => c.suma > 0).sort((a, b) => b.suma - a.suma);
    const cats = $('#gastos-categorias');
    cats.replaceChildren();
    porCat.forEach((c) => {
        const barraCat = crear('div', { className: 'barra-cat' }, [crear('div')]);
        barraCat.firstElementChild.style.width = (c.suma / porCat[0].suma) * 100 + '%';
        cats.append(crear('div', { className: 'cat' }, [
            crear('span', { textContent: `${c.emoji} ${c.nombre}` }),
            crear('span', { className: 'importe', textContent: moneda(c.suma) }),
            barraCat,
        ]));
    });

    const lista = $('#lista-gastos');
    lista.replaceChildren();
    if (!delMes.length) { lista.append(vacio('Sin gastos este mes.')); return; }
    delMes.forEach((g) => {
        const cat = CATEGORIAS.find((c) => c.id === g.cat) || CATEGORIAS[CATEGORIAS.length - 1];
        lista.append(crear('li', {}, [
            crear('span', { className: 'emoji', textContent: cat.emoji }),
            crear('div', { className: 'texto' }, [
                crear('span', { textContent: g.concepto || cat.nombre }),
                crear('span', { className: 'racha', textContent: fechaDeClave(g.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) }),
            ]),
            crear('span', { className: 'importe', textContent: moneda(g.importe) }),
            botonBorrar('Borrar gasto', () => { datos.gastos = datos.gastos.filter((x) => x.id !== g.id); guardar(); pintarGastos(); }),
        ]));
    });
}

$('#form-gasto').addEventListener('submit', (e) => {
    e.preventDefault();
    const importe = Math.round(parseFloat($('#gasto-importe').value.replace(',', '.')) * 100) / 100;
    if (!(importe > 0)) { aviso('Escribe un importe válido'); return; }
    const fecha = $('#gasto-fecha').value || claveDia();
    datos.gastos.push({ id: id(), importe, concepto: $('#gasto-concepto').value.trim(), cat: categoriaElegida, fecha, creado: Date.now() });
    guardar();
    $('#gasto-importe').value = '';
    $('#gasto-concepto').value = '';
    mesGastos = fechaDeClave(fecha); mesGastos.setDate(1);
    pintarGastos();
    aviso(`Gasto de ${moneda(importe)} guardado`);
});
$('#gastos-ant').addEventListener('click', () => { mesGastos.setMonth(mesGastos.getMonth() - 1); pintarGastos(); });
$('#gastos-sig').addEventListener('click', () => { mesGastos.setMonth(mesGastos.getMonth() + 1); pintarGastos(); });

// =====================================================================
// AJUSTES Y COPIA DE SEGURIDAD
// =====================================================================
function pintarAjustes() {
    $('#ajuste-moneda').value = datos.ajustes.moneda;
    $('#ajuste-presupuesto').value = datos.ajustes.presupuesto || '';
    $('#google-client-id').value = datos.ajustes.clientId || '';
    pintarCuentas();
    pintarEstadoNotif();
}
$('#ajuste-moneda').addEventListener('change', (e) => { datos.ajustes.moneda = e.target.value; guardar(); pintarGastos(); });
$('#ajuste-presupuesto').addEventListener('change', (e) => {
    const v = parseFloat(e.target.value);
    datos.ajustes.presupuesto = v > 0 ? v : null;
    guardar(); pintarGastos();
});

$('#exportar').addEventListener('click', () => {
    const copia = { ...datos, cuentas: datos.cuentas.map(({ token, expira, ...resto }) => resto) };
    const blob = new Blob([JSON.stringify(copia, null, 2)], { type: 'application/json' });
    const a = crear('a', { href: URL.createObjectURL(blob), download: `metodo-oasis-copia-${claveDia()}.json` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
$('#importar').addEventListener('click', () => $('#archivo-importar').click());
$('#archivo-importar').addEventListener('change', async (e) => {
    const archivo = e.target.files[0];
    e.target.value = '';
    if (!archivo) return;
    try {
        const nuevo = JSON.parse(await archivo.text());
        if (typeof nuevo !== 'object' || !Array.isArray(nuevo.tareas)) throw new Error();
        if (!confirm('Esto reemplazará los datos actuales por los de la copia. ¿Continuar?')) return;
        datos = { ...base(), ...nuevo, ajustes: { ...base().ajustes, ...(nuevo.ajustes || {}) } };
        guardar();
        pintarTodo();
        aviso('Copia importada');
    } catch (err) {
        aviso('Ese archivo no es una copia válida');
    }
});

// =====================================================================
// NAVEGACIÓN
// =====================================================================
function irA(vista) {
    document.querySelectorAll('.barra button').forEach((b) => b.classList.toggle('activa', b.dataset.vista === vista));
    document.querySelectorAll('.vista').forEach((v) => v.classList.toggle('activa', v.id === `vista-${vista}`));
    window.scrollTo(0, 0);
    if (vista === 'agenda') refrescarAgenda();
    if (vista === 'ajustes') pintarAjustes();
}
document.querySelectorAll('.barra button').forEach((btn) => btn.addEventListener('click', () => irA(btn.dataset.vista)));
$('#abrir-ajustes').addEventListener('click', () => irA('ajustes'));

// ---------- Instalación ----------
let avisoInstalar = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    avisoInstalar = e;
    $('#instalar').hidden = false;
});
$('#instalar').addEventListener('click', async () => {
    if (!avisoInstalar) return;
    avisoInstalar.prompt();
    await avisoInstalar.userChoice;
    avisoInstalar = null;
    $('#instalar').hidden = true;
});
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
}

// =====================================================================
// INICIO
// =====================================================================
let diaActual = claveDia();

function pintarTodo() {
    nuevoDia();
    pintarCabecera();
    pintarTareas();
    pintarAgua();
    pintarAnimo();
    pintarHabitos();
    pintarNotas();
    pintarChipsCategorias();
    $('#gasto-fecha').value = claveDia();
    pintarGastos();
    pintarAjustes();
    refrescarAgenda();
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    revisarRecordatorios();
    if (claveDia() !== diaActual) {
        diaActual = claveDia();
        diaSeleccionado = diaActual;
        pintarTodo();
    }
});

pintarTodo();
revisarRecordatorios();
programarNotificaciones();
setInterval(revisarRecordatorios, 30000);
