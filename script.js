@@ -1,584 +1 @@
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, set, update, remove, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBwWhut9ALZuP5skWRT6RIBUR7hcf408Ks",
    authDomain: "gestion-de-stock-ab0fe.firebaseapp.com",
    databaseURL: "https://gestion-de-stock-ab0fe-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "gestion-de-stock-ab0fe",
    storageBucket: "gestion-de-stock-ab0fe.appspot.com",
    messagingSenderId: "45302180887",
    appId: "1:45302180887:web:12d0f6fe21eed0e5dc052",
    measurementId: "G-YRBRV377PP"
};

const categoriasList = [
    "Adaptador", "Altavoces", "Atena", "Auriculares Tienda", "Botonera",
    "Cables", "Cajón", "Cargador", "Cascos oficina", "Duplicadores",
    "Hubs", "Impresora Blaster", "Impresora Oficina", "Impresora Tickets",
    "Kitchen", "Memorias", "Meraki", "Monitor", "ONT", "Pantalla",
    "Pantalla Menuboard 40", "Portatil", "Ratones", "Router", "Seguridad",
    "Servidor", "Switch", "Tablet", "Teclado", "Telefonos", "TPV", "UPS FoodTruck"
];

const tiendas = [
    "SERRANO", "PRINCIPE", "PESETA", "SILVANO", "SANSE", "ALBUFERA", "SANCHINARRO", "VALLEJO",
    "GETAFE EL BERCIAL", "ALCORCON NORTE", "MOSTOLES NORTE", "ANTRACITA", "SUECIA", "TORREJON",
    "GALILEO", "LEGANES", "FUENLABRADA", "ALCALA JOSE MARIA PEREDA", "TOLEDO", "VILLALBA",
    "GETAFE LOS MOLINOS", "PALACIO", "LAS ROZAS", "CUENCA", "TELESFORO", "VALLADOLID RECOLETOS",
    "SABADELL", "DIAGONAL", "ZARAGOZA DELICIAS", "ALCOBENDAS", "ZARAGOZA CASCO ANTIGUO",
    "GENERAL RICARDOS", "LOS YEBENES", "LEON", "BURGOS", "ALCALA LOPE DE FIGUEROA", "GIJON ESTE",
    "MARQUES DE VIANA", "BILBAO", "ORCASITAS", "TARRASA", "VALDEMORO", "VALDERREBOLLO", "SICILIA",
    "GIJON SUR", "POZUELO", "SALAMANCA", "CERRO MINGUETE", "CORTES CATALANAS", "ALCORCON SUR",
    "ISABEL COLBRAND", "MOSTOLES SUR", "BADALONA", "MAJADAHONDA", "ZARAGOZA LA JOTA", "DIAMANTE",
    "PERIS & VALERO", "FABRA", "PARIS", "ARTURO SORIA", "REINA VICTORIA", "HOSPITALET", "COSLADA",
    "PESET", "MUNTANER", "SARRIÀ", "BLASCO IBÁÑEZ", "USERA", "TRES FORQUES", "CORNELLA", "RIVAS",
    "PARLA CENTRO", "SANT ADRIÀ", "TOMARES", "REPUBLICA ARGENTINA", "MORATALAZ", "SEVILLA ESTE",
    "DOS HERMANAS", "SAN CIPRIANO", "VALLECAS DK", "GUADALAJARA", "Oviedo General Elorza",
    "Zaragoza Las Fuentes", "Sevilla Nervión", "BILBAO ABANDO", "SANTANDER CAZOÑA", "Tres Cantos",
    "Torrevieja", "Santander Puerto", "Aguadulce", "Benidorm", "Molins de Rei", "Logroño", "Vitoria",
    "Foodtruck3", "Massanassa", "Donosti"
];

let db;
let usuarioActual = localStorage.getItem('stock_user') || '';
let descuentoPendiente = null;
let inventarioGlobal = {};
let cantidadesFila = {};
let dispositivosPorCategoriaGlobal = {};
let actividadLogsGlobal = []; // almacenará logs normalizados

