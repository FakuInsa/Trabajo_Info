// index.js (Actualización con Miembros Activos y Corrección de Formulario)

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

    // Tarea 4: Cargar estadísticas de Miembros Activos (¡NUEVA!)
    cargarEstadisticasMiembros(); 
});


// --- TAREA 4: Cargar estadísticas de Miembros Activos (ACTUALIZADA) ---
async function cargarEstadisticasMiembros() {
    const contadorActivos = document.getElementById('active-members-count');
    const contadorPorcentaje = document.getElementById('active-members-percent'); // ID del elemento de porcentaje
    
    if (!contadorActivos || !contadorPorcentaje) return;
    
    contadorActivos.textContent = '...'; 
    contadorPorcentaje.textContent = '...'; 

    try {
        const respuesta = await fetch(`${API_BASE_URL}/members`);
        if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);

        const respuestaApi = await respuesta.json();
        if (!respuestaApi.success || !respuestaApi.data) {
            throw new Error(respuestaApi.message || 'La API no devolvió datos válidos');
        }

        const miembros = respuestaApi.data;
        const hoy = new Date();
        
        // Determinar las fechas de corte
        const mesActual = hoy.getMonth();
        const añoActual = hoy.getFullYear();
        let mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
        let añoAnterior = mesActual === 0 ? añoActual - 1 : añoActual;

        // 🚨 LÓGICA DE FILTRADO Y CONTEO
        let activosMesActual = 0;
        let activosMesAnterior = 0;

        miembros.forEach(m => {
            if (m.status && m.status.toLowerCase() === 'active') {
                const fechaRegistro = new Date(m.registration_date);
                const mes = fechaRegistro.getMonth();
                const año = fechaRegistro.getFullYear();

                // 1. Conteo del Mes Actual
                if (mes === mesActual && año === añoActual) {
                    activosMesActual++;
                }

                // 2. Conteo del Mes Anterior
                if (mes === mesAnterior && año === añoAnterior) {
                    activosMesAnterior++;
                }
            }
        });

        // 🚨 CÁLCULO DEL PORCENTAJE
        let porcentaje = 0;
        let textoPorcentaje = '';
        let claseColor = '';
        
        if (activosMesAnterior > 0) {
            porcentaje = ((activosMesActual - activosMesAnterior) / activosMesAnterior) * 100;
        } else if (activosMesActual > 0) {
            // Si antes había 0 y ahora hay > 0, es un aumento de 100%
            porcentaje = 100; 
        }

        // Formato de salida
        if (porcentaje > 0) {
            textoPorcentaje = `+${porcentaje.toFixed(1)}% este mes`;
            claseColor = 'green'; // Puedes definir esta clase en tu CSS
        } else if (porcentaje < 0) {
            textoPorcentaje = `${porcentaje.toFixed(1)}% este mes`;
            claseColor = 'red'; // Puedes definir esta clase en tu CSS
        } else {
            textoPorcentaje = '0% este mes';
            claseColor = 'gray';
        }

        // Actualizar el HTML
        contadorActivos.textContent = activosMesActual.toString();
        contadorPorcentaje.textContent = textoPorcentaje;
        contadorPorcentaje.className = claseColor; // Asignar color (si lo defines en CSS)

    } catch (error) {
        console.error('Error al cargar estadísticas de miembros:', error);
        contadorActivos.textContent = 'N/A';
        contadorPorcentaje.textContent = 'Error'; 
    }
}


// --- TAREA 1: Cargar la tabla de miembros (Miembros Recientes) ---
async function cargarMiembrosRecientes() {
    const tbody = document.querySelector('.members table tbody');
    if (!tbody) return; 

    console.log('Cargando miembros...');
    tbody.innerHTML = '<tr><td colspan="4">Cargando...</td></tr>';

    try {
        const respuesta = await fetch(`${API_BASE_URL}/members`);
        if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);

        const respuestaApi = await respuesta.json();
        if (!respuestaApi.success || !respuestaApi.data) {
            throw new Error(respuestaApi.message || 'La API no devolvió datos válidos');
        }

        const miembros = respuestaApi.data;
        tbody.innerHTML = ''; 

        // Limitar a los 5 miembros más recientes (o la cantidad que desees)
        const miembrosRecientes = miembros.sort((a, b) => 
            new Date(b.registration_date) - new Date(a.registration_date)
        ).slice(0, 5);
        
        miembrosRecientes.forEach(miembro => {
            const fila = document.createElement('tr');
            
            const tipoMembresia = miembro.member_type || 'regular'; 
            
            // Lógica de Estado
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
                <td><span class="status ${claseEstado}">${estadoTexto}</span></td>
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
        document.getElementById('form-crear-miembro').reset(); // Limpiar el formulario al cerrar
        modal.classList.add('hidden'); 
    }

    botonAbrir.addEventListener('click', abrirModal);
    botonCerrarX.addEventListener('click', cerrarModal);
    botonCancelar.addEventListener('click', cerrarModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) cerrarModal();
    });
}


// --- TAREA 3: Conectar el formulario para enviar a la API (CORREGIDA) ---
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
            // Usamos 'birth_date' según el formulario que proporcionaste
            date_of_birth: formData.get('birth_date'), 
            
            // Valores fijos
            member_type: "regular", 
            status: "inactive" // Se asume 'inactive' al crear
        };

        // Limpiar campos opcionales que estén vacíos
        if (!memberData.phone) delete memberData.phone;
        if (!memberData.date_of_birth) delete memberData.date_of_birth;


        try {
            const respuesta = await fetch(`${API_BASE_URL}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(memberData)
            });

            const respuestaApi = await respuesta.json();

            if (!respuesta.ok || !respuestaApi.success) {
                throw new Error(respuestaApi.message || 'Error del servidor');
            }

            // ¡ÉXITO!
            alert('¡Miembro creado con éxito!');
            form.reset(); 
            document.getElementById('modal-crear-miembro').classList.add('hidden');
            
            // 🚨 Recargar ambas funciones después de un éxito
            cargarMiembrosRecientes(); 
            cargarEstadisticasMiembros(); 

        } catch (error) {
            console.error('Error al crear miembro:', error);
            alert(`Error al crear miembro: ${error.message}`);
        }
    });
}