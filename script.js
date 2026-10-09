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

const productosHabituales = [
    "ADOC NEO 3850W", "ADOC BT02 PRO", "TH10B", "ADOC HC01", "SALICRU SPS900ONE",
    "XD5-40D", "XD3-40T", "SRP-350PLUSVK", "NCR CX5", "NCR P1535", "NCR P1532",
    "Seypos 675", "Cajón Seypos", "KC3", "Acepc", "Toshiba", "NCR N3000",
    "Fujitsu 21\"", "Samsung Menuboard", "Meraki MX67", "TPLink MR6400",
    "THUNDERBOOK", "Videograbador Dahua", "Lenovo TB850SF", "Samsung SM-T225",
    "HP EliteBook", "Lenovo V15 G5", "Teclado MK120", "Raton NGS"
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

let db, usuarioActual = localStorage.getItem('stock_user') || '';
let descuentoPendiente = null;
let inventarioGlobal = {};
let cantidadesFila = {};

function init() {
    try {
        const app = initializeApp(firebaseConfig);
        db = getDatabase(app);
    } catch (err) {
        console.error("Error Firebase:", err);
        document.getElementById('loginError').textContent = "Error de conexión con la base de datos.";
    }

    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
        document.getElementById('darkModeIcon').textContent = '☀️';
    }

    // EVENTOS DEL MENÚ Y NAVEGACIÓN
    document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
    document.getElementById('btnLogin').addEventListener('click', iniciarSesion);
    document.getElementById('btnChangeUser').addEventListener('click', cambiarUsuario);
    document.getElementById('btnExport').addEventListener('click', exportarExcel);
    document.getElementById('btnCancelModal').addEventListener('click', cerrarModal);
    document.getElementById('btnConfirmModal').addEventListener('click', confirmarDescuento);
    document.getElementById('searchInput').addEventListener('input', filtrarInventario);
    document.getElementById('filterTipo').addEventListener('change', filtrarInventario);
    document.getElementById('filterUbicacion').addEventListener('change', filtrarInventario);
    document.getElementById('filterEstado').addEventListener('change', filtrarInventario);
    document.getElementById('btnClearFilters').addEventListener('click', limpiarFiltros);
    document.getElementById('btnClearLogs').addEventListener('click', abrirModalActividad);
    document.getElementById('btnCancelarActividad').addEventListener('click', cerrarModalActividad);
    document.getElementById('btnConfirmarActividad').addEventListener('click', confirmarReinicioActividad);

    // BINDING DE PESTAÑAS (CORREGIDO)
    document.getElementById('tabBtnInventario').addEventListener('click', () => cambiarPestana('inventario'));
    document.getElementById('tabBtnNuevo').addEventListener('click', () => cambiarPestana('nuevo'));
    document.getElementById('tabBtnTiendas').addEventListener('click', () => cambiarPestana('tiendas'));
    document.getElementById('tabBtnActividad').addEventListener('click', () => cambiarPestana('actividad'));

    // Desplegable de nombre de producto (Entradas)
    document.getElementById('nombreSelect').addEventListener('change', (e) => {
        const customContainer = document.getElementById('nombreCustomContainer');
        const customInput = document.getElementById('nombreCustom');
        if (e.target.value === 'OTRO') {
            customContainer.classList.remove('hidden');
            customInput.required = true;
        } else {
            customContainer.classList.add('hidden');
            customInput.required = false;
        }
    });

    // Desplegable de nombre de producto (Tiendas)
    document.getElementById('tiendaNombreSelect').addEventListener('change', (e) => {
        const container = document.getElementById('tiendaNombreCustomContainer');
        const input = document.getElementById('tiendaNombreCustom');
        if (e.target.value === 'OTRO') {
            container.classList.remove('hidden');
            input.required = true;
        } else {
            container.classList.add('hidden');
            input.required = false;
        }
    });

    document.getElementById('selectTiendaModulo').addEventListener('change', (e) => {
        cargarEquiposTienda(e.target.value);
    });

    ['nombreUsuario', 'passwordUsuario', 'nombrePersonal'].forEach(id => {
        document.getElementById(id).addEventListener('keypress', (e) => {
            if (e.key === 'Enter') iniciarSesion();
        });
    });

    const inputUser = document.getElementById('nombreUsuario');
    inputUser.addEventListener('input', (e) => {
        const val = e.target.value.trim().toLowerCase();
        const container = document.getElementById('nombrePersonalContainer');
        if (val === 'tecnico') {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
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
    [btnInv, btnNue, btnTie, btnAct].forEach(btn => btn.className = `px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${inactiveClass}`);

    if (pestana === 'inventario') {
        tabInv.classList.remove('hidden');
        btnInv.className = `px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${activeClass}`;
    } else if (pestana === 'nuevo') {
        tabNue.classList.remove('hidden');
        btnNue.className = `px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${activeClass}`;
    } else if (pestana === 'tiendas') {
        tabTie.classList.remove('hidden');
        btnTie.className = `px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${activeClass}`;
    } else if (pestana === 'actividad') {
        tabAct.classList.remove('hidden');
        btnAct.className = `px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${activeClass}`;
    }
}

function toggleDarkMode() {
    const html = document.documentElement;
    const icon = document.getElementById('darkModeIcon');
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        icon.textContent = '🌙';
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        icon.textContent = '☀️';
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    const bgClass = type === 'success' ? 'bg-emerald-600' : (type === 'error' ? 'bg-red-600' : 'bg-slate-800');
    toast.className = `${bgClass} text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold uppercase tracking-wider transition transform translate-y-2 opacity-0 flex items-center gap-2`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.remove('translate-y-2', 'opacity-0'); }, 50);
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function iniciarSesion() {
    const usuario = document.getElementById('nombreUsuario').value.trim();
    const password = document.getElementById('passwordUsuario').value;
    const nombrePersonal = document.getElementById('nombrePersonal').value.trim();
    const errorElement = document.getElementById('loginError');

    if (!usuario || !password) {
        errorElement.textContent = "Por favor, introduce usuario y contraseña.";
        return;
    }

    if (usuario.toLowerCase() === 'tecnico') {
        if (password !== 'papainventario') {
            errorElement.textContent = "Contraseña incorrecta para Técnico.";
            return;
        }
        if (!nombrePersonal) {
            errorElement.textContent = "Por favor, introduce tu nombre personal.";
            return;
        }
        usuarioActual = `Técnico: ${nombrePersonal}`;
    } else {
        usuarioActual = usuario;
    }

    localStorage.setItem('stock_user', usuarioActual);
    errorElement.textContent = "";
    mostrarApp();
}

function cambiarUsuario() {
    localStorage.removeItem('stock_user');
    location.reload();
}

function mostrarApp() {
    document.getElementById('loginContainer').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    document.getElementById('userDisplay').textContent = `👤 ${usuarioActual}`;
    
    // Categorías
    const tipoSelectForm = document.getElementById('tipoProducto');
    tipoSelectForm.innerHTML = '<option value="">Selecciona categoría</option>' +
        categoriasList.map(c => `<option value="${c}">${c}</option>`).join('');

    const filterTipo = document.getElementById('filterTipo');
    filterTipo.innerHTML = '<option value="">Todas las categorías</option>' +
        categoriasList.map(c => `<option value="${c}">${c}</option>`).join('');

    const tiendaTipo = document.getElementById('tiendaTipo');
    tiendaTipo.innerHTML = '<option value="">Categoría</option>' +
        categoriasList.map(c => `<option value="${c}">${c}</option>`).join('');

    // Productos
    const nombreSelect = document.getElementById('nombreSelect');
    nombreSelect.innerHTML = '<option value="">Selecciona un producto...</option>' +
        productosHabituales.map(p => `<option value="${p}">${p}</option>`).join('') +
        '<option value="OTRO">✏️ Otro (Escribir nombre personalizado)</option>';

    const tiendaNombreSelect = document.getElementById('tiendaNombreSelect');
    tiendaNombreSelect.innerHTML = '<option value="">Selecciona dispositivo...</option>' +
        productosHabituales.map(p => `<option value="${p}">${p}</option>`).join('') +
        '<option value="OTRO">✏️ Otro (Escribir personalizado)</option>';

    // Tiendas
    const tiendaSelect = document.getElementById('tiendaDestino');
    tiendaSelect.innerHTML = '<option value="">Selecciona una tienda</option>' +
        tiendas.map(t => `<option value="${t}">${t}</option>`).join('');

    const selectTiendaModulo = document.getElementById('selectTiendaModulo');
    selectTiendaModulo.innerHTML = '<option value="">Selecciona una tienda corporativa...</option>' +
        tiendas.map(t => `<option value="${t}">${t}</option>`).join('');

    iniciarLogica();
}

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
    } catch (e) {
        console.error("Error historial:", e);
    }
}