function init() {
    try {
        const app = initializeApp(firebaseConfig);
        db = getDatabase(app);
    } catch (err) {
        console.error("Error Firebase:", err);
        const le = document.getElementById('loginError');
        if (le) le.textContent = "Error de conexión con la base de datos.";
    }

    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
        const icon = document.getElementById('darkModeIcon');
        if (icon) icon.textContent = '☀️';
    }

    // EVENTOS DE NAVEGACIÓN Y MENÚ
    const dm = document.getElementById('darkModeBtn'); if (dm) dm.addEventListener('click', toggleDarkMode);
    const btnLogin = document.getElementById('btnLogin'); if (btnLogin) btnLogin.addEventListener('click', iniciarSesion);
    const btnChangeUser = document.getElementById('btnChangeUser'); if (btnChangeUser) btnChangeUser.addEventListener('click', cambiarUsuario);
    const btnExport = document.getElementById('btnExport'); if (btnExport) btnExport.addEventListener('click', exportarExcel);
    const btnCancelModal = document.getElementById('btnCancelModal'); if (btnCancelModal) btnCancelModal.addEventListener('click', cerrarModal);
    const btnConfirmModal = document.getElementById('btnConfirmModal'); if (btnConfirmModal) btnConfirmModal.addEventListener('click', confirmarDescuento);
    const searchInput = document.getElementById('searchInput'); if (searchInput) searchInput.addEventListener('input', filtrarInventario);
    const filterTipoEl = document.getElementById('filterTipo'); if (filterTipoEl) filterTipoEl.addEventListener('change', filtrarInventario);
    const filterUbic = document.getElementById('filterUbicacion'); if (filterUbic) filterUbic.addEventListener('change', filtrarInventario);
    const filterEstado = document.getElementById('filterEstado'); if (filterEstado) filterEstado.addEventListener('change', filtrarInventario);
    const btnClearFilters = document.getElementById('btnClearFilters'); if (btnClearFilters) btnClearFilters.addEventListener('click', limpiarFiltros);
    const btnClearLogs = document.getElementById('btnClearLogs'); if (btnClearLogs) btnClearLogs.addEventListener('click', abrirModalActividad);
    const btnCancelarActividad = document.getElementById('btnCancelarActividad'); if (btnCancelarActividad) btnCancelarActividad.addEventListener('click', cerrarModalActividad);
    const btnConfirmarActividad = document.getElementById('btnConfirmarActividad'); if (btnConfirmarActividad) btnConfirmarActividad.addEventListener('click', confirmarReinicioActividad);

    // BINDING DE PESTAÑAS
    const tInv = document.getElementById('tabBtnInventario'); if (tInv) tInv.addEventListener('click', () => cambiarPestana('inventario'));
    const tNue = document.getElementById('tabBtnNuevo'); if (tNue) tNue.addEventListener('click', () => cambiarPestana('nuevo'));
    const tTie = document.getElementById('tabBtnTiendas'); if (tTie) tTie.addEventListener('click', () => cambiarPestana('tiendas'));
    const tAct = document.getElementById('tabBtnActividad'); if (tAct) tAct.addEventListener('click', () => cambiarPestana('actividad'));

    // EVENTOS CAMBIO DE CATEGORÍA PARA FILTRAR DISPOSITIVOS
    const tipoProductoEl = document.getElementById('tipoProducto'); if (tipoProductoEl) tipoProductoEl.addEventListener('change', (e) => actualizarDesplegableDispositivos('nombreSelect', e.target.value));
    const tiendaTipoEl = document.getElementById('tiendaTipo'); if (tiendaTipoEl) tiendaTipoEl.addEventListener('change', (e) => actualizarDesplegableDispositivos('tiendaNombreSelect', e.target.value));

    // EVENTO ABRIR MODAL DESDE PESTAÑA AÑADIR ENTRADA
    const btnCrearNuevo = document.getElementById('btnCrearNuevoDispositivoEntrada'); if (btnCrearNuevo) btnCrearNuevo.addEventListener('click', () => {
        const cat = document.getElementById('tipoProducto')?.value;
        if (!cat) { showToast("Selecciona primero una categoría", "error"); return; }
        abrirModalNuevoDispositivo(cat);
    });

    const btnCancelarNuevo = document.getElementById('btnCancelarNuevoDispositivo'); if (btnCancelarNuevo) btnCancelarNuevo.addEventListener('click', cerrarModalNuevoDispositivo);

    const btnGuardarNuevoDisp = document.getElementById('btnGuardarNuevoDispositivo'); if (btnGuardarNuevoDisp) btnGuardarNuevoDisp.addEventListener('click', async () => {
        const cat = document.getElementById('modalCategoriaTarget').textContent;
        const nuevoNombre = document.getElementById('inputNuevoNombreDispositivo').value.trim();
        if (!nuevoNombre) { showToast("Escribe un nombre válido", "error"); return; }
        try {
            const dispRef = push(ref(db, `dispositivos_por_categoria/${cat}`));
            await set(dispRef, { nombre: nuevoNombre });
            document.getElementById('inputNuevoNombreDispositivo').value = '';
            showToast(`Dispositivo "${nuevoNombre}" añadido a ${cat}`);
        } catch (e) { showToast("Error al guardar dispositivo", "error"); }
    });

    const selectTiendaModulo = document.getElementById('selectTiendaModulo'); if (selectTiendaModulo) selectTiendaModulo.addEventListener('change', (e) => cargarEquiposTienda(e.target.value));

    ['nombreUsuario', 'passwordUsuario', 'nombrePersonal'].forEach(id => {
        const el = document.getElementById(id); if (!el) return; el.addEventListener('keypress', (e) => { if (e.key === 'Enter') iniciarSesion(); });
    });

    const inputUser = document.getElementById('nombreUsuario'); if (inputUser) inputUser.addEventListener('input', (e) => {
        const val = e.target.value.trim().toLowerCase(); const container = document.getElementById('nombrePersonalContainer'); if (!container) return; if (val === 'tecnico') container.classList.remove('hidden'); else container.classList.add('hidden');
    });

    if (usuarioActual && db) mostrarApp();
}

function cambiarPestana(pestana) {
    const tabInv = document.getElementById('tabInventarioSection');
    const tabNue = document.getElementById('tabNuevoSection');
    const tabTie = document.getElementById('tabTiendasSection');
    const tabAct = document.getElementById('tabActividadSection');

    const btnInv = document.getElementById('tabBtnInventario');
    const btnNue = document.getElementById('tabBtnNuevo');
    const btnTie = document.getElementById('tabBtnTiendas');
    const btnAct = document.getElementById('tabBtnActividad');

    const activeClass = "bg-brand-600 text-white shadow-md";
    const inactiveClass = "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-100 hover:text-brand-700";

    [tabInv, tabNue, tabTie, tabAct].forEach(el => el.classList.add('hidden'));
    [btnInv, btnNue, btnTie, btnAct].forEach(btn => { if (btn) btn.className = `px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${inactiveClass}`; });

    if (pestana === 'inventario') {
        tabInv.classList.remove('hidden'); if (btnInv) btnInv.className = `px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${activeClass}`;
    } else if (pestana === 'nuevo') {
        tabNue.classList.remove('hidden'); if (btnNue) btnNue.className = `px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${activeClass}`;
    } else if (pestana === 'tiendas') {
        tabTie.classList.remove('hidden'); if (btnTie) btnTie.className = `px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${activeClass}`;
    } else if (pestana === 'actividad') {
        tabAct.classList.remove('hidden'); if (btnAct) btnAct.className = `px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${activeClass}`;
    }
}

