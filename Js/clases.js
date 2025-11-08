// js/clases.js
// Script exclusivo para la página clases.html (Conexión REAL)

// --- CONFIGURACIÓN ---
const API_BASE_URL = 'http://127.0.0.1:8000';

// --- EJECUCIÓN PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Tarea 1: Cargar la lista de horarios de clase
    cargarHorariosClase();

    // Tarea 2: Conectar botones del modal
    setupCrearClaseModalToggles();

    // Tarea 3: Conectar el formulario de creación (REAL)
    setupCrearClaseFormSubmitListener();
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
            const nombreInstructor = horario.instructor_id ? `Trainer ID: ${horario.instructor_id}` : "Sin asignar";
            
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
                    <button class="btn btn-edit-clase" data-id="${horario.id}">Editar</button>
                    <button class="btn primary">Ver Detalles</button>
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


// --- TAREA 3: Conectar el formulario de creación de horario (POST /schedules) (REAL) ---
function setupCrearClaseFormSubmitListener() {
    const form = document.getElementById('form-crear-clase');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        
        // 🚨 LA SOLUCIÓN (Alineada con tu API) 🚨
        // Tu API espera un string HH:MM:SS según la colección de Postman.
        const horaInicio = formData.get('start_time');
        
        const scheduleData = {
            activity_id: parseInt(formData.get('activity_id')),
            day_of_week: formData.get('day_of_week'),
            start_time: `${horaInicio}:00`, // <-- Enviamos "18:30:00"
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
                // Si el Error 500 persiste, es porque el ID de Actividad no existe.
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