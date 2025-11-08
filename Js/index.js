// index.js (Versión FINAL Dashboard)

// --- CONFIGURACIÓN ---
const API_BASE_URL = 'http://127.0.0.1:8000';

// --- EJECUCIÓN PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Tarea 1: Cargar la tabla de miembros
    cargarMiembrosRecientes();

    // Tarea 2: Conectar los botones del modal
    setupModalToggles();

    // Tarea 3: Conectar el formulario para enviar a la API
    setupFormSubmitListener();

    // Tarea 4: Cargar estadísticas de Miembros Activos e Ingresos
    cargarEstadisticasDashboard(); 
});


// --- TAREA 4: Cargar estadísticas de Miembros Activos e Ingresos (NUEVA) ---
async function cargarEstadisticasDashboard() {
    const contadorActivos = document.getElementById('active-members-count');
    const contadorIngresos = document.getElementById('monthly-revenue');
    
    if (contadorActivos) contadorActivos.textContent = '...'; 
    if (contadorIngresos) contadorIngresos.textContent = '...'; 

    try {
        // Llamada a Miembros (para activos)
        const resMiembros = await fetch(`${API_BASE_URL}/members`);
        const apiMiembros = await resMiembros.json();
        
        // Llamada a Membresías (para ingresos)
        const resMembresias = await fetch(`${API_BASE_URL}/memberships`);
        const apiMembresias = await resMembresias.json();

        if (apiMiembros.success && apiMiembros.data && contadorActivos) {
            const activos = apiMiembros.data.filter(m => m.status && m.status.toLowerCase() === 'active').length;
            contadorActivos.textContent = activos.toString();
        }

        if (apiMembresias.success && apiMembresias.data && contadorIngresos) {
            const hoy = new Date();
            const mesActual = hoy.getMonth();
            const anioActual = hoy.getFullYear();
            
            let totalIngresosMes = 0;

            apiMembresias.data.forEach(m => {
                // Sumamos si el pago/registro ocurrió en el mes actual
                const fechaPago = new Date(m.start_date || m.created_at); 
                
                if (fechaPago.getMonth() === mesActual && fechaPago.getFullYear() === anioActual) {
                    totalIngresosMes += m.price;
                }
            });

            contadorIngresos.textContent = `$${totalIngresosMes.toFixed(2)}`;
        }

    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        if (contadorActivos) contadorActivos.textContent = 'Error';
        if (contadorIngresos) contadorIngresos.textContent = 'Error';
    }
}


// --- TAREA 1: Cargar la tabla de miembros (Miembros Recientes) ---
async function cargarMiembrosRecientes() {
    const tbody = document.querySelector('#miembros-recientes-tbody');
    if (!tbody) return; 

    tbody.innerHTML = '<tr><td colspan="4">Cargando miembros...</td></tr>';

    try {
        const respuesta = await fetch(`${API_BASE_URL}/members`);
        const respuestaApi = await respuesta.json();
        if (!respuestaApi.success || !respuestaApi.data) throw new Error('No se pudieron cargar miembros');

        const miembros = respuestaApi.data;
        tbody.innerHTML = ''; 

        // Limitar a los 5 miembros más recientes
        const miembrosRecientes = miembros.sort((a, b) => 
            new Date(b.registration_date) - new Date(a.registration_date)
        ).slice(0, 5);
        
        miembrosRecientes.forEach(miembro => {
            const fila = document.createElement('tr');
            
            const tipoMembresia = miembro.member_type || 'regular'; 
            
            // Lógica de Estado (Activo vs. Inactivo)
            let estadoTexto = 'Inactivo';
            let claseEstado = 'expired'; 
            if (miembro.status && miembro.status.toLowerCase() === 'active') {
                estadoTexto = 'Activo';
                claseEstado = 'active';
            }

            const fechaRegistro = miembro.registration_date 
                ? new Date(miembro.registration_date).toLocaleDateString() 
                : 'N/A';

            fila.innerHTML = `
                <td>${miembro.first_name || ''} ${miembro.last_name || ''}</td>
                <td>${tipoMembresia}</td>
                <td><span class="badge ${claseEstado}">${estadoTexto}</span></td>
                <td>${fechaRegistro}</td>
            `;
            
            tbody.appendChild(fila);
        });

    } catch (error) {
        console.error('Error al cargar miembros recientes:', error);
        tbody.innerHTML = `<tr><td colspan="4">Error al cargar datos: ${error.message}</td></tr>`;
    }
}

// --- TAREA 2: Conectar los botones del modal ---
function setupModalToggles() {
    const modal = document.getElementById('modal-crear-miembro');
    const botonAbrir = document.getElementById('btn-abrir-modal');
    const botonCerrarX = document.getElementById('btn-cerrar-modal');
    const botonCancelar = document.getElementById('btn-cancelar-modal');

    if (!modal || !botonAbrir || !botonCerrarX || !botonCancelar) {
        console.error('Error Tarea 2: No se encontraron todos los elementos del modal en el HTML.');
        return;
    }

    function abrirModal() { modal.classList.remove('hidden'); }
    function cerrarModal() { 
        document.getElementById('form-crear-miembro').reset(); 
        modal.classList.add('hidden'); 
    }

    botonAbrir.addEventListener('click', abrirModal);
    botonCerrarX.addEventListener('click', cerrarModal);
    botonCancelar.addEventListener('click', cerrarModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) cerrarModal();
    });
}


// --- TAREA 3: Conectar el formulario para enviar a la API (Crear Miembro) ---
function setupFormSubmitListener() {
    const form = document.getElementById('form-crear-miembro');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        
        const memberData = {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            email: formData.get('email'),
            dni: formData.get('dni'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            date_of_birth: formData.get('date_of_birth'),
            discount_type: formData.get('discount_type'),
            
            // Valores que se envían fijos para el estado inicial
            member_type: formData.get('member_type'), 
            status: "inactive" 
        };

        try {
            const respuesta = await fetch(`${API_BASE_URL}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(memberData)
            });

            const respuestaApi = await respuesta.json();

            if (!respuesta.ok || !respuestaApi.success) {
                throw new Error(respuestaApi.message || 'Error al registrar al miembro.');
            }

            // ÉXITO
            alert('¡Miembro registrado con éxito!');
            form.reset(); 
            document.getElementById('modal-crear-miembro').classList.add('hidden');
            
            // Recargar ambas listas
            cargarMiembrosRecientes(); 
            cargarEstadisticasDashboard(); 

        } catch (error) {
            console.error('Error al crear miembro:', error);
            alert(`❌ Error al registrar: ${error.message}`);
        }
    });
}