function toggleDarkMode() {
    const html = document.documentElement;
    const icon = document.getElementById('darkModeIcon');
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        if (icon) icon.textContent = '🌙';
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        if (icon) icon.textContent = '☀️';
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    const bgClass = type === 'success' ? 'bg-emerald-600' : (type === 'error' ? 'bg-red-600' : 'bg-slate-800');
    toast.className = `${bgClass} text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold uppercase tracking-wider transition transform translate-y-2 opacity-0 flex items-center gap-2`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.remove('translate-y-2', 'opacity-0'); }, 50);
    setTimeout(() => { toast.classList.add('opacity-0', 'transition-opacity'); setTimeout(() => toast.remove(), 300); }, 3000);
}

function iniciarSesion() {
    const usuario = document.getElementById('nombreUsuario')?.value.trim();
    const password = document.getElementById('passwordUsuario')?.value;
    const nombrePersonal = document.getElementById('nombrePersonal')?.value.trim();
    const errorElement = document.getElementById('loginError');

    if (!usuario || !password) {
        if (errorElement) errorElement.textContent = "Por favor, introduce usuario y contraseña.";
        return;
    }

    if (usuario.toLowerCase() === 'tecnico') {
        if (password !== 'papainventario') {
            if (errorElement) errorElement.textContent = "Contraseña incorrecta para Técnico.";
            return;
        }
        if (!nombrePersonal) {
            if (errorElement) errorElement.textContent = "Por favor, introduce tu nombre personal.";
            return;
        }
        usuarioActual = `Técnico: ${nombrePersonal}`;
    } else {
        usuarioActual = usuario;
    }

    localStorage.setItem('stock_user', usuarioActual);
    if (errorElement) errorElement.textContent = "";
    mostrarApp();
}

function cambiarUsuario() {
    localStorage.removeItem('stock_user');
    location.reload();
}

function mostrarApp() {
    const loginContainer = document.getElementById('loginContainer'); if (loginContainer) loginContainer.classList.add('hidden');
    const appContainer = document.getElementById('appContainer'); if (appContainer) appContainer.classList.remove('hidden');
    const ud = document.getElementById('userDisplay'); if (ud) ud.textContent = `👤 ${usuarioActual}`;
    
    // Rellenar categorías
    const tipoSelectForm = document.getElementById('tipoProducto');
    if (tipoSelectForm) tipoSelectForm.innerHTML = '<option value="">Selecciona categoría</option>' + categoriasList.map(c => `<option value="${c}">${c}</option>`).join('');

    const filterTipo = document.getElementById('filterTipo');
    if (filterTipo) filterTipo.innerHTML = '<option value="">Todas las categorías</option>' + categoriasList.map(c => `<option value="${c}">${c}</option>`).join('');

    const tiendaTipo = document.getElementById('tiendaTipo');
    if (tiendaTipo) tiendaTipo.innerHTML = '<option value="">Categoría</option>' + categoriasList.map(c => `<option value="${c}">${c}</option>`).join('');

    // Tiendas
    const tiendaSelect = document.getElementById('tiendaDestino');
    if (tiendaSelect) tiendaSelect.innerHTML = '<option value="">Selecciona una tienda</option>' + tiendas.map(t => `<option value="${t}">${t}</option>`).join('');

    const selectTiendaModulo = document.getElementById('selectTiendaModulo');
    if (selectTiendaModulo) selectTiendaModulo.innerHTML = '<option value="">Selecciona una tienda corporativa...</option>' + tiendas.map(t => `<option value="${t}">${t}</option>`).join('');

    iniciarLogica();
}

function abrirModalNuevoDispositivo(categoria) {
    const modalTarget = document.getElementById('modalCategoriaTarget'); if (modalTarget) modalTarget.textContent = categoria;
    const inputNuevo = document.getElementById('inputNuevoNombreDispositivo'); if (inputNuevo) inputNuevo.value = '';
    renderizarListaDispositivosModal(categoria);
    const modal = document.getElementById('modalNuevoDispositivo'); if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
}

function cerrarModalNuevoDispositivo() {
    const modal = document.getElementById('modalNuevoDispositivo'); if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
    const catEntrada = document.getElementById('tipoProducto')?.value; actualizarDesplegableDispositivos('nombreSelect', catEntrada);
    const catTienda = document.getElementById('tiendaTipo')?.value; actualizarDesplegableDispositivos('tiendaNombreSelect', catTienda);
}

function renderizarListaDispositivosModal(categoria) {
    const container = document.getElementById('listaExistenteDispositivos'); if (!container) return; container.innerHTML = "";
    const dispMap = dispositivosPorCategoriaGlobal[categoria] || {};
    const ids = Object.keys(dispMap);
    if (ids.length === 0) { container.innerHTML = `<p class="text-slate-400 text-[11px] italic">No hay dispositivos añadidos para esta categoría.</p>`; return; }
    ids.forEach(id => {
        const item = dispMap[id];
        const div = document.createElement('div');
        div.className = "flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700";
        div.innerHTML = `
            <span>${item.nombre}</span>
            <button type="button" onclick="window.eliminarDispositivoCategoria('${categoria}', '${id}', '${item.nombre.replace(/'/g, "\\'")}')" class="text-red-500 hover:text-red-700 font-bold px-2">Eliminar</button>
        `;
        container.appendChild(div);
    });
}

