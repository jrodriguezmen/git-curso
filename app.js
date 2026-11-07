// ===== Mi Día — app de vida diaria (PWA) =====

const META_AGUA = 8;
const ANIMOS = ['😞', '😕', '😐', '🙂', '😄'];

// ---------- Utilidades ----------
const $ = (sel) => document.querySelector(sel);

function claveDia(fecha = new Date()) {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function diasAtras(n) {
    const f = new Date();
    f.setDate(f.getDate() - n);
    return claveDia(f);
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

// ---------- Datos (guardados en el teléfono) ----------
const CLAVE = 'mi-dia-v1';

function cargar() {
    try {
        const datos = JSON.parse(localStorage.getItem(CLAVE));
        if (datos) return datos;
    } catch (e) { /* datos dañados o sin acceso: empezamos de cero */ }
    return { tareas: [], habitos: [], notas: [], agua: {}, animo: {} };
}

let datos = cargar();

function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) { /* sin espacio */ }
}

// Al empezar un día nuevo, las tareas completadas de días anteriores se archivan
// y las pendientes pasan al día de hoy.
function nuevoDia() {
    const hoy = claveDia();
    datos.tareas = datos.tareas.filter((t) => !(t.hecha && t.dia !== hoy));
    datos.tareas.forEach((t) => { t.dia = hoy; });
    guardar();
}

// ---------- Cabecera ----------
function pintarCabecera() {
    const ahora = new Date();
    const h = ahora.getHours();
    const saludo = h < 6 ? 'Buenas noches' : h < 13 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
    $('#saludo').textContent = saludo;
    const fecha = ahora.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    $('#fecha').textContent = fecha.charAt(0).toUpperCase() + fecha.slice(1);
}

// ---------- Tareas ----------
function pintarTareas() {
    const lista = $('#lista-tareas');
    lista.replaceChildren();
    const hechas = datos.tareas.filter((t) => t.hecha).length;
    $('#contador-tareas').textContent = datos.tareas.length ? `${hechas}/${datos.tareas.length}` : '';
    $('#limpiar-tareas').hidden = hechas === 0;

    if (!datos.tareas.length) {
        lista.append(crear('li', { className: 'vacio', textContent: 'Nada pendiente. ¡Añade tu primera tarea!' }));
        return;
    }

    // Pendientes primero
    const ordenadas = [...datos.tareas].sort((a, b) => a.hecha - b.hecha);
    ordenadas.forEach((t) => {
        const check = crear('button', {
            className: 'check' + (t.hecha ? ' on' : ''),
            textContent: t.hecha ? '✓' : '',
            ariaLabel: t.hecha ? 'Marcar como pendiente' : 'Marcar como hecha',
            onclick: () => { t.hecha = !t.hecha; guardar(); pintarTareas(); },
        });
        const borrar = crear('button', {
            className: 'borrar', textContent: '✕', ariaLabel: 'Borrar tarea',
            onclick: () => { datos.tareas = datos.tareas.filter((x) => x.id !== t.id); guardar(); pintarTareas(); },
        });
        lista.append(crear('li', { className: t.hecha ? 'hecha' : '' }, [
            check, crear('span', { className: 'texto', textContent: t.texto }), borrar,
        ]));
    });
}

$('#form-tarea').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#input-tarea');
    const texto = input.value.trim();
    if (!texto) return;
    datos.tareas.push({ id: id(), texto, hecha: false, dia: claveDia() });
    input.value = '';
    guardar();
    pintarTareas();
});

$('#limpiar-tareas').addEventListener('click', () => {
    datos.tareas = datos.tareas.filter((t) => !t.hecha);
    guardar();
    pintarTareas();
});

// ---------- Agua ----------
function pintarAgua() {
    const n = datos.agua[claveDia()] || 0;
    $('#contador-agua').textContent = `${n}/${META_AGUA} vasos` + (n >= META_AGUA ? ' 🎉' : '');
    const vasos = $('#vasos');
    vasos.replaceChildren();
    for (let i = 0; i < Math.max(META_AGUA, n); i++) {
        vasos.append(crear('div', { className: 'vaso' + (i < n ? ' lleno' : '') }));
    }
}

function cambiarAgua(delta) {
    const hoy = claveDia();
    datos.agua[hoy] = Math.max(0, (datos.agua[hoy] || 0) + delta);
    guardar();
    pintarAgua();
}

$('#agua-mas').addEventListener('click', () => cambiarAgua(1));
$('#agua-menos').addEventListener('click', () => cambiarAgua(-1));