function abrirModalActividad() {
    document.getElementById('actividadModal').classList.remove('hidden');
    document.getElementById('actividadModal').classList.add('flex');
}

function cerrarModalActividad() {
    document.getElementById('actividadModal').classList.remove('flex');
    document.getElementById('actividadModal').classList.add('hidden');
}

async function confirmarReinicioActividad() {
    if (!db) return;
    try {
        await remove(ref(db, 'historial'));
        cerrarModalActividad();
        showToast("Historial reiniciado");
    } catch (error) {
        showToast("Error al reiniciar historial", "error");
    }
}

function abrirModalDescuento(id, nombreProd, stockActual, cantidad) {
    descuentoPendiente = { id, nombreProd, stockActual, cantidad };
    document.getElementById('modalProductName').textContent = `${nombreProd} (−${cantidad})`;
    document.getElementById('comentarioDescuento').value = '';
    document.getElementById('tiendaDestino').value = '';
    document.getElementById('comentarioModal').classList.remove('hidden');
    document.getElementById('comentarioModal').classList.add('flex');
}

function cerrarModal() {
    document.getElementById('comentarioModal').classList.remove('flex');
    document.getElementById('comentarioModal').classList.add('hidden');
    descuentoPendiente = null;
}

function confirmarDescuento() {
    const comentario = document.getElementById('comentarioDescuento').value.trim();
    const tienda = document.getElementById('tiendaDestino').value.trim();

    if (!comentario || !tienda || !descuentoPendiente) {
        showToast("Completa los datos de salida", "error");
        return;
    }

    const { id, nombreProd, cantidad } = descuentoPendiente;
    const stockActual = Number((inventarioGlobal[id] || {}).stock ?? descuentoPendiente.stockActual);
    const nuevoStock = stockActual - cantidad;

    if (nuevoStock < 0) {
        showToast(`Stock insuficiente (${stockActual})`, "error");
        return;
    }

    try {
        update(ref(db, 'inventario/' + id), { stock: nuevoStock });
        registrarLog(`Salida (-${cantidad}) en '${nombreProd}' [Tienda: ${tienda}]`, comentario);
        delete cantidadesFila[id];
        cerrarModal();
        showToast(`Stock descontado (−${cantidad})`);
    } catch (error) {
        console.error("Error:", error);
    }
}

function limpiarFiltros() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterTipo').value = '';
    document.getElementById('filterUbicacion').value = '';
    document.getElementById('filterEstado').value = '';
    renderizarTablaInventario();
}

function filtrarInventario() {
    renderizarTablaInventario();
}

function renderizarTablaInventario() {
    const tableBody = document.getElementById('inventoryTable');
    const searchText = document.getElementById('searchInput').value.toLowerCase().trim();
    const filterTipo = document.getElementById('filterTipo').value;
    const filterUbicacion = document.getElementById('filterUbicacion').value;
    const filterEstado = document.getElementById('filterEstado').value;

    tableBody.innerHTML = "";
    const ids = Object.keys(inventarioGlobal);

    if (ids.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-10 text-slate-400 font-medium">Sin productos registrados en inventario.</td></tr>`;
        return;
    }

    let totalItems = 0;
    let totalStock = 0;
    let criticalCount = 0;
    let countRendered = 0;

    ids.forEach((id) => {
        const prod = inventarioGlobal[id];
        totalItems++;
        totalStock += Number(prod.stock || 0);
        if (Number(prod.stock || 0) < 5) criticalCount++;

        const coincideTexto = !searchText || prod.nombre.toLowerCase().includes(searchText) || prod.referencia.toLowerCase().includes(searchText);
        const coincideTipo = !filterTipo || prod.tipo === filterTipo;
        const ubicacion = prod.ubicacion || 'Sin indicar';
        const estado = prod.estado || 'Sin indicar';
        const coincideUbicacion = !filterUbicacion || ubicacion === filterUbicacion;
        const coincideEstado = !filterEstado || estado === filterEstado;

        if (!coincideTexto || !coincideTipo || !coincideUbicacion || !coincideEstado) return;

        countRendered++;
        const tipoBadge = prod.tipo ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 border border-slate-200 dark:border-slate-700">${prod.tipo}</span>` : `-`;
        const ubicacionBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${ubicacion === 'Sin indicar' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}">${ubicacion}</span>`;
        const estadoBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${estado === 'Nuevo' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}">${estado}</span>`;
        
        const precioFormateado = prod.precio ? `${parseFloat(prod.precio).toFixed(2)} €` : '0.00 €';
        const fechaFormateada = prod.fechaAdicion || 'No registrada';

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition";
        tr.innerHTML = `
            <td class="py-3 px-3 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">${prod.referencia}</td>
            <td class="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                <div>${prod.nombre}</div>
                ${prod.comentario ? `<div class="text-[10px] text-slate-400 font-normal italic mt-0.5">💬 \${prod.comentario}</div>` : ''}
            </td>
            <td class="py-3 px-3">${tipoBadge}</td>
            <td class="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">${precioFormateado}</td>
            <td class="py-3 px-3 text-center text-[10px] text-slate-500 font-medium">${fechaFormateada}</td>
            <td class="py-3 px-3">${ubicacionBadge}</td>
            <td class="py-3 px-3 text-center">${estadoBadge}</td>
            <td class="py-3 px-3 text-center font-black text-brand-600 dark:text-brand-400 text-base">${prod.stock}</td>
            <td class="py-3 px-3 text-center">
                <div class="flex items-center justify-center gap-1.5">
                    <button onclick="window.ejecutarCambiarStock('${id}', -1)" title="Restar stock" class="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-black shadow transition cursor-pointer">−</button>
                    <input type="number" min="1" value="${cantidadesFila[id] || 1}" oninput="window.guardarCantidad('${id}', this.value)" class="w-12 h-7 px-1 text-center bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold focus:border-brand-500 focus:outline-none">
                    <button onclick="window.ejecutarCambiarStock('${id}', 1)" title="Sumar stock" class="w-7 h-7 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-black shadow transition cursor-pointer">+</button>
                    <button onclick="window.ejecutarEliminar('${id}', '${prod.nombre.replace(/'/g, "\\'")}')" class="h-7 px-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 rounded-lg text-[10px] font-bold border border-slate-200 cursor-pointer">🗑️</button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    if (countRendered === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-10 text-slate-400 font-medium">No hay productos que coincidan con los filtros.</td></tr>`;
    }

    document.getElementById('statTotalItems').textContent = totalItems;
    document.getElementById('statTotalStock').textContent = totalStock;
    document.getElementById('statCritical').textContent = criticalCount;
}

function cargarEquiposTienda(nombreTienda) {
    const tbody = document.getElementById('tablaTiendaBody');
    const titulo = document.getElementById('tiendaTituloTabla');
    
    if (!nombreTienda) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-10 text-slate-400 font-medium">Selecciona una tienda arriba para consultar su equipamiento.</td></tr>`;
        titulo.textContent = "📋 Equipos Instalados en Tienda";
        document.getElementById('statTiendaTotalEquipos').textContent = '0';
        document.getElementById('statTiendaValorTotal').textContent = '0.00 €';
        return;
    }

    titulo.textContent = `📋 Equipos Instalados en ${nombreTienda}`;
    
    const tiendaRef = ref(db, `tiendas/${nombreTienda}/equipos`);
    onValue(tiendaRef, (snapshot) => {
        const equipos = snapshot.val() || {};
        tbody.innerHTML = "";
        
        const ids = Object.keys(equipos);
        if (ids.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-10 text-slate-400 font-medium">No hay dispositivos registrados aún en ${nombreTienda}.</td></tr>`;
            document.getElementById('statTiendaTotalEquipos').textContent = '0';
            document.getElementById('statTiendaValorTotal').textContent = '0.00 €';
            return;
        }

        let totalCant = 0;
        let totalValor = 0;

        ids.forEach(id => {
            const eq = equipos[id];
            const cantidad = Number(eq.cantidad || 1);
            const precio = Number(eq.precio || 0);
            totalCant += cantidad;
            totalValor += (cantidad * precio);

            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition";
            tr.innerHTML = `
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-brand-600">${eq.tipo}</span></td>
                <td class="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    ${eq.nombre}
                    ${eq.notas ? `<div class="text-[10px] text-slate-400 italic font-normal">\${eq.notas}</div>` : ''}
                </td>
                <td class="py-3 px-3 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">${eq.referencia}</td>
                <td class="py-3 px-3 text-center font-bold text-emerald-600">${precio.toFixed(2)} €</td>
                <td class="py-3 px-3 text-center text-[10px] text-slate-500">${eq.fechaInstalacion || '-'}</td>
                <td class="py-3 px-3 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${eq.estado === 'Nuevo' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}">${eq.estado}</span></td>
                <td class="py-3 px-3 text-center font-black text-brand-600">${cantidad}</td>
                <td class="py-3 px-3 text-center">
                    <button onclick="window.eliminarEquipoTienda('${nombreTienda}', '${id}', '${eq.nombre.replace(/'/g, "\\'")}')" class="h-7 px-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 rounded-lg text-[10px] font-bold border border-slate-200 cursor-pointer">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('statTiendaTotalEquipos').textContent = totalCant;
        document.getElementById('statTiendaValorTotal').textContent = `${totalValor.toFixed(2)} €`;
    });
}

function exportarExcel() {
    const ids = Object.keys(inventarioGlobal);
    if (ids.length === 0) {
        showToast("No hay datos para exportar.", "error");
        return;
    }

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

    ids.forEach(id => {
        const p = inventarioGlobal[id];
        htmlTabla += `
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
        `;
    });

    htmlTabla += `</tbody></table></body></html>`;

    const blob = new Blob(["\ufeff" + htmlTabla], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Inventario_PapaJohns_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("Excel descargado");
}

function iniciarLogica() {
    const form = document.getElementById('productForm');
    form.onsubmit = (e) => {
        e.preventDefault();
        
        const tipo = document.getElementById('tipoProducto').value;
        const nombreSel = document.getElementById('nombreSelect').value;
        const nombreCustom = document.getElementById('nombreCustom').value.trim();
        const nombreFinal = nombreSel === 'OTRO' ? nombreCustom : nombreSel;

        const referencia = document.getElementById('ref').value.trim();
        const precio = parseFloat(document.getElementById('precio').value) || 0;
        const stock = parseInt(document.getElementById('stock').value, 10) || 1;
        const ubicacion = document.getElementById('ubicacionProducto').value;
        const estado = document.getElementById('estadoProducto').value;
        const comentario = document.getElementById('comentarioEntrada').value.trim();

        const fechaAdicion = new Date().toLocaleString('es-ES', { 
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
        });

        if (!nombreFinal) {
            showToast("Por favor indica el nombre del producto", "error");
            return;
        }

        try {
            const nuevoProdRef = push(ref(db, 'inventario'));
            set(nuevoProdRef, { 
                referencia, nombre: nombreFinal, tipo, precio, stock, ubicacion, estado, comentario, fechaAdicion 
            });

            registrarLog(`Añadió '${nombreFinal}' [Nº Serie: ${referencia}] - Precio: ${precio.toFixed(2)}€`, comentario);
            form.reset();
            document.getElementById('nombreCustomContainer').classList.add('hidden');
            
            showToast("¡Artículo añadido con éxito!");
            cambiarPestana('inventario');
        } catch (error) {
            showToast("Error al añadir: " + error.message, "error");
        }
    };

    const tiendaForm = document.getElementById('tiendaForm');
    tiendaForm.onsubmit = (e) => {
        e.preventDefault();

        const nombreTienda = document.getElementById('selectTiendaModulo').value;
        if (!nombreTienda) {
            showToast("Selecciona una tienda primero", "error");
            return;
        }

        const tipo = document.getElementById('tiendaTipo').value;
        const nombreSel = document.getElementById('tiendaNombreSelect').value;
        const nombreCustom = document.getElementById('tiendaNombreCustom').value.trim();
        const nombreFinal = nombreSel === 'OTRO' ? nombreCustom : nombreSel;

        const referencia = document.getElementById('tiendaRef').value.trim();
        const precio = parseFloat(document.getElementById('tiendaPrecio').value) || 0;
        const cantidad = parseInt(document.getElementById('tiendaCantidad').value, 10) || 1;
        const estado = document.getElementById('tiendaEstado').value;
        const notas = document.getElementById('tiendaNotas').value.trim();

        const fechaInstalacion = new Date().toLocaleDateString('es-ES', { 
            day: '2-digit', month: '2-digit', year: 'numeric' 
        });

        if (!nombreFinal) {
            showToast("Indica el nombre del dispositivo", "error");
            return;
        }

        try {
            const equipoRef = push(ref(db, `tiendas/${nombreTienda}/equipos`));
            set(equipoRef, {
                tipo, nombre: nombreFinal, referencia, precio, cantidad, estado, notas, fechaInstalacion
            });

            registrarLog(`Asignó equipo '${nombreFinal}' (${cantidad} ud/s) a la tienda ${nombreTienda}`);
            tiendaForm.reset();
            document.getElementById('tiendaNombreCustomContainer').classList.add('hidden');
            showToast(`Dispositivo asignado a ${nombreTienda}`);
        } catch (error) {
            showToast("Error al asignar equipo", "error");
        }
    };

    window.eliminarEquipoTienda = async function(nombreTienda, idEquipo, nombreEquipo) {
        if (!confirm(`¿Deseas eliminar '${nombreEquipo}' de la tienda ${nombreTienda}?`)) return;
        try {
            await remove(ref(db, `tiendas/${nombreTienda}/equipos/${idEquipo}`));
            registrarLog(`Eliminó el equipo '${nombreEquipo}' de la tienda ${nombreTienda}`);
            showToast("Equipo eliminado de la tienda");
        } catch (e) {
            showToast("Error al eliminar equipo", "error");
        }
    };

    window.guardarCantidad = function(id, valor) {
        cantidadesFila[id] = valor;
    };

    window.ejecutarCambiarStock = function(id, signo) {
        const prod = inventarioGlobal[id];
        if (!prod) return;

        const cantidad = parseInt(cantidadesFila[id], 10) || 1;
        const stockActual = Number(prod.stock || 0);

        if (signo < 0) {
            if (cantidad > stockActual) {
                showToast(`Imposible restar ${cantidad}: stock actual es ${stockActual}`, "error");
                return;
            }
            abrirModalDescuento(id, prod.nombre, stockActual, cantidad);
            return;
        }

        const nuevoStock = stockActual + cantidad;
        update(ref(db, 'inventario/' + id), { stock: nuevoStock });
        registrarLog(`Entrada (+${cantidad}) en '${prod.nombre}'. Stock total: ${nuevoStock}`);
        showToast(`Stock actualizado (+${cantidad})`);
    };

    let productoPendienteEliminar = null;

    window.ejecutarEliminar = function(id, nombreProd) {
        productoPendienteEliminar = { id, nombreProd };
        document.getElementById('eliminarModalProducto').textContent = nombreProd;
        document.getElementById('eliminarModal').classList.remove('hidden');
        document.getElementById('eliminarModal').classList.add('flex');
    };

    document.getElementById('btnCancelarEliminar').addEventListener('click', () => {
        document.getElementById('eliminarModal').classList.add('hidden');
        productoPendienteEliminar = null;
    });

    document.getElementById('btnConfirmarEliminar').addEventListener('click', async () => {
        if (!productoPendienteEliminar) return;
        try {
            await remove(ref(db, 'inventario/' + productoPendienteEliminar.id));
            registrarLog(`Eliminó el producto '${productoPendienteEliminar.nombre}'`);
            document.getElementById('eliminarModal').classList.add('hidden');
            showToast("Producto eliminado");
        } catch (error) {
            showToast("Error al eliminar", "error");
        }
    });

    onValue(ref(db, 'inventario'), (snapshot) => {
        inventarioGlobal = snapshot.val() || {};
        renderizarTablaInventario();
    });

    onValue(ref(db, 'historial'), (snapshot) => {
        const logsContainer = document.getElementById('logsContainer');
        logsContainer.innerHTML = "";
        const data = snapshot.val();
        if (!data) {
            logsContainer.innerHTML = `<p class="text-center text-slate-400 py-10 text-xs font-medium">Sin actividad.</p>`;
            return;
        }
        const logsArray = Object.values(data).reverse().slice(0, 25);
        logsArray.forEach((log) => {
            const div = document.createElement('div');
            div.className = "bg-brand-50/50 dark:bg-slate-800/40 p-3.5 rounded-xl border-l-4 border-brand-500 text-xs shadow-sm";
            div.innerHTML = `
                <div class="flex justify-between items-center mb-1">
                    <span class="font-black text-brand-700 dark:text-brand-400 uppercase tracking-wide">${log.usuario}</span>
                    <span class="text-slate-400 text-[10px]">${log.fecha}</span>
                </div>
                <div class="text-slate-700 dark:text-slate-300 font-medium">${log.detalle}</div>
            `;
            logsContainer.appendChild(div);
        });
    });
}

init();