window.eliminarDispositivoCategoria = async function(categoria, idDisp, nombreDisp) {
    if (!confirm(`¿Eliminar "${nombreDisp}" de la categoría ${categoria}?`)) return;
    try { await remove(ref(db, `dispositivos_por_categoria/${categoria}/${idDisp}`)); showToast("Dispositivo eliminado"); renderizarListaDispositivosModal(categoria); } catch (e) { showToast("Error al eliminar", "error"); }
};

function actualizarDesplegableDispositivos(selectId, categoria) {
    const select = document.getElementById(selectId); if (!select) return;
    if (!categoria) { select.innerHTML = '<option value="">Selecciona categoría primero...</option>'; return; }
    const dispMap = dispositivosPorCategoriaGlobal[categoria] || {};
    const nombres = Object.values(dispMap).map(d => d.nombre);
    if (nombres.length === 0) { select.innerHTML = '<option value="">(Sin dispositivos, usa "➕ Nuevo")</option>'; } else { select.innerHTML = '<option value="">Selecciona dispositivo...</option>' + nombres.map(n => `<option value="${n}">${n}</option>`).join(''); }
}

// registrarLog mantiene compatibilidad; recomendamos añadir tipo explícito en el futuro
function registrarLog(accion, comentario = '') {
    if (!db) return;
    try {
        const logsRef = ref(db, 'historial');
        const nuevoLogRef = push(logsRef);
        let detalle = accion;
        if (comentario) detalle += ` | Motivo/Nota: ${comentario}`;
        set(nuevoLogRef, {
            usuario: usuarioActual,
            detalle: detalle,
            fecha: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })
        });
    } catch (e) { console.error("Error historial:", e); }
}

/**
 * Detecta el tipo a partir del texto del detalle del log.
 * Devuelve uno de: 'retirada', 'anadido', 'eliminado', 'creado'
 */
function detectarTipoDesdeDetalle(detalle = '') {
  const d = detalle.toLowerCase();
  if (d.includes('salida') || d.includes('salida (-') || d.match(/salida\s*\(|salida\s*-/)) return 'retirada';
  if (d.includes('eliminó') || d.includes('eliminado')) return 'eliminado';
  if (d.includes('añadió') || d.includes('añadio')) return 'creado';
  if (d.includes('entrada') || d.includes('entrada (+') || d.includes('entrada +')) return 'anadido';
  if (d.includes('asignó') || d.includes('asigno') || d.includes('asignó equipo')) return 'creado';
  if (d.includes('+')) return 'anadido';
  return 'creado';
}

// ---- ACTIVIDAD: UI wiring (usuarios, pills, filtros) ----
function escapeHtml(str) { return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;"); }

function renderUserCheckboxes(users = []) {
  const container = document.getElementById('userFilterActividadContainer'); if (!container) return; container.innerHTML = '';
  users.forEach(u => {
    const id = u.id ?? u.name ?? u;
    const name = u.name ?? u;
    const div = document.createElement('div');
    div.className = 'user-checkbox';
    div.innerHTML = `
      <label class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
        <input type="checkbox" data-user-id="${escapeHtml(id)}" class="user-filter-checkbox" />
        <span class="truncate">${escapeHtml(name)}</span>
      </label>
    `;
    container.appendChild(div);
  });
}

function cargarUsuariosActividad() {
  const usuariosRef = ref(db, 'usuarios');
  onValue(usuariosRef, (snap) => {
    const val = snap.val();
    if (val && Object.keys(val).length) {
      const list = [];
      Object.entries(val).forEach(([k, v]) => { if (v && (v.active === undefined || v.active === true)) list.push({ id: k, name: v.name || v.nombre || k }); });
      if (list.length) { renderUserCheckboxes(list); return; }
    }
    // fallback: construir desde historial
    const map = new Map(); actividadLogsGlobal.forEach(l => { if (l.usuario && !map.has(l.usuario)) map.set(l.usuario, { id: l.usuario, name: l.usuario }); });
    renderUserCheckboxes(Array.from(map.values()));
  }, { onlyOnce: true });
}

function setupUserSearch() {
  const input = document.getElementById('userFilterSearch'); if (!input) return; input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase(); const items = document.querySelectorAll('#userFilterActividadContainer .user-checkbox');
    items.forEach(item => { const text = item.textContent.trim().toLowerCase(); item.style.display = (!q || text.includes(q)) ? 'flex' : 'none'; });
  });
}

function setupTipoPills() { document.querySelectorAll('.tipo-pill').forEach(p => { p.classList.remove('selected'); p.addEventListener('click', () => { p.classList.toggle('selected'); }); }); }

function setupActividadButtons() {
  const aplicar = document.getElementById('aplicarFiltrosActividad'); const limpiar = document.getElementById('limpiarFiltrosActividad');
  if (aplicar) aplicar.addEventListener('click', () => renderActividadFiltrosAplicados());
  if (limpiar) limpiar.addEventListener('click', () => {
    document.querySelectorAll('#userFilterActividadContainer input.user-filter-checkbox').forEach(cb => cb.checked = false);
    document.querySelectorAll('.tipo-pill').forEach(p => p.classList.remove('selected'));
    document.querySelectorAll('.tipo-pill').forEach(p => p.classList.add('selected'));
    renderActividadFiltrosAplicados();
  });
}

function getUsuariosSeleccionadosActividad() {
  return Array.from(document.querySelectorAll('#userFilterActividadContainer input.user-filter-checkbox:checked')).map(cb => cb.dataset.userId);
}

function getTiposSeleccionadosActividad() { return Array.from(document.querySelectorAll('.tipo-pill.selected')).map(el => el.dataset.value); }