// ---------- Ánimo ----------
function pintarAnimo() {
    const actual = datos.animo[claveDia()];
    const cont = $('#animos');
    cont.replaceChildren();
    ANIMOS.forEach((emoji, i) => {
        cont.append(crear('button', {
            className: actual === i ? 'on' : '',
            textContent: emoji,
            ariaLabel: `Ánimo ${i + 1} de 5`,
            onclick: () => {
                datos.animo[claveDia()] = actual === i ? undefined : i;
                guardar();
                pintarAnimo();
            },
        }));
    });
}

// ---------- Hábitos ----------
function racha(habito) {
    const hechos = new Set(habito.dias);
    let n = 0;
    // Si hoy aún no está marcado, la racha cuenta desde ayer
    let i = hechos.has(diasAtras(0)) ? 0 : 1;
    while (hechos.has(diasAtras(i))) { n++; i++; }
    return n;
}

function pintarHabitos() {
    const lista = $('#lista-habitos');
    lista.replaceChildren();
    const hoy = claveDia();

    if (!datos.habitos.length) {
        lista.append(crear('li', { className: 'vacio', textContent: 'Aún no tienes hábitos. Prueba con "Beber agua" o "Caminar 30 min".' }));
        return;
    }

    datos.habitos.forEach((h) => {
        const hecho = h.dias.includes(hoy);
        const r = racha(h);
        const semana = crear('div', { className: 'semana' });
        for (let i = 6; i >= 0; i--) {
            semana.append(crear('i', { className: h.dias.includes(diasAtras(i)) ? 'on' : '' }));
        }
        const info = crear('div', { className: 'texto' }, [
            crear('span', { textContent: h.nombre }),
            crear('span', { className: 'racha', textContent: r ? `🔥 ${r} ${r === 1 ? 'día seguido' : 'días seguidos'}` : 'Empieza hoy' }),
            semana,
        ]);
        const check = crear('button', {
            className: 'check' + (hecho ? ' on' : ''),
            textContent: hecho ? '✓' : '',
            ariaLabel: hecho ? 'Desmarcar hoy' : 'Marcar hecho hoy',
            onclick: () => {
                h.dias = hecho ? h.dias.filter((d) => d !== hoy) : [...h.dias, hoy];
                guardar();
                pintarHabitos();
            },
        });
        const borrar = crear('button', {
            className: 'borrar', textContent: '✕', ariaLabel: 'Borrar hábito',
            onclick: () => {
                if (!confirm(`¿Borrar el hábito "${h.nombre}" y su historial?`)) return;
                datos.habitos = datos.habitos.filter((x) => x.id !== h.id);
                guardar();
                pintarHabitos();
            },
        });
        lista.append(crear('li', {}, [check, info, borrar]));
    });
}

$('#form-habito').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#input-habito');
    const nombre = input.value.trim();
    if (!nombre) return;
    datos.habitos.push({ id: id(), nombre, dias: [] });
    input.value = '';
    guardar();
    pintarHabitos();
});

// ---------- Notas ----------
function pintarNotas() {
    const lista = $('#lista-notas');
    lista.replaceChildren();
    if (!datos.notas.length) {
        lista.append(crear('li', { className: 'vacio', textContent: 'Tus notas aparecerán aquí.' }));
        return;
    }
    datos.notas.forEach((n) => {
        const fecha = new Date(n.fecha).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        const cuerpo = crear('div', { className: 'cuerpo', textContent: n.texto }, [crear('small', { textContent: fecha })]);
        const borrar = crear('button', {
            className: 'borrar', textContent: '✕', ariaLabel: 'Borrar nota',
            onclick: () => { datos.notas = datos.notas.filter((x) => x.id !== n.id); guardar(); pintarNotas(); },
        });
        lista.append(crear('li', {}, [cuerpo, borrar]));
    });
}

$('#form-nota').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#input-nota');
    const texto = input.value.trim();
    if (!texto) return;
    datos.notas.unshift({ id: id(), texto, fecha: Date.now() });
    input.value = '';
    guardar();
    pintarNotas();
});

// ---------- Navegación ----------
document.querySelectorAll('.barra button').forEach((btn) => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.barra button').forEach((b) => b.classList.toggle('activa', b === btn));
        document.querySelectorAll('.vista').forEach((v) => v.classList.toggle('activa', v.id === `vista-${btn.dataset.vista}`));
        window.scrollTo(0, 0);
    });
});

// ---------- Instalación en Android ----------
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

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ---------- Inicio ----------
let diaActual = claveDia();

function pintarTodo() {
    nuevoDia();
    pintarCabecera();
    pintarTareas();
    pintarAgua();
    pintarAnimo();
    pintarHabitos();
    pintarNotas();
}

// Si la app queda abierta y cambia el día, se actualiza sola al volver a ella
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && claveDia() !== diaActual) {
        diaActual = claveDia();
        pintarTodo();
    }
});

pintarTodo();
