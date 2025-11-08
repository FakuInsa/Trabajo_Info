// js/reportes.js
// Script exclusivo para la página reportes.html

// --- CONFIGURACIÓN ---
const API_BASE_URL = 'http://127.0.0.1:8000';

// --- EJECUCIÓN PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Tareas de Formularios (las que ya teníamos)
    setupIncomeReportListener();
    setupAttendanceReportListener();

    // Tareas de Tarjetas de Estadísticas (¡NUEVAS!)
    cargarEstadisticasIngresos();
    cargarEstadisticasNuevosMiembros();
});

// --- TAREA NUEVA: Cargar Tarjeta "Ingresos del Mes" ---
async function cargarEstadisticasIngresos() {
    const elemento = document.getElementById('report-ingresos-mes');
    if (!elemento) return;
    elemento.textContent = '...';

    try {
        const respuesta = await fetch(`${API_BASE_URL}/memberships`);
        const respuestaApi = await respuesta.json();
        if (!respuestaApi.success || !respuestaApi.data) throw new Error('No se pudieron cargar membresías');

        const membresias = respuestaApi.data;
        const hoy = new Date();
        const mesActual = hoy.getMonth();
        const anioActual = hoy.getFullYear();
        
        let totalMes = 0;

        membresias.forEach(m => {
            // Asumimos que la fecha de pago es la 'start_date'
            const fechaPago = new Date(m.start_date); 
            
            if (fechaPago.getMonth() === mesActual && fechaPago.getFullYear() === anioActual) {
                totalMes += m.price;
            }
        });

        elemento.textContent = `$${totalMes.toFixed(2)}`;
        
    } catch (error) {
        console.error('Error cargando ingresos:', error);
        elemento.textContent = 'Error';
    }
}

// --- TAREA NUEVA: Cargar Tarjeta "Nuevos Miembros" ---
async function cargarEstadisticasNuevosMiembros() {
    const elemento = document.getElementById('report-nuevos-miembros');
    if (!elemento) return;
    elemento.textContent = '...';

    try {
        const respuesta = await fetch(`${API_BASE_URL}/members`);
        const respuestaApi = await respuesta.json();
        if (!respuestaApi.success || !respuestaApi.data) throw new Error('No se pudieron cargar miembros');

        const miembros = respuestaApi.data;
        const hoy = new Date();
        const mesActual = hoy.getMonth();
        const anioActual = hoy.getFullYear();
        
        let nuevosMiembrosMes = 0;

        miembros.forEach(m => {
            // Usamos la fecha de registro
            const fechaRegistro = new Date(m.registration_date); 
            
            if (fechaRegistro.getMonth() === mesActual && fechaRegistro.getFullYear() === anioActual) {
                nuevosMiembrosMes++;
            }
        });

        elemento.textContent = nuevosMiembrosMes.toString();
        
    } catch (error) {
        console.error('Error cargando nuevos miembros:', error);
        elemento.textContent = 'Error';
    }
}


// --- TAREA (Existente): Conectar formulario de Ingresos (GET /reports/income) ---
function setupIncomeReportListener() {
    const form = document.getElementById('income-report-form');
    const resultsTbody = document.getElementById('income-report-results');
    if (!form || !resultsTbody) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        resultsTbody.innerHTML = '<tr><td colspan="4">Generando reporte...</td></tr>';
        
        const formData = new FormData(form);
        const startDate = formData.get('start_date');
        const endDate = formData.get('end_date');
        const memberType = formData.get('membership_type');

        const params = new URLSearchParams();
        params.append('start_date', startDate);
        params.append('end_date', endDate);
        if (memberType) {
            params.append('membership_type', memberType);
        }

        try {
            const respuesta = await fetch(`${API_BASE_URL}/reports/income?${params.toString()}`);
            const respuestaApi = await respuesta.json();

            if (!respuesta.ok || !respuestaApi.success) {
                throw new Error(respuestaApi.message || 'Error al generar el reporte');
            }
            
            renderIncomeReport(respuestaApi.data, resultsTbody);

        } catch (error) {
            console.error('Error en reporte de ingresos:', error);
            resultsTbody.innerHTML = `<tr><td colspan="4" class="error">Error: ${error.message}</td></tr>`;
        }
    });
}

// --- TAREA (Existente): Conectar formulario de Asistencia (GET /reports/attendance) ---
function setupAttendanceReportListener() {
    const form = document.getElementById('attendance-report-form');
    const resultsTbody = document.getElementById('attendance-report-results');
    if (!form || !resultsTbody) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        resultsTbody.innerHTML = '<tr><td colspan="4">Generando reporte...</td></tr>';
        
        const formData = new FormData(form);
        const startDate = formData.get('start_date');
        const endDate = formData.get('end_date');
        const memberId = formData.get('member_id');

        const params = new URLSearchParams();
        params.append('start_date', startDate);
        params.append('end_date', endDate);
        if (memberId) {
            params.append('member_id', memberId);
        }

        try {
            const respuesta = await fetch(`${API_BASE_URL}/reports/attendance?${params.toString()}`);
            const respuestaApi = await respuesta.json();

            if (!respuesta.ok || !respuestaApi.success) {
                throw new Error(respuestaApi.message || 'Error al generar el reporte');
            }
            
            renderAttendanceReport(respuestaApi.data, resultsTbody);

        } catch (error) {
            console.error('Error en reporte de asistencia:', error);
            resultsTbody.innerHTML = `<tr><td colspan="4" class="error">Error: ${error.message}</td></tr>`;
        }
    });
}


// --- HELPER (Existente): Renderizar tabla de Ingresos ---
function renderIncomeReport(data, tbody) {
    tbody.innerHTML = '';
    const fila = document.createElement('tr');
    fila.innerHTML = `
        <td>${data.total_memberships || 0}</td>
        <td>$${(data.total_revenue || 0).toFixed(2)}</td>
        <td>${data.new_memberships || 0}</td>
        <td>${data.renewals || 0}</td>
    `;
    tbody.appendChild(fila);
}

// --- HELPER (Existente): Renderizar tabla de Asistencia ---
function renderAttendanceReport(data, tbody) {
    tbody.innerHTML = '';
    const fila = document.createElement('tr');
    fila.innerHTML = `
        <td>${data.total_attendance || 0}</td>
        <td>${data.unique_members || 0}</td>
        <td>${data.peak_time || 'N/A'}</td>
        <td>${data.busiest_class || 'N/A'}</td>
    `;
    tbody.appendChild(fila);
}