function renderActividadFiltrosAplicados() {
  const container = document.getElementById('logsContainer'); const summary = document.getElementById('actividadSummary'); if (!container) return;
  container.innerHTML = '';
  if (!actividadLogsGlobal || actividadLogsGlobal.length === 0) { container.innerHTML = `<p class="text-center text-slate-400 py-10 text-xs font-medium">Sin actividad.</p>`; if (summary) summary.textContent = 'Mostrando 0 registros'; return; }
  const usuariosSel = getUsuariosSeleccionadosActividad(); const tiposSel = getTiposSeleccionadosActividad();
  const items = actividadLogsGlobal.filter(log => { if (usuariosSel.length && !usuariosSel.includes(log.usuario)) return false; if (tiposSel.length && !tiposSel.includes(log.tipo)) return false; return true; });
  if (items.length === 0) { container.innerHTML = `<p class="text-center text-slate-400 py-10 text-xs font-medium">No hay registros que coincidan con los filtros.</p>`; if (summary) summary.textContent = `Mostrando 0 registros (de ${actividadLogsGlobal.length})`; return; }
  const slice = items.slice(0, 500);
  slice.forEach((log) => { const div = document.createElement('div'); div.className = "bg-brand-50/50 dark:bg-slate-800/40 p-3.5 rounded-xl border-l-4 border-brand-500 text-xs shadow-sm"; div.innerHTML = `
      <div class="flex justify-between items-center mb-1">
        <span class="font-black text-brand-700 dark:text-brand-400 uppercase tracking-wide">${escapeHtml(log.usuario)}</span>
        <span class="text-slate-400 text-[10px]">${escapeHtml(log.fecha)}</span>
      </div>
      <div class="text-slate-700 dark:text-slate-300 font-medium">${escapeHtml(log.detalle)}</div>
      <div class="text-[10px] text-slate-400 mt-1">Tipo: <strong>${escapeHtml(log.tipo)}</strong></div>
    `; container.appendChild(div); });
  if (summary) summary.textContent = `Mostrando ${slice.length} de ${items.length} coincidencias (total registros: ${actividadLogsGlobal.length})`;
}

// Live filtering: aplicar cambios en tiempo real (sin botón) y comportamiento visual de pills
function enableLiveActividadFiltering() {
  const userContainer = document.getElementById('userFilterActividadContainer'); if (userContainer) userContainer.addEventListener('change', () => renderActividadFiltrosAplicados());
  const userSearch = document.getElementById('userFilterSearch'); if (userSearch) userSearch.addEventListener('input', () => { const q = userSearch.value.trim().toLowerCase(); document.querySelectorAll('#userFilterActividadContainer .user-checkbox').forEach(item => { const text = item.textContent.trim().toLowerCase(); item.style.display = (!q || text.includes(q)) ? 'flex' : 'none'; }); });
  document.querySelectorAll('.tipo-pill').forEach(p => { p.addEventListener('click', () => {
    p.classList.toggle('selected');
    if (p.classList.contains('selected')) { p.classList.remove('bg-red-50','bg-emerald-50','bg-amber-50','bg-sky-50','text-red-600','text-emerald-700','text-amber-700','text-sky-700'); p.classList.add('bg-brand-800','text-white','shadow-md'); }
    else { const v = p.dataset.value; p.classList.remove('bg-brand-800','text-white','shadow-md'); if (v === 'retirada') p.classList.add('bg-red-50','text-red-600'); if (v === 'anadido') p.classList.add('bg-emerald-50','text-emerald-700'); if (v === 'eliminado') p.classList.add('bg-amber-50','text-amber-700'); if (v === 'creado') p.classList.add('bg-sky-50','text-sky-700'); }
    renderActividadFiltrosAplicados();
  }); });
}

// Hook: llamar cuando actividadLogsGlobal se actualiza
function onActividadLogsUpdated() {
  cargarUsuariosActividad();
  setupUserSearch();
  setupTipoPills();
  setupActividadButtons();
  // por defecto marcar todas las pills
  document.querySelectorAll('.tipo-pill').forEach(p => p.classList.add('selected'));
  // enable live behavior
  enableLiveActividadFiltering();
  renderActividadFiltrosAplicados();
}

function abrirModalActividad() { const m = document.getElementById('actividadModal'); if (m) { m.classList.remove('hidden'); m.classList.add('flex'); } }
function cerrarModalActividad() { const m = document.getElementById('actividadModal'); if (m) { m.classList.remove('flex'); m.classList.add('hidden'); } }
async function confirmarReinicioActividad() { if (!db) return; try { await remove(ref(db, 'historial')); cerrarModalActividad(); showToast("Historial reiniciado"); } catch (error) { showToast("Error al reiniciar historial", "error"); } }

function abrirModalDescuento(id, nombreProd, stockActual, cantidad) { descuentoPendiente = { id, nombreProd, stockActual, cantidad }; const modalName = document.getElementById('modalProductName'); if (modalName) modalName.textContent = `${nombreProd} (−${cantidad})`; const coment = document.getElementById('comentarioDescuento'); if (coment) coment.value = ''; const tiendaDestino = document.getElementById('tiendaDestino'); if (tiendaDestino) tiendaDestino.value = ''; const cm = document.getElementById('comentarioModal'); if (cm) { cm.classList.remove('hidden'); cm.classList.add('flex'); } }
function cerrarModal() { const cm = document.getElementById('comentarioModal'); if (cm) { cm.classList.remove('flex'); cm.classList.add('hidden'); } descuentoPendiente = null; }

function confirmarDescuento() {
    const comentario = document.getElementById('comentarioDescuento')?.value.trim();
    const tienda = document.getElementById('tiendaDestino')?.value.trim();
    if (!comentario || !tienda || !descuentoPendiente) { showToast("Completa los datos de salida", "error"); return; }
    const { id, nombreProd, cantidad } = descuentoPendiente;
    const stockActual = Number((inventarioGlobal[id] || {}).stock ?? descuentoPendiente.stockActual);
    const nuevoStock = stockActual - cantidad;
    if (nuevoStock < 0) { showToast(`Stock insuficiente (${stockActual})`, "error"); return; }
    try { update(ref(db, 'inventario/' + id), { stock: nuevoStock }); registrarLog(`Salida (-${cantidad}) en '${nombreProd}' [Tienda: ${tienda}]`, comentario); delete cantidadesFila[id]; cerrarModal(); showToast(`Stock descontado (−${cantidad})`); } catch (error) { console.error("Error:", error); }
}

function limpiarFiltros() { const si = document.getElementById('searchInput'); if (si) si.value = ''; const ft = document.getElementById('filterTipo'); if (ft) ft.value = ''; const fu = document.getElementById('filterUbicacion'); if (fu) fu.value = ''; const fe = document.getElementById('filterEstado'); if (fe) fe.value = ''; renderizarTablaInventario(); }
function filtrarInventario() { renderizarTablaInventario(); }

function renderizarTablaInventario() {
    const tableBody = document.getElementById('inventoryTable'); if (!tableBody) return;
    const searchText = document.getElementById('searchInput')?.value.toLowerCase().trim();
    const filterTipo = document.getElementById('filterTipo')?.value;
    const filterUbicacion = document.getElementById('filterUbicacion')?.value;
    const filterEstado = document.getElementById('filterEstado')?.value;
    tableBody.innerHTML = "";
    const ids = Object.keys(inventarioGlobal || {});
    if (ids.length === 0) { tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-10 text-slate-400 font-medium">Sin productos registrados en inventario.</td></tr>`; return; }
    let totalItems = 0; let totalStock = 0; let criticalCount = 0; let countRendered = 0;
    ids.forEach((id) => {
        const prod = inventarioGlobal[id]; totalItems++; totalStock += Number(prod.stock || 0); if (Number(prod.stock || 0) < 5) criticalCount++;
        const coincideTexto = !searchText || prod.nombre.toLowerCase().includes(searchText) || prod.referencia.toLowerCase().includes(searchText);
        const coincideTipo = !filterTipo || prod.tipo === filterTipo;
        const ubicacion = prod.ubicacion || 'Sin indicar'; const estado = prod.estado || 'Sin indicar';
        const coincideUbicacion = !filterUbicacion || ubicacion === filterUbicacion; const coincideEstado = !filterEstado || estado === filterEstado;
        if (!coincideTexto || !coincideTipo || !coincideUbicacion || !coincideEstado) return;
        countRendered++;
        const tipoBadge = prod.tipo ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 border border-slate-200 dark:border-slate-700">${prod.tipo}</span>` : '';
        const ubicacionBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${ubicacion === 'Sin indicar' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}">${ubicacion}</span>`;
        const estadoBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${estado === 'Nuevo' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}">${estado}</span>`;
        const precioFormateado = prod.precio ? `${parseFloat(prod.precio).toFixed(2)} €` : '0.00 €';
        const fechaFormateada = prod.fechaAdicion || 'No registrada';
        const tr = document.createElement('tr'); tr.className = "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition";
        tr.innerHTML = `
            <td class="py-3 px-3 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">${prod.referencia}</td>
            <td class="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                <div>${prod.nombre}</div>
                ${prod.comentario ? `<div class="text-[10px] text-slate-400 font-normal italic mt-0.5">💬 ${prod.comentario}</div>` : ''}
            </td>
            <td class="py-3 px-3">${tipoBadge}</td>
            <td class="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">${precioFormateado}</td>
            <td class="py-3 px-3 text-center text-[10px] text-slate-500 font-medium">${fechaFormateada}</td>
            <td class="py-3 px-3">${ubicacionBadge}</td>
            <td class="py-3 px-3 text-center">${estadoBadge}</td>
            <td class="py-3 px-3 text-center font-black text-brand-600 dark:text-brand-400 text-base">${prod.stock}</td>
            <td class="py-3 px-3 text-center">
                <div class="flex items-center justify-center gap-1.5">
                    <button onclick="window.ejecutarCambiarStock('${id}', -1)" title="Restar stock" class="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-black shadow transition">-</button>
                    <input type="number" min="1" value="${cantidadesFila[id] || 1}" oninput="window.guardarCantidad('${id}', this.value)" class="w-12 h-7 px-1 text-center bg-slate-50 dark:bg-slate-800 rounded-lg border">
                    <button onclick="window.ejecutarCambiarStock('${id}', 1)" title="Sumar stock" class="w-7 h-7 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-black shadow transition">+</button>
                    <button onclick="window.ejecutarEliminar('${id}', '${prod.nombre.replace(/'/g, "\\'")}')" class="h-7 px-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 rounded-xl text-xs">Eliminar</button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
    if (countRendered === 0) tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-10 text-slate-400 font-medium">No hay productos que coincidan con los filtros.</td></tr>`;
    document.getElementById('statTotalItems').textContent = totalItems; document.getElementById('statTotalStock').textContent = totalStock; document.getElementById('statCritical').textContent = criticalCount;
}

function cargarEquiposTienda(nombreTienda) {
    const tbody = document.getElementById('tablaTiendaBody'); const titulo = document.getElementById('tiendaTituloTabla');
    if (!nombreTienda) { if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center py-10 text-slate-400 font-medium">Selecciona una tienda arriba para consultar su equipamiento.</td></tr>`; if (titulo) titulo.textContent = "📋 Equipos Instalados en Tienda"; document.getElementById('statTiendaTotalEquipos').textContent = '0'; document.getElementById('statTiendaValorTotal').textContent = '0.00 €'; return; }
    if (titulo) titulo.textContent = `📋 Equipos Instalados en ${nombreTienda}`;
    const tiendaRef = ref(db, `tiendas/${nombreTienda}/equipos`);
    onValue(tiendaRef, (snapshot) => {
        const equipos = snapshot.val() || {}; if (!tbody) return; tbody.innerHTML = ""; const ids = Object.keys(equipos);
        if (ids.length === 0) { tbody.innerHTML = `<tr><td colspan="8" class="text-center py-10 text-slate-400 font-medium">No hay dispositivos registrados aún en ${nombreTienda}.</td></tr>`; document.getElementById('statTiendaTotalEquipos').textContent = '0'; document.getElementById('statTiendaValorTotal').textContent = '0.00 €'; return; }
        let totalCant = 0; let totalValor = 0;
        ids.forEach(id => { const eq = equipos[id]; const cantidad = Number(eq.cantidad || 1); const precio = Number(eq.precio || 0); totalCant += cantidad; totalValor += (cantidad * precio);
            const tr = document.createElement('tr'); tr.className = "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"; tr.innerHTML = `
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-brand-600">${eq.tipo}</span></td>
                <td class="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">${eq.nombre}${eq.notas ? `<div class="text-[10px] text-slate-400 italic font-normal">${eq.notas}</div>` : ''}</td>
                <td class="py-3 px-3 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">${eq.referencia}</td>
                <td class="py-3 px-3 text-center font-bold text-emerald-600">${precio.toFixed(2)} €</td>
                <td class="py-3 px-3 text-center text-[10px] text-slate-500">${eq.fechaInstalacion || '-'}</td>
                <td class="py-3 px-3 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${eq.estado === 'Nuevo' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}">${eq.estado}</span></td>
                <td class="py-3 px-3 text-center font-black text-brand-600">${cantidad}</td>
                <td class="py-3 px-3 text-center"><button onclick="window.eliminarEquipoTienda('${nombreTienda}', '${id}', '${eq.nombre.replace(/'/g, "\\'")}')" class="h-7 px-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 rounded-xl text-xs">Eliminar</button></td>
            `; tbody.appendChild(tr);
        });
        document.getElementById('statTiendaTotalEquipos').textContent = totalCant; document.getElementById('statTiendaValorTotal').textContent = `${totalValor.toFixed(2)} €`;
    });
}

function exportarExcel() {
    const ids = Object.keys(inventarioGlobal || {}); if (ids.length === 0) { showToast("No hay datos para exportar.", "error"); return; }
    let htmlTabla = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta http-equiv="content-type" content="text/html; charset=UTF-8"></head>
        <body>
            <table border="1">
                <thead>
                    <tr style="background-color: #0a6f2c; color: white;">
                        <th>Nº Serie</th><th>Nombre</th><th>Categoría</th><th>Precio (€)</th><th>Fecha Adición</th><th>Ubicación</th><th>Estado</th><th>Stock</th><th>Comentario</th>
                    </tr>
                </thead>
                <tbody>
    `;
    ids.forEach(id => { const p = inventarioGlobal[id]; htmlTabla += `
            <tr>
                <td>${p.referencia}</td>
                <td>${p.nombre}</td>
                <td>${p.tipo || '-'}</td>
                <td>${p.precio || '0.00'}</td>
                <td>${p.fechaAdicion || '-'}</td>
                <td>${p.ubicacion || '-'}</td>
                <td>${p.estado || '-'}</td>
                <td>${p.stock}</td>
                <td>${p.comentario || ''}</td>
            </tr>
        `; });
    htmlTabla += `</tbody></table></body></html>`;
    const blob = new Blob(["\ufeff" + htmlTabla], { type: 'application/vnd.ms-excel;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `Inventario_PapaJohns_${new Date().toISOString().slice(0,10)}.xls`; document.body.appendChild(a); a.click(); document.body.removeChild(a); showToast("Excel descargado");
}

function iniciarLogica() {
    const form = document.getElementById('productForm'); if (form) form.onsubmit = (e) => { e.preventDefault(); const tipo = document.getElementById('tipoProducto')?.value; const nombreFinal = document.getElementById('nombreSelect')?.value; const referencia = document.getElementById('ref')?.value.trim(); const precio = parseFloat(document.getElementById('precio')?.value) || 0; const stock = parseInt(document.getElementById('stock')?.value, 10) || 1; const ubicacion = document.getElementById('ubicacionProducto')?.value; const estado = document.getElementById('estadoProducto')?.value; const comentario = document.getElementById('comentarioEntrada')?.value.trim(); const fechaAdicion = new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); if (!nombreFinal) { showToast("Por favor selecciona o añade un dispositivo", "error"); return; } try { const nuevoProdRef = push(ref(db, 'inventario')); set(nuevoProdRef, { referencia, nombre: nombreFinal, tipo, precio, stock, ubicacion, estado, comentario, fechaAdicion }); registrarLog(`Añadió '${nombreFinal}' [Nº Serie: ${referencia}] - Precio: ${precio.toFixed(2)}€`, comentario); form.reset(); showToast("¡Artículo añadido con éxito!"); cambiarPestana('inventario'); } catch (error) { showToast("Error al añadir: " + error.message, "error"); } };

    const tiendaForm = document.getElementById('tiendaForm'); if (tiendaForm) tiendaForm.onsubmit = (e) => { e.preventDefault(); const nombreTienda = document.getElementById('selectTiendaModulo')?.value; if (!nombreTienda) { showToast("Selecciona una tienda primero", "error"); return; } const tipo = document.getElementById('tiendaTipo')?.value; const nombreFinal = document.getElementById('tiendaNombreSelect')?.value; const referencia = document.getElementById('tiendaRef')?.value.trim(); const precio = parseFloat(document.getElementById('tiendaPrecio')?.value) || 0; const cantidad = parseInt(document.getElementById('tiendaCantidad')?.value, 10) || 1; const estado = document.getElementById('tiendaEstado')?.value; const notas = document.getElementById('tiendaNotas')?.value.trim(); const fechaInstalacion = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }); if (!nombreFinal) { showToast("Selecciona un dispositivo", "error"); return; } try { const equipoRef = push(ref(db, `tiendas/${nombreTienda}/equipos`)); set(equipoRef, { tipo, nombre: nombreFinal, referencia, precio, cantidad, estado, notas, fechaInstalacion }); registrarLog(`Asignó equipo '${nombreFinal}' (${cantidad} ud/s) a la tienda ${nombreTienda}`); tiendaForm.reset(); showToast(`Dispositivo asignado a ${nombreTienda}`); } catch (error) { showToast("Error al asignar equipo", "error"); } };

    window.eliminarEquipoTienda = async function(nombreTienda, idEquipo, nombreEquipo) { if (!confirm(`¿Deseas eliminar '${nombreEquipo}' de la tienda ${nombreTienda}?`)) return; try { await remove(ref(db, `tiendas/${nombreTienda}/equipos/${idEquipo}`)); registrarLog(`Eliminó el equipo '${nombreEquipo}' de la tienda ${nombreTienda}`); showToast("Equipo eliminado de la tienda"); } catch (e) { showToast("Error al eliminar equipo", "error"); } };

    window.guardarCantidad = function(id, valor) { cantidadesFila[id] = valor; };

    window.ejecutarCambiarStock = function(id, signo) { const prod = inventarioGlobal[id]; if (!prod) return; const cantidad = parseInt(cantidadesFila[id], 10) || 1; const stockActual = Number(prod.stock || 0); if (signo < 0) { if (cantidad > stockActual) { showToast(`Imposible restar ${cantidad}: stock actual es ${stockActual}`, "error"); return; } abrirModalDescuento(id, prod.nombre, stockActual, cantidad); return; } const nuevoStock = stockActual + cantidad; update(ref(db, 'inventario/' + id), { stock: nuevoStock }); registrarLog(`Entrada (+${cantidad}) en '${prod.nombre}'. Stock total: ${nuevoStock}`); showToast(`Stock actualizado (+${cantidad})`); };

    let productoPendienteEliminar = null;

    window.ejecutarEliminar = function(id, nombreProd) { productoPendienteEliminar = { id, nombreProd }; const eliminarEl = document.getElementById('eliminarModalProducto'); if (eliminarEl) eliminarEl.textContent = nombreProd; const em = document.getElementById('eliminarModal'); if (em) { em.classList.remove('hidden'); em.classList.add('flex'); } };

    const btnCancelarEliminar = document.getElementById('btnCancelarEliminar'); if (btnCancelarEliminar) btnCancelarEliminar.addEventListener('click', () => { const em = document.getElementById('eliminarModal'); if (em) em.classList.add('hidden'); productoPendienteEliminar = null; });

    const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar'); if (btnConfirmarEliminar) btnConfirmarEliminar.addEventListener('click', async () => { if (!productoPendienteEliminar) return; try { await remove(ref(db, 'inventario/' + productoPendienteEliminar.id)); registrarLog(`Eliminó el producto '${productoPendienteEliminar.nombre}'`); const em = document.getElementById('eliminarModal'); if (em) em.classList.add('hidden'); showToast("Producto eliminado"); } catch (error) { showToast("Error al eliminar", "error"); } });

    // ESCUCHAR DISPOSITIVOS AGRUPADOS POR CATEGORÍA
    onValue(ref(db, 'dispositivos_por_categoria'), (snapshot) => { dispositivosPorCategoriaGlobal = snapshot.val() || {}; const catEntrada = document.getElementById('tipoProducto')?.value; actualizarDesplegableDispositivos('nombreSelect', catEntrada); const catTienda = document.getElementById('tiendaTipo')?.value; actualizarDesplegableDispositivos('tiendaNombreSelect', catTienda); const catModal = document.getElementById('modalCategoriaTarget')?.textContent; if (catModal) renderizarListaDispositivosModal(catModal); });

    onValue(ref(db, 'inventario'), (snapshot) => { inventarioGlobal = snapshot.val() || {}; renderizarTablaInventario(); });

    // escucha de 'historial' que normaliza logs y activa filtros
    onValue(ref(db, 'historial'), (snapshot) => {
      const logsContainer = document.getElementById('logsContainer'); if (logsContainer) logsContainer.innerHTML = "";
      const data = snapshot.val();
      if (!data) { actividadLogsGlobal = []; if (logsContainer) logsContainer.innerHTML = `<p class="text-center text-slate-400 py-10 text-xs font-medium">Sin actividad.</p>`; cargarUsuariosActividad(); return; }
      const arr = Object.entries(data).map(([key, val]) => { const tipo = val.tipo || detectarTipoDesdeDetalle(val.detalle || ''); return { id: key, usuario: val.usuario || 'Desconocido', detalle: val.detalle || '', fecha: val.fecha || '', tipo }; }).reverse();
      actividadLogsGlobal = arr;
      // poblar UI y activar filtros
      onActividadLogsUpdated();
    });
}

init();
