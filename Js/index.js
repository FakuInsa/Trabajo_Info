// script.js (Versión Final - Con campos extra)

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
});


// --- TAREA 1: Cargar la tabla ---
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

        miembros.forEach(miembro => {
            const fila = document.createElement('tr');
            
            const nombreCompleto = `${miembro.first_name || ''} ${miembro.last_name || ''}`;
            const tipoMembresia = miembro.membership_type || 'N/A';
            const estado = miembro.status || 'Activo';
            const fechaRegistro = miembro.registration_date 
                ? new Date(miembro.registration_date).toLocaleDateString() 
                : 'N/A';

            let claseEstado = '';
            if (estado.toLowerCase() === 'activo') claseEstado = 'active';
            else if (estado.toLowerCase() === 'inactivo') claseEstado = 'expired';
            else claseEstado = 'pending';

            fila.innerHTML = `
                <td>${nombreCompleto}</td>
                <td>${tipoMembresia}</td>
                <td><span class="badge ${claseEstado}">${estado}</span></td>
                <td>${fechaRegistro}</td>
            `;
            tbody.appendChild(fila);
        });

        if (miembros.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">No se encontraron miembros.</td></tr>';
        }
    } catch (error) {
        console.error('Error al cargar miembros:', error);
        tbody.innerHTML = `<tr><td colspan="4" class="error">Error al cargar miembros: ${error.message}</td></tr>`;
    }
}


// --- TAREA 2: Lógica para mostrar/ocultar el modal ---
function setupModalToggles() {
    const modal = document.getElementById('modal-crear-miembro');
    const botonAbrir = document.getElementById('btn-abrir-modal');
    const botonCerrarX = document.getElementById('btn-cerrar-modal');
    const botonCancelar = document.getElementById('btn-cancelar-modal');

    if (!modal || !botonAbrir || !botonCerrarX || !botonCancelar) {
        console.error('¡Error! No se encontraron todos los elementos del modal en el HTML.');
        return;
    }

    function abrirModal() {
        modal.classList.remove('hidden');
    }

    function cerrarModal() {
        modal.classList.add('hidden');
    }

    botonAbrir.addEventListener('click', abrirModal);
    botonCerrarX.addEventListener('click', cerrarModal);
    botonCancelar.addEventListener('click', cerrarModal);

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            cerrarModal();
        }
    });
}


// --- TAREA 3: Conectar el formulario a la API ---
function setupFormSubmitListener() {
    const form = document.getElementById('form-crear-miembro');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        
        event.preventDefault();

        const formData = new FormData(form);
        
        // Objeto con todos los campos (incluidos los nuevos)
        const memberData = {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            email: formData.get('email'),
            dni: formData.get('dni'),
            phone: formData.get('phone'),
            birth_date: formData.get('birth_date')
        };

        // Limpiar campos opcionales que estén vacíos
        if (!memberData.phone) delete memberData.phone;
        if (!memberData.birth_date) delete memberData.birth_date;

        console.log('Enviando datos a la API:', memberData);

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
            
            form.reset(); 
            document.getElementById('modal-crear-miembro').classList.add('hidden');
            cargarMiembrosRecientes(); 

        } catch (error) {
            console.error('Error al crear miembro:', error);
            
        }
    });
}