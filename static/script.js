let todasLasActividades = [];

// Función para remover acentos y tildes
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
        document.getElementById('tabla-vigentes').innerHTML = '<tr><td colspan="5" style="color:red; font-weight:bold; text-align:center;">Error al conectar con la base de datos.</td></tr>';
    }
};

// Función auxiliar para convertir texto "DD-MM-YYYY" a Objeto Date de JS para cálculos
function parsearFecha(fechaStr) {
    if (!fechaStr) return null;
    const partes = fechaStr.split('-');
    return new Date(partes[2], partes[1] - 1, partes[0]);
}

function renderizarTablas() {
    const tablaVigentes = document.getElementById('tabla-vigentes');
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    
    // 1. FILTRADO Y ORDENAMIENTO PARA "VIGENTES HOY"
    const vigentes = todasLasActividades.filter(a => a.Estado === 'Vigente');
    
    vigentes.forEach(a => {
        const fechaTermino = parsearFecha(a.TERMINO);
        if (fechaTermino) {
            const difTiempo = fechaTermino.getTime() - hoy.getTime();
            a.diasRestantes = Math.ceil(difTiempo / (1000 * 60 * 60 * 24));
        } else {
            a.diasRestantes = 999; // Procesos sin fecha de término fija
        }
    });

    // Ordenar: Los procesos que vencen más rápido suben al principio
    vigentes.sort((a, b) => a.diasRestantes - b.diasRestantes);
    
    if(vigentes.length === 0) {
        tablaVigentes.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#7f8c8d; padding: 20px;">No hay actividades académicas agendadas para el día de hoy.</td></tr>';
    } else {
        tablaVigentes.innerHTML = vigentes.map(a => {
            // Semáforo de Urgencia en base a días restantes reales
            let estiloCelda = '';
            let textoDias = '';

            if (a.diasRestantes === 999) {
                estiloCelda = 'background-color: #f4f6f7; color: #7f8c8d; font-weight: bold; text-align: center;';
                textoDias = 'Continuo';
            } else if (a.diasRestantes <= 3) {
                // 🔴 Alerta Crítica: 3 días o menos
                estiloCelda = 'background-color: #f9e79f; color: #b7950b; font-weight: bold; text-align: center; box-shadow: inset 4px 0 0 #cb4335;';
                textoDias = `¡Faltan ${a.diasRestantes} días!`;
            } else if (a.diasRestantes <= 7) {
                // 🟡 Alerta Intermedia: de 4 a 7 días
                estiloCelda = 'background-color: #fef9e7; color: #b7950b; font-weight: bold; text-align: center; box-shadow: inset 4px 0 0 #f39c12;';
                textoDias = `Faltan ${a.diasRestantes} días`;
            } else {
                // 🟢 Proceso holgado: más de un vado
                estiloCelda = 'background-color: #e8f8f5; color: #117a65; font-weight: normal; text-align: center;';
                textoDias = `${a.diasRestantes} días`;
            }

            return `
                <tr>
                    <td style="${estiloCelda}">${textoDias}</td>
                    <td>${a.INICIO}</td>
                    <td>${a.TERMINO || '-'}</td>
                    <td class="actividad-cell"><strong>${a.ACTIVIDAD}</strong></td>
                    <td>${a.AGENTES}</td>
                </tr>
            `;
        }).join('');
    }

    // 2. RENDERIZAR TABLA PRÓXIMOS (Top 15 futuros con cuenta regresiva)
    const tablaProximos = document.getElementById('tabla-proximos');
    const proximos = todasLasActividades.filter(a => a.Estado === 'Próximo').slice(0, 15);
    
    proximos.forEach(a => {
        const fechaInicio = parsearFecha(a.INICIO);
        if (fechaInicio) {
            const difTiempo = fechaInicio.getTime() - hoy.getTime();
            a.diasParaInicio = Math.ceil(difTiempo / (1000 * 60 * 60 * 24));
        } else {
            a.diasParaInicio = 999;
        }
    });

    if(proximos.length === 0) {
        tablaProximos.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">No hay eventos futuros en el calendario.</td></tr>';
    } else {
        tablaProximos.innerHTML = proximos.map(a => {
            const textoInicio = a.diasParaInicio === 1 ? 'Mañana' : `En ${a.diasParaInicio} días`;
            return `
                <tr>
                    <td style="background-color: #ebf5fb; color: #2e86c1; font-weight: bold; text-align: center;">${textoInicio}</td>
                    <td>${a.INICIO}</td>
                    <td>${a.TERMINO || '-'}</td>
                    <td class="actividad-cell"><strong>${a.ACTIVIDAD}</strong></td>
                    <td>${a.AGENTES}</td>
                </tr>
            `;
        }).join('');
    }
}

// Filtro para el Buscador Dinámico
function filtrarActividades() {
    const textoUsuario = limpiarTildes(document.getElementById('input-buscar').value);
    const tablaBusqueda = document.getElementById('tabla-busqueda');
    
    const mostrarProximo = document.getElementById('chk-proximo').checked;
    const mostrarPasado = document.getElementById('chk-pasado').checked;
    
    if (textoUsuario.length < 2) {
        tablaBusqueda.innerHTML = '<tr><td colspan="5" style="padding: 15px;">Ingresa al menos 2 letras para iniciar la consulta inteligente...</td></tr>';
        return;
    }

    const filtradas = todasLasActividades.filter(a => {
        const actividadLimpia = limpiarTildes(a.ACTIVIDAD);
        const agentesLimpios = limpiarTildes(a.AGENTES);
        const coincideTexto = actividadLimpia.includes(textoUsuario) || agentesLimpios.includes(textoUsuario);
        
        if (!coincideTexto) return false;
        if (a.Estado === 'Pasado' && !mostrarPasado) return false;
        if ((a.Estado === 'Próximo' || a.Estado === 'Vigente') && !mostrarProximo) return false;
        
        return true;
    });

    if(filtradas.length === 0) {
        tablaBusqueda.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#7f8c8d; padding: 20px;">No se encontraron coincidencias con los filtros activos.</td></tr>';
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

// Control de pestañas
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    }
}