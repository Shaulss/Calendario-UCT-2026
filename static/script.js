let todasLasActividades = [];

// Función Front-End Avanzada: Remueve acentos de forma nativa para cualquier navegador
function limpiarTildes(texto) {
    return texto ? texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
}

// Al cargar el DOM, consumimos los datos del servidor
window.onload = async function() {
    try {
        let response = await fetch('/api/actividades');
        todasLasActividades = await response.json();
        renderizarTablas();
    } catch (error) {
        console.error("Error al obtener el feed del servidor:", error);
        document.getElementById('tabla-vigentes').innerHTML = '<tr><td colspan="4" style="color:red; font-weight:bold; text-align:center;">Error al conectar con la base de datos.</td></tr>';
    }
};

function renderizarTablas() {
    // 1. Renderizar Tabla de Actividades Vigentes
    const tablaVigentes = document.getElementById('tabla-vigentes');
    const vigentes = todasLasActividades.filter(a => a.Estado === 'Vigente');
    
    if(vigentes.length === 0) {
        tablaVigentes.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#7f8c8d; padding: 20px;">No hay actividades académicas agendadas para el día de hoy.</td></tr>';
    } else {
        tablaVigentes.innerHTML = vigentes.map(a => `
            <tr>
                <td>${a.INICIO}</td>
                <td>${a.TERMINO || '-'}</td>
                <td class="actividad-cell"><strong>${a.ACTIVIDAD}</strong></td>
                <td>${a.AGENTES}</td>
            </tr>
        `).join('');
    }

    // 2. Renderizar Tabla de Próximos Eventos (Top 15 futuros)
    const tablaProximos = document.getElementById('tabla-proximos');
    const proximos = todasLasActividades.filter(a => a.Estado === 'Próximo').slice(0, 15);
    
    if(proximos.length === 0) {
        tablaProximos.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">No hay eventos futuros en el calendario.</td></tr>';
    } else {
        tablaProximos.innerHTML = proximos.map(a => `
            <tr>
                <td>${a.INICIO}</td>
                <td>${a.TERMINO || '-'}</td>
                <td class="actividad-cell"><strong>${a.ACTIVIDAD}</strong></td>
                <td>${a.AGENTES}</td>
            </tr>
        `).join('');
    }
}

// Filtro inteligente e insensible a acentos solicitado por la jefatura
function filtrarActividades() {
    const textoUsuario = limpiarTildes(document.getElementById('input-buscar').value);
    const tablaBusqueda = document.getElementById('tabla-busqueda');
    
    if (textoUsuario.length < 2) {
        tablaBusqueda.innerHTML = '<tr><td colspan="5" style="padding: 15px;">Escribe al menos 2 letras...</td></tr>';
        return;
    }

    const filtradas = todasLasActividades.filter(a => {
        const actividadLimpia = limpiarTildes(a.ACTIVIDAD);
        const agentesLimpios = limpiarTildes(a.AGENTES);
        return actividadLimpia.includes(textoUsuario) || agentesLimpios.includes(textoUsuario);
    });

    if(filtradas.length === 0) {
        tablaBusqueda.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#7f8c8d; padding: 20px;">No se encontraron coincidencias.</td></tr>';
        return;
    }

    tablaBusqueda.innerHTML = filtradas.map(a => `
        <tr>
            <td><span style="color: ${a.Estado === 'Pasado' ? '#7f8c8d' : '#27ae60'}; font-weight: bold;">${a.Estado}</span></td>
            <td>${a.INICIO}</td>
            <td>${a.TERMINO || '-'}</td>
            <td class="actividad-cell">${a.ACTIVIDAD}</td>
            <td>${a.AGENTES}</td>
        </tr>
    `).join('');
}

// Control de navegación interactiva entre pestañas
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    }
}
