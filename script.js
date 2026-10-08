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

const nombresArticulosList = [
    "Terminal POS TPV Principal",
    "Lector de Código de Barras Láser",
    "Impresora Térmica de Tickets EPSON",
    "Router Cisco Enterprise",
    "Switch PoE 24 Puertos Gigabit",
    "Auriculares con Micrófono y Cancelación",
    "Cable UTP Cat 6 Bobina 305m",
    "Teclado y Ratón Inalámbrico Comercial",
    "Monitor LED Full HD 24\"",
    "Cajón Portamonedas Automático RJ11",
    "SAI / UPS Respaldo Eléctrico 1500VA",
    "Tablet Táctil de Gestión de Comandas",
    "Adaptador Corriente Universal 19V",
    "Antena WiFi de Alta Ganancia"
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

function leerCantidad(id) {
    const n = parseInt(cantidadesFila[id], 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
}

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

    const selectNombre = document.getElementById('nombreProductoSelect');
    selectNombre.addEventListener('change', (e) => {
        const manualContainer = document.getElementById('nombreManualContainer');
        const manualInput = document.getElementById('nombreManualInput');
        if (e.target.value === 'OTRO') {
            manualContainer.classList.remove('hidden');
            manualInput.required = true;
        } else {
            manualContainer.classList.add('hidden');
            manualInput.required = false;
            manualInput.value = '';
        }
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
    toast.className = `${bgClass} text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold uppercase tracking-wider transition transform translate-y-2 opacity-0 pointer-events-auto flex items-center gap-2`;
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
    
    const tipoSelectForm = document.getElementById('tipoProducto');
    tipoSelectForm.innerHTML = '<option value="">Selecciona categoría</option>' +
        categoriasList.map(c => `<option value="${c}">${c}</option>`).join('');

    const nombreSelectForm = document.getElementById('nombreProductoSelect');
    nombreSelectForm.innerHTML = '<option value="">Selecciona nombre de artículo</option>' +
        nombresArticulosList.map(n => `<option value="${n}">${n}</option>`).join('') +
        '<option value="OTRO">✏️ Otro (Escribir manual)...</option>';

    const filterTipo = document.getElementById('filterTipo');
    filterTipo.innerHTML = '<option value="">Todas las categorías</option>' +
        categoriasList.map(c => `<option value="${c}">${c}</option>`).join('');

    const tiendaSelect = document.getElementById('tiendaDestino');
    tiendaSelect.innerHTML = '<option value="">Selecciona una tienda</option>' +
        tiendas.map(t => `<option value="${t}">${t}</option>`).join('');

    const ubicacionSelect = document.getElementById('ubicacionProducto');
    ubicacionSelect.innerHTML = '<option value="">Selecciona ubicación</option><option value="ALMACÉN">ALMACÉN</option><option value="ARMARIO">ARMARIO</option>';

    const filterUbicacion = document.getElementById('filterUbicacion');
    filterUbicacion.innerHTML = '<option value="">Todas las ubicaciones</option><option value="ALMACÉN">ALMACÉN</option><option value="ARMARIO">ARMARIO</option>';

    iniciarLogica();
}

function registrarLog(accion, comentario = '') {
    if (!db) return;
    try {
        const logsRef = ref(db, 'historial');
        const nuevoLogRef = push(logsRef);
        let detalle = accion;
        if (comentario) detalle += ` | Motivo: ${comentario}`;
        set(nuevoLogRef, {
            usuario: usuarioActual,
            detalle: detalle,
            fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
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
    const boton = document.getElementById('btnConfirmarActividad');
    boton.disabled = true;
    boton.textContent = 'Vaciando...';
    try {
        const logsRef = ref(db, 'historial');
        await remove(logsRef);
        cerrarModalActividad();
        showToast("Actividad reciente reiniciada con éxito");
    } catch (error) {
        console.error("Error al reiniciar la actividad:", error);
        showToast("Error al reiniciar la actividad", "error");
    } finally {
        boton.disabled = false;
        boton.textContent = 'Sí, vaciar';
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

    if (!comentario) {
        showToast("Indica el motivo del descuento.", "error");
        return;
    }
    if (!tienda) {
        showToast("Selecciona la tienda destino.", "error");
        return;
    }
    if (!descuentoPendiente) return;

    const { id, nombreProd, cantidad } = descuentoPendiente;
    const stockActual = Number((inventarioGlobal[id] || {}).stock ?? descuentoPendiente.stockActual);
    const nuevoStock = stockActual - cantidad;

    if (nuevoStock < 0) {
        showToast(`No hay suficiente stock (quedan ${stockActual}).`, "error");
        return;
    }

    try {
        const prodRef = ref(db, 'inventario/' + id);
        update(prodRef, { stock: nuevoStock });
        registrarLog(`Salida (-${cantidad}) en '${nombreProd}' [Tienda: ${tienda}]. Stock total: ${nuevoStock}`, comentario);
        delete cantidadesFila[id];
        cerrarModal();
        showToast(`Stock descontado correctamente (−${cantidad})`);
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
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-10 text-slate-400 font-medium">Sin productos registrados.</td></tr>`;
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

        const nombreCompletoConComentario = prod.comentario ? `${prod.nombre} (${prod.comentario})` : prod.nombre;
        const coincideTexto = !searchText || nombreCompletoConComentario.toLowerCase().includes(searchText) || prod.referencia.toLowerCase().includes(searchText);
        const coincideTipo = !filterTipo || prod.tipo === filterTipo;
        const ubicacion = prod.ubicacion || 'Sin indicar';
        const estado = prod.estado || 'Sin indicar';
        const coincideUbicacion = !filterUbicacion || ubicacion === filterUbicacion;
        const coincideEstado = !filterEstado || estado === filterEstado;

        if (!coincideTexto || !coincideTipo || !coincideUbicacion || !coincideEstado) return;

        countRendered++;
        const tipoBadge = prod.tipo ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 border border-slate-200 dark:border-slate-700">${prod.tipo}</span>` : `<span class="text-slate-400 text-xs">-</span>`;
        const ubicacionBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${ubicacion === 'Sin indicar' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}">${ubicacion}</span>`;
        const estadoBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${estado === 'Nuevo' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : estado === 'Usado' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}">${estado}</span>`;
        const precioFormatted = Number(prod.precio || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
        const fechaAlta = prod.fechaAlta || '-';

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition";
        tr.innerHTML = `
            <td class="py-2 px-2 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">${prod.referencia}</td>
            <td class="py-2 px-2 font-semibold text-slate-800 dark:text-slate-200">
                <div class="truncate" title="${nombreCompletoConComentario}">${prod.nombre}</div>
                ${prod.comentario ? `<div class="text-[10px] text-slate-400 italic truncate" title="${prod.comentario}">💬 ${prod.comentario}</div>` : ''}
            </td>
            <td class="py-2 px-2">${tipoBadge}</td>
            <td class="py-2 px-2 font-bold text-emerald-600 dark:text-emerald-400">${precioFormatted}</td>
            <td class="py-2 px-2 text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap" title="${fechaAlta}">${fechaAlta}</td>
            <td class="py-2 px-2">${ubicacionBadge}</td>
            <td class="py-2 px-2 text-center">${estadoBadge}</td>
            <td class="py-2 px-2 text-center font-black text-brand-600 dark:text-brand-400 text-base">${prod.stock}</td>
            <td class="py-2 px-2 text-center">
                <div class="flex items-center justify-center gap-1.5 flex-nowrap">
                    <button onclick="window.ejecutarCambiarStock('${id}', -1)" title="Restar cantidad" class="w-8 h-8 shrink-0 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-black shadow transition cursor-pointer">−</button>
                    <input type="number" min="1" step="1" inputmode="numeric" value="${leerCantidad(id)}" oninput="window.guardarCantidad('${id}', this.value)" onfocus="this.select()" title="Cantidad" class="w-12 h-8 shrink-0 px-1 text-center bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold focus:border-brand-500 focus:outline-none transition">
                    <button onclick="window.ejecutarCambiarStock('${id}', 1)" title="Sumar cantidad" class="w-8 h-8 shrink-0 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-black shadow transition cursor-pointer">+</button>
                    <button onclick="window.ejecutarEliminar('${id}', '${prod.nombre.replace(/'/g, "\\'")}')" class="h-8 px-2.5 shrink-0 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 text-slate-500 rounded-lg text-[11px] font-bold transition border border-slate-200 dark:border-slate-700 cursor-pointer whitespace-nowrap" title="Eliminar producto">🗑️</button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    if (countRendered === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-10 text-slate-400 font-medium">No se encontraron productos con esos filtros.</td></tr>`;
    }

    document.getElementById('statTotalItems').textContent = totalItems;
    document.getElementById('statTotalStock').textContent = totalStock;
    document.getElementById('statCritical').textContent = criticalCount;
}

function exportarExcel() {
    const ids = Object.keys(inventarioGlobal);
    if (ids.length === 0) {
        showToast("No hay datos para exportar.", "error");
        return;
    }

    let htmlTabla = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta http-equiv="content-type" content="text/html; charset=UTF-8">
            <style>
                table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
                th { background-color: #0a6f2c; color: #ffffff; font-weight: bold; text-align: center; padding: 12px; border: 1px solid #064e1f; font-size: 13px; }
                td { padding: 10px; border: 1px solid #d1f5e3; font-size: 12px; text-align: left; }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .title { font-size: 16px; font-weight: bold; color: #0a6f2c; margin-bottom: 15px; }
            </style>
        </head>
        <body>
            <div class="title">Reporte de Inventario - Papa Johns</div>
            <table>
                <thead>
                    <tr>
                        <th>Nº de Serie</th>
                        <th>Nombre</th>
                        <th>Comentario</th>
                        <th>Categoría</th>
                        <th>Precio (€)</th>
                        <th>Fecha y Hora Alta</th>
                        <th>Ubicación</th>
                        <th>Estado</th>
                        <th>Cantidad</th>
                    </tr>
                </thead>
                <tbody>
    `;

    ids.forEach(id => {
        const p = inventarioGlobal[id];
        htmlTabla += `
            <tr>
                <td class="bold center">${p.referencia}</td>
                <td>${p.nombre}</td>
                <td>${p.comentario || ''}</td>
                <td>${p.tipo || 'General'}</td>
                <td class="bold">${Number(p.precio || 0).toFixed(2)} €</td>
                <td class="center">${p.fechaAlta || '-'}</td>
                <td>${p.ubicacion || 'Sin indicar'}</td>
                <td>${p.estado || 'Sin indicar'}</td>
                <td class="center bold" style="color: #15803d;">${p.stock}</td>
            </tr>
        `;
    });

    htmlTabla += `
                </tbody>
            </table>
        </body>
        </html>
    `;

    const blob = new Blob(["\ufeff" + htmlTabla], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Inventario_PapaJohns_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("Excel descargado con éxito");
}

function iniciarLogica() {
    const form = document.getElementById('productForm');

    form.onsubmit = (e) => {
        e.preventDefault();
        const tipo = document.getElementById('tipoProducto').value;
        const referencia = document.getElementById('ref').value.trim();
        
        const selectNombreVal = document.getElementById('nombreProductoSelect').value;
        let nombre = selectNombreVal;
        if (selectNombreVal === 'OTRO') {
            nombre = document.getElementById('nombreManualInput').value.trim();
        }

        const comentario = document.getElementById('comentarioProducto').value.trim();
        const precio = parseFloat(document.getElementById('precioProducto').value) || 0;
        const stock = parseInt(document.getElementById('stock').value);
        const ubicacion = document.getElementById('ubicacionProducto').value;
        const estado = document.getElementById('estadoProducto').value;

        if (!nombre) {
            showToast("Indica el nombre del artículo.", "error");
            return;
        }

        const ahora = new Date();
        const fechaAlta = ahora.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
                          ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        try {
            const inventarioRef = ref(db, 'inventario');
            const nuevoProdRef = push(inventarioRef);
            set(nuevoProdRef, { referencia, nombre, comentario, precio, fechaAlta, tipo, stock, ubicacion, estado });
            registrarLog(`Añadió '${nombre}'${comentario ? ` (\${comentario})` : ''} [Nº Serie: ${referencia}] - Precio: ${precio.toFixed(2)}€ con cantidad ${stock}`);
            form.reset();
            document.getElementById('stock').value = "0";
            document.getElementById('precioProducto').value = "";
            document.getElementById('ubicacionProducto').value = "";
            document.getElementById('estadoProducto').value = "";
            document.getElementById('comentarioProducto').value = "";
            document.getElementById('nombreManualContainer').classList.add('hidden');
            showToast("Producto añadido con éxito");
        } catch (error) {
            showToast("Error al añadir producto: " + error.message, "error");
        }
    };

    window.guardarCantidad = function(id, valor) {
        cantidadesFila[id] = valor;
    }

    window.ejecutarCambiarStock = function(id, signo) {
        const prod = inventarioGlobal[id];
        if (!prod) return;

        const nombreProd = prod.nombre;
        const stockActual = Number(prod.stock || 0);
        const cantidad = leerCantidad(id);

        if (signo < 0) {
            if (cantidad > stockActual) {
                showToast(`No puedes restar ${cantidad}: solo quedan ${stockActual}.`, "error");
                return;
            }
            abrirModalDescuento(id, nombreProd, stockActual, cantidad);
            return;
        }

        const nuevoStock = stockActual + cantidad;

        try {
            const prodRef = ref(db, 'inventario/' + id);
            update(prodRef, { stock: nuevoStock });
            registrarLog(`Entrada (+${cantidad}) en '${nombreProd}'. Stock total: ${nuevoStock}`);
            delete cantidadesFila[id];
            showToast(`Stock actualizado (+${cantidad})`);
        } catch (error) {
            console.error("Error:", error);
        }
    }

    let productoPendienteEliminar = null;

    function abrirModalEliminar(id, nombreProd) {
        productoPendienteEliminar = { id, nombreProd };
        document.getElementById('eliminarModalProducto').textContent = nombreProd;
        document.getElementById('eliminarModal').classList.remove('hidden');
        document.getElementById('eliminarModal').classList.add('flex');
    }

    function cerrarModalEliminar() {
        document.getElementById('eliminarModal').classList.remove('flex');
        document.getElementById('eliminarModal').classList.add('hidden');
        productoPendienteEliminar = null;
    }

    document.getElementById('btnCancelarEliminar').addEventListener('click', cerrarModalEliminar);
    document.getElementById('btnConfirmarEliminar').addEventListener('click', async () => {
        if (!productoPendienteEliminar) return;
        const { id, nombreProd } = productoPendienteEliminar;
        try {
            const prodRef = ref(db, 'inventario/' + id);
            await remove(prodRef);
            registrarLog(`Eliminó el producto '${nombreProd}'`);
            cerrarModalEliminar();
            showToast("Producto eliminado");
        } catch (error) {
            console.error("Error:", error);
            showToast("No se pudo eliminar el producto", "error");
        }
    });

    window.ejecutarEliminar = function(id, nombreProd) {
        abrirModalEliminar(id, nombreProd);
    }

    const inventarioRef = ref(db, 'inventario');
    onValue(inventarioRef, (snapshot) => {
        inventarioGlobal = snapshot.val() || {};
        renderizarTablaInventario();
    });

    const logsRef = ref(db, 'historial');
    onValue(logsRef, (snapshot) => {
        const logsContainer = document.getElementById('logsContainer');
        logsContainer.innerHTML = "";
        const data = snapshot.val();
        if (!data) {
            logsContainer.innerHTML = `<p class="text-center text-slate-400 py-10 text-xs font-medium">Sin actividad.</p>`;
            return;
        }
        const logsArray = Object.values(data).reverse().slice(0, 20);
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
