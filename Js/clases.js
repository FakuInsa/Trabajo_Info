// js/clases.js
// Script exclusivo para la página clases.html (Conexión REAL)

// --- CONFIGURACIÓN ---
const API_BASE_URL = 'http://127.0.0.1:8000';

// --- EJECUCIÓN PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Tarea 1: Cargar la lista de horarios de clase
    cargarHorariosClase();

    // Tarea 2: Conectar botones del modal CREAR
    setupCrearClaseModalToggles();

    // Tarea 3: Conectar el formulario de creación (POST)
    setupCrearClaseFormSubmitListener();

    // --- NUEVAS TAREAS ---

    // Tarea 4: Conectar botones del modal EDITAR
    setupEditarClaseModalToggles();

    // Tarea 5: Conectar el formulario de EDICIÓN (PUT)
    setupEditarClaseFormSubmitListener();

    // Tarea 6: Configurar listeners para botones de EDITAR y ELIMINAR (Event Delegation)
    setupContenedorListeners();
});


// --- TAREA 1: Cargar la lista de horarios de clase (GET /schedules) ---
async function cargarHorariosClase() {
    const contenedor = document.getElementById('clases-contenedor');
    if (!contenedor) return; 

    contenedor.innerHTML = '<p>Cargando horarios...</p>';

    try {
        const respuesta = await fetch(`${API_BASE_URL}/schedules`);
        if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);

        const respuestaApi = await respuesta.json();
        if (!respuestaApi.success || !respuestaApi.data) {
            throw new Error(respuestaApi.message || 'La API no devolvió datos válidos');
        }

        const horarios = respuestaApi.data;
        contenedor.innerHTML = ''; 

        if (horarios.length === 0) {
            contenedor.innerHTML = '<p>No hay horarios de clase programados.</p>';
            return;
        }

        horarios.forEach(horario => {
            const estado = horario.status || 'active';
            const claseEstado = estado.toLowerCase() === 'full' ? 'full' : 'available';
            const claseColor = estado.toLowerCase() === 'full' ? 'red' : 'blue';
            
            const ocupacion = horario.current_enrollment || 0; 
            const capacidadMax = horario.max_capacity || 20;
            const porcentaje = (ocupacion / capacidadMax) * 100;
            
            const dia = (horario.day_of_week || 'N/A').charAt(0).toUpperCase() + (horario.day_of_week || 'N/A').slice(1);

            // (Datos que faltan en la API /schedules)
            const nombreActividad = `Actividad ID: ${horario.activity_id}`;
            
            // --- CAMBIO: Lógica para mostrar nombre de instructor ---
            const nombreInstructor = horario.instructor_id 
                ? `Trainer ID: ${horario.instructor_id}` 
                : "Sin asignar";
            
            const horaInicio = horario.start_time ? horario.start_time.substring(0, 5) : 'N/A';

            const tarjeta = document.createElement('div');
            tarjeta.className = 'class-card';
            tarjeta.innerHTML = `
                <div class="status ${claseEstado}">${estado}</div>
                <h3>${nombreActividad}</h3>
                <p><strong>Instructor:</strong> ${nombreInstructor}</p>
                <p><strong>Horario:</strong> ${dia}</p>
                <p><strong>Hora:</strong> ${horaInicio} (${horario.duration_minutes || 60} min)</p>
                <div class="capacity">
                    <span>${ocupacion}/${capacidadMax}</span>
                    <div class="bar"><div class="fill ${claseColor}" style="width:${porcentaje}%;"></div></div>
                </div>
                
                <div class="actions">
                    <button class="btn btn-edit-clase" 
                            data-id="${horario.id}"
                            data-activity-id="${horario.activity_id}"
                            data-instructor-id="${horario.instructor_id || ''}"
                            data-day="${horario.day_of_week}"
                            data-time="${horaInicio}"
                            data-duration="${horario.duration_minutes}"
                            data-capacity="${horario.max_capacity}"
                            data-room="${horario.room || ''}">
                        Editar
                    </button>
                    <button class="btn btn-delete-clase" data-id="${horario.id}">
                        Eliminar
                    </button>
                </div>
            `;
            
            contenedor.appendChild(tarjeta);
        });

    } catch (error) {
        console.error('Error al cargar horarios:', error);
        contenedor.innerHTML = `<p class="error">Error al cargar horarios: ${error.message}</p>`;
    }
}


// --- TAREA 2: Lógica para mostrar/ocultar el modal CREAR CLASE ---
function setupCrearClaseModalToggles() {
    const modal = document.getElementById('modal-crear-clase');
    const botonAbrir = document.getElementById('btn-abrir-modal-crear-clase');
    const botonCerrarX = document.getElementById('btn-cerrar-modal-clase');
    const botonCancelar = document.getElementById('btn-cancelar-modal-clase');

    if (!modal || !botonAbrir || !botonCerrarX || !botonCancelar) return;

    function abrirModal() { modal.classList.remove('hidden'); }
    function cerrarModal() { 
        document.getElementById('form-crear-clase').reset(); 
        modal.classList.add('hidden'); 
    }

    botonAbrir.addEventListener('click', abrirModal);
    botonCerrarX.addEventListener('click', cerrarModal);
    botonCancelar.addEventListener('click', cerrarModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) cerrarModal();
    });
}


// --- TAREA 3: Conectar el formulario de creación (POST /schedules) (MODIFICADO) ---
function setupCrearClaseFormSubmitListener() {
    const form = document.getElementById('form-crear-clase');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        
        const horaInicio = formData.get('start_time');
        
        // --- CAMBIO: Añadir instructor_id (si existe) ---
        const instructorId = parseInt(formData.get('instructor_id'));

        const scheduleData = {
            activity_id: parseInt(formData.get('activity_id')),
            // Añade instructor_id solo si es un número válido
            instructor_id: isNaN(instructorId) ? null : instructorId,
            day_of_week: formData.get('day_of_week'),
            start_time: `${horaInicio}:00`,
            duration_minutes: parseInt(formData.get('duration_minutes')),
            max_capacity: parseInt(formData.get('max_capacity')),
            room: formData.get('room')
        };
        
        if (isNaN(scheduleData.activity_id)) {
            alert('Por favor, ingresa un ID de Actividad válido.');
            return;
        }

        try {
            const respuesta = await fetch(`${API_BASE_URL}/schedules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(scheduleData)
            });

            const respuestaApi = await respuesta.json();

            if (!respuesta.ok || !respuestaApi.success) {
                throw new Error(respuestaApi.message || 'Error al programar la clase. (¿El ID de Actividad existe?)');
            }

            alert('✅ ¡Clase programada con éxito!');
            document.getElementById('modal-crear-clase').classList.add('hidden');
            document.getElementById('form-crear-clase').reset();
            cargarHorariosClase(); // Recargar la lista de clases

        } catch (error) {
            console.error('Error al crear horario:', error);
            alert(`❌ Error al programar la clase: ${error.message}`);
        }
    });
}


// -------------------------------------------------------------------
// --- INICIO DE NUEVAS FUNCIONES (TAREAS 4, 5 y 6) ---
// -------------------------------------------------------------------

// --- TAREA 4: Lógica para mostrar/ocultar el modal EDITAR CLASE ---
function setupEditarClaseModalToggles() {
    const modal = document.getElementById('modal-editar-clase');
    const botonCerrarX = document.getElementById('btn-cerrar-modal-editar-clase');
    const botonCancelar = document.getElementById('btn-cancelar-modal-editar-clase');

    if (!modal || !botonCerrarX || !botonCancelar) return;

    function cerrarModal() { 
        document.getElementById('form-editar-clase').reset();
        modal.classList.add('hidden'); 
    }

    botonCerrarX.addEventListener('click', cerrarModal);
    botonCancelar.addEventListener('click', cerrarModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) cerrarModal();
    });
}

// --- TAREA 5: Conectar el formulario de EDICIÓN (PUT /schedules/{id}) ---
function setupEditarClaseFormSubmitListener() {
    const form = document.getElementById('form-editar-clase');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const scheduleId = formData.get('id');

        const horaInicio = formData.get('start_time');
        const instructorId = parseInt(formData.get('instructor_id'));

        const scheduleData = {
            activity_id: parseInt(formData.get('activity_id')),
            instructor_id: isNaN(instructorId) ? null : instructorId,
            day_of_week: formData.get('day_of_week'),
            start_time: `${horaInicio.length === 5 ? horaInicio + ':00' : horaInicio}`, // Asegura HH:MM:SS
            duration_minutes: parseInt(formData.get('duration_minutes')),
            max_capacity: parseInt(formData.get('max_capacity')),
            room: formData.get('room')
        };

        try {
            const respuesta = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
                method: 'PUT', // PUT actualiza todo el recurso
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(scheduleData)
            });

            const respuestaApi = await respuesta.json();

            if (!respuesta.ok || !respuestaApi.success) {
                throw new Error(respuestaApi.message || 'Error al actualizar la clase.');
            }

            alert('✅ ¡Clase actualizada con éxito!');
            document.getElementById('modal-editar-clase').classList.add('hidden');
            form.reset();
            cargarHorariosClase(); // Recargar la lista

        } catch (error) {
            console.error('Error al actualizar horario:', error);
            alert(`❌ Error al actualizar la clase: ${error.message}`);
        }
    });
}

// --- TAREA 6: Listeners para EDITAR (Modificar) y ELIMINAR ---
function setupContenedorListeners() {
    const contenedor = document.getElementById('clases-contenedor');
    if (!contenedor) return;

    // Usamos event delegation para escuchar clics en botones
    contenedor.addEventListener('click', (event) => {
        const target = event.target;

        // Clic en botón EDITAR
        if (target.classList.contains('btn-edit-clase')) {
            handleEditClaseClick(target.dataset);
        }

        // Clic en botón ELIMINAR
        if (target.classList.contains('btn-delete-clase')) {
            handleDeleteClaseClick(target.dataset.id);
        }
    });
}

/**
 * Muestra el modal de edición y carga los datos de la clase.
 */
function handleEditClaseClick(data) {
    // Rellenar el formulario de edición con los datos del botón
    document.getElementById('edit-schedule-id').value = data.id;
    document.getElementById('edit-input-actividad').value = data.activityId;
    document.getElementById('edit-input-instructor').value = data.instructorId;
    document.getElementById('edit-input-dia').value = data.day;
    document.getElementById('edit-input-hora').value = data.time;
    document.getElementById('edit-input-duracion').value = data.duration;
    document.getElementById('edit-input-capacidad').value = data.capacity;
    document.getElementById('edit-input-salon').value = data.room;

    // Mostrar el modal
    document.getElementById('modal-editar-clase').classList.remove('hidden');
}

/**
 * Pide confirmación y envía la petición DELETE.
 */
async function handleDeleteClaseClick(scheduleId) {
    if (!confirm(`¿Estás seguro de que deseas eliminar el horario de clase con ID ${scheduleId}?`)) {
        return;
    }

    try {
        const respuesta = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
            method: 'DELETE'
        });

        const respuestaApi = await respuesta.json();

        if (!respuesta.ok || !respuestaApi.success) {
            throw new Error(respuestaApi.message || 'Error al eliminar la clase.');
        }

        alert('✅ ¡Clase eliminada con éxito!');
        cargarHorariosClase(); // Recargar la lista

    } catch (error) {
        console.error('Error al eliminar horario:', error);
        alert(`❌ Error al eliminar la clase: ${error.message}`);
    }
}