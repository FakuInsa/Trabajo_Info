// js/actividades.js
// Script exclusivo para la página actividades.html

// --- CONFIGURACIÓN ---
const API_BASE_URL = 'http://127.0.0.1:8000';

// --- EJECUCIÓN PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Tarea 1: Cargar la lista de actividades (GET /activities)
    cargarActividades();

    // Tarea 2: Conectar botones del modal CREAR
    setupCrearActividadModalToggles();

    // Tarea 3: Conectar el formulario de CREACIÓN (POST /activities)
    setupCrearActividadFormSubmitListener();

    // Tarea 4: Conectar botones del modal EDITAR
    setupEditarActividadModalToggles();

    // Tarea 5: Conectar el formulario de EDICIÓN (PUT /activities/{id})
    setupEditarActividadFormSubmitListener();

    // Tarea 6: Configurar listeners para botones de EDITAR y ELIMINAR (Event Delegation)
    setupContenedorListeners();

    // Tarea 7: Conectar botón de Imprimir
    setupPrintButton();
});


// --- TAREA 1: Cargar la lista de actividades (GET /activities) ---
async function cargarActividades() {
    const contenedor = document.getElementById('actividades-contenedor');
    if (!contenedor) return; 

    contenedor.innerHTML = '<p>Cargando actividades...</p>';

    try {
        // Asumimos el endpoint /activities basado en tu /schedules
        const respuesta = await fetch(`${API_BASE_URL}/activities`);
        if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);

        const respuestaApi = await respuesta.json();
        if (!respuestaApi.success || !respuestaApi.data) {
            throw new Error(respuestaApi.message || 'La API no devolvió datos válidos');
        }

        const actividades = respuestaApi.data;
        contenedor.innerHTML = ''; 

        if (actividades.length === 0) {
            contenedor.innerHTML = '<p>No hay actividades registradas. ¡Crea una!</p>';
            return;
        }

        actividades.forEach(actividad => {
            const intensidad = (actividad.intensity_level || 'N/A').charAt(0).toUpperCase() + (actividad.intensity_level || 'N/A').slice(1);
            
            const tarjeta = document.createElement('div');
            tarjeta.className = 'class-card'; // Reutilizamos el estilo de 'clases.html'
            tarjeta.innerHTML = `
                <h3>${actividad.name || 'Actividad Sin Nombre'}</h3>
                <p>${actividad.description || 'Esta actividad no tiene descripción.'}</p>
                <p><strong>Intensidad:</strong> ${intensidad}</p>
                <div class="actions">
                    <button class="btn btn-edit-actividad" 
                            data-id="${actividad.id}"
                            data-name="${actividad.name}"
                            data-description="${actividad.description || ''}"
                            data-intensity="${actividad.intensity_level || 'medium'}">
                        Editar
                    </button>
                    <button class="btn btn-delete-actividad" data-id="${actividad.id}">
                        Eliminar
                    </button>
                </div>
            `;
            
            contenedor.appendChild(tarjeta);
        });

    } catch (error) {
        console.error('Error al cargar actividades:', error);
        contenedor.innerHTML = `<p class="error">Error al cargar actividades: ${error.message}</p>`;
    }
}


// --- TAREA 2: Lógica para mostrar/ocultar el modal CREAR Actividad ---
function setupCrearActividadModalToggles() {
    const modal = document.getElementById('modal-crear-actividad');
    const botonAbrir = document.getElementById('btn-abrir-modal-crear-actividad');
    const botonCerrarX = document.getElementById('btn-cerrar-modal-actividad');
    const botonCancelar = document.getElementById('btn-cancelar-modal-actividad');

    if (!modal || !botonAbrir || !botonCerrarX || !botonCancelar) return;

    function abrirModal() { modal.classList.remove('hidden'); }
    function cerrarModal() { 
        document.getElementById('form-crear-actividad').reset(); 
        modal.classList.add('hidden'); 
    }

    botonAbrir.addEventListener('click', abrirModal);
    botonCerrarX.addEventListener('click', cerrarModal);
    botonCancelar.addEventListener('click', cerrarModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) cerrarModal();
    });
}


// --- TAREA 3: Conectar el formulario de CREACIÓN (POST /activities) ---
function setupCrearActividadFormSubmitListener() {
    const form = document.getElementById('form-crear-actividad');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        
        const activityData = {
            name: formData.get('name'),
            description: formData.get('description'),
            intensity_level: formData.get('intensity_level')
        };
        
        if (!activityData.name) {
            alert('Por favor, ingresa un nombre para la actividad.');
            return;
        }

        try {
            const respuesta = await fetch(`${API_BASE_URL}/activities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(activityData)
            });

            const respuestaApi = await respuesta.json();

            if (!respuesta.ok || !respuestaApi.success) {
                throw new Error(respuestaApi.message || 'Error al crear la actividad.');
            }

            alert('✅ ¡Actividad creada con éxito!');
            document.getElementById('modal-crear-actividad').classList.add('hidden');
            form.reset();
            cargarActividades(); // Recargar la lista

        } catch (error) {
            console.error('Error al crear actividad:', error);
            alert(`❌ Error al crear la actividad: ${error.message}`);
        }
    });
}

// --- TAREA 4: Lógica para mostrar/ocultar el modal EDITAR Actividad ---
function setupEditarActividadModalToggles() {
    const modal = document.getElementById('modal-editar-actividad');
    const botonCerrarX = document.getElementById('btn-cerrar-modal-editar');
    const botonCancelar = document.getElementById('btn-cancelar-modal-editar');

    if (!modal || !botonCerrarX || !botonCancelar) return;

    function cerrarModal() { 
        document.getElementById('form-editar-actividad').reset();
        modal.classList.add('hidden'); 
    }

    botonCerrarX.addEventListener('click', cerrarModal);
    botonCancelar.addEventListener('click', cerrarModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) cerrarModal();
    });
}

// --- TAREA 5: Conectar el formulario de EDICIÓN (PUT /activities/{id}) ---
function setupEditarActividadFormSubmitListener() {
    const form = document.getElementById('form-editar-actividad');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const activityId = formData.get('id');

        const activityData = {
            name: formData.get('name'),
            description: formData.get('description'),
            intensity_level: formData.get('intensity_level')
        };

        try {
            const respuesta = await fetch(`${API_BASE_URL}/activities/${activityId}`, {
                method: 'PUT', // O 'PATCH' dependiendo de tu API
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(activityData)
            });

            const respuestaApi = await respuesta.json();

            if (!respuesta.ok || !respuestaApi.success) {
                throw new Error(respuestaApi.message || 'Error al actualizar la actividad.');
            }

            alert('✅ ¡Actividad actualizada con éxito!');
            document.getElementById('modal-editar-actividad').classList.add('hidden');
            form.reset();
            cargarActividades(); // Recargar la lista

        } catch (error) {
            console.error('Error al actualizar actividad:', error);
            alert(`❌ Error al actualizar la actividad: ${error.message}`);
        }
    });
}


// --- TAREA 6: Listeners para EDITAR (Modificar) y ELIMINAR ---
function setupContenedorListeners() {
    const contenedor = document.getElementById('actividades-contenedor');
    if (!contenedor) return;

    contenedor.addEventListener('click', (event) => {
        const target = event.target;

        // Clic en botón EDITAR
        if (target.classList.contains('btn-edit-actividad')) {
            handleEditClick(target.dataset);
        }

        // Clic en botón ELIMINAR
        if (target.classList.contains('btn-delete-actividad')) {
            handleDeleteClick(target.dataset.id);
        }
    });
}

/**
 * Muestra el modal de edición y carga los datos de la actividad.
 */
function handleEditClick(data) {
    // Rellenar el formulario de edición
    document.getElementById('edit-activity-id').value = data.id;
    document.getElementById('edit-input-nombre').value = data.name;
    document.getElementById('edit-input-descripcion').value = data.description;
    document.getElementById('edit-input-intensidad').value = data.intensity;

    // Mostrar el modal
    document.getElementById('modal-editar-actividad').classList.remove('hidden');
}

/**
 * Pide confirmación y envía la petición DELETE.
 */
async function handleDeleteClick(activityId) {
    if (!confirm(`¿Estás seguro de que deseas eliminar la actividad con ID ${activityId}?`)) {
        return;
    }

    try {
        const respuesta = await fetch(`${API_BASE_URL}/activities/${activityId}`, {
            method: 'DELETE'
        });

        const respuestaApi = await respuesta.json();

        if (!respuesta.ok || !respuestaApi.success) {
            throw new Error(respuestaApi.message || 'Error al eliminar la actividad.');
        }

        alert('✅ ¡Actividad eliminada con éxito!');
        cargarActividades(); // Recargar la lista

    } catch (error) {
        console.error('Error al eliminar actividad:', error);
        alert(`❌ Error al eliminar la actividad: ${error.message}`);
    }
}


// --- TAREA 7: Conectar botón de Imprimir ---
function setupPrintButton() {
    const boton = document.getElementById('btn-imprimir-actividades');
    if (boton) {
        boton.addEventListener('click', () => {
            // Abre el diálogo de impresión del navegador
            window.print();
        });
    }
}