// js/entrenadores.js
// Script exclusivo para la página entrenadores.html (CON CRUD COMPLETO)

// --- CONFIGURACIÓN ---
const API_BASE_URL = 'http://127.0.0.1:8000';

// --- EJECUCIÓN PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Tarea 1: Cargar la lista de entrenadores
    cargarEntrenadores();

    // Tarea 2: Conectar botones del modal CREAR
    setupCrearTrainerModalToggles();

    // Tarea 3: Conectar el formulario de CREAR
    setupCrearTrainerFormSubmitListener();

    // Tarea 4: Conectar botones del modal EDITAR
    setupEditTrainerModalToggles();

    // Tarea 5: Conectar el formulario de EDITAR
    setupEditTrainerFormSubmitListener();

    // Tarea 6 (Eliminar) se llama desde la Tarea 1
});


// --- TAREA 1: Cargar la lista de entrenadores (GET /trainers) (MODIFICADA PARA DELETE) ---
async function cargarEntrenadores() {
    const contenedor = document.getElementById('trainers-contenedor');
    if (!contenedor) return; 

    contenedor.innerHTML = '<p>Cargando entrenadores...</p>';

    try {
        const respuesta = await fetch(`${API_BASE_URL}/trainers`);
        if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);

        const respuestaApi = await respuesta.json();
        if (!respuestaApi.success || !respuestaApi.data) {
            throw new Error(respuestaApi.message || 'La API no devolvió datos válidos');
        }

        const entrenadores = respuestaApi.data;
        contenedor.innerHTML = ''; 

        if (entrenadores.length === 0) {
            contenedor.innerHTML = '<p>No hay entrenadores registrados.</p>';
            return;
        }

        entrenadores.forEach(trainer => {
            const iniciales = (trainer.first_name || 'T')[0] + (trainer.last_name || 'R')[0];
            const especialidad = (trainer.specialty || 'N/A').charAt(0).toUpperCase() + (trainer.specialty || 'N/A').slice(1);
            
            const tarjeta = document.createElement('div');
            tarjeta.className = 'trainer-card';
            tarjeta.innerHTML = `
                <div class="avatar">${iniciales}</div>
                <h3>${trainer.first_name} ${trainer.last_name}
                    <span class="rating">⭐ 4.5</span>
                </h3>
                <p><strong>Email:</strong> ${trainer.email}</p>
                <p><strong>Teléfono:</strong> ${trainer.phone}</p>
                <div class="specialties">
                    <span class="tag blue">${especialidad}</span>
                </div>
                <div class="actions">
                    <div class="button-group">
                        <button class="btn btn-edit-trainer" data-id="${trainer.id}">Editar</button>
                        <button class="btn delete btn-delete-trainer" data-id="${trainer.id}">Eliminar</button>
                    </div>
                    <button class="btn primary">Ver Clases</button>
                </div>
            `;
            
            // Conexión del botón EDITAR
            tarjeta.querySelector('.btn-edit-trainer').addEventListener('click', () => {
                abrirModalEdicionTrainer(trainer); // Llama al helper
            });

            // 🚨 ¡CONEXIÓN DE BOTÓN ELIMINAR AÑADIDA! 🚨
            tarjeta.querySelector('.btn-delete-trainer').addEventListener('click', () => {
                // Pedimos confirmación
                if (confirm(`¿Estás seguro de que quieres eliminar a ${trainer.first_name} ${trainer.last_name}?`)) {
                    eliminarTrainer(trainer.id); // Llama a la Tarea 6
                }
            });

            contenedor.appendChild(tarjeta);
        });

    } catch (error) {
        console.error('Error al cargar entrenadores:', error);
        contenedor.innerHTML = `<p class="error">Error al cargar entrenadores: ${error.message}</p>`;
    }
}


// --- TAREA 2: Lógica para mostrar/ocultar el modal CREAR ENTRENADOR ---
function setupCrearTrainerModalToggles() {
    const modal = document.getElementById('modal-crear-trainer');
    const botonAbrir = document.getElementById('btn-abrir-modal-crear-trainer');
    const botonCerrarX = document.getElementById('btn-cerrar-modal-trainer');
    const botonCancelar = document.getElementById('btn-cancelar-modal-trainer');

    if (!modal || !botonAbrir || !botonCerrarX || !botonCancelar) return;

    function abrirModal() { modal.classList.remove('hidden'); }
    function cerrarModal() { 
        document.getElementById('form-crear-trainer').reset(); 
        modal.classList.add('hidden'); 
    }

    botonAbrir.addEventListener('click', abrirModal);
    botonCerrarX.addEventListener('click', cerrarModal);
    botonCancelar.addEventListener('click', cerrarModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) cerrarModal();
    });
}


// --- TAREA 3: Conectar el formulario de creación de entrenador (POST /trainers) ---
function setupCrearTrainerFormSubmitListener() {
    const form = document.getElementById('form-crear-trainer');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        
        const expiryDate = formData.get('certification_expiry');
        
        const trainerData = {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            email: formData.get('email'),
            dni: formData.get('dni'),
            certification: formData.get('certification'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            date_of_birth: formData.get('date_of_birth'),
            specialty: formData.get('specialty'),
            certification_expiry: `${expiryDate}:00` // Añadimos segundos
        };

        try {
            const respuesta = await fetch(`${API_BASE_URL}/trainers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(trainerData)
            });

            const respuestaApi = await respuesta.json();

            if (!respuesta.ok || !respuestaApi.success) {
                throw new Error(respuestaApi.message || 'Error al registrar al entrenador.');
            }

            alert('✅ ¡Entrenador registrado con éxito!');
            document.getElementById('modal-crear-trainer').classList.add('hidden');
            document.getElementById('form-crear-trainer').reset();
            cargarEntrenadores(); 

        } catch (error) {
            console.error('Error al crear entrenador:', error);
            alert(`❌ Error al registrar: ${error.message}`);
        }
    });
}


// --- TAREA 4: Lógica para mostrar/ocultar el modal EDITAR ENTRENADOR ---
function setupEditTrainerModalToggles() {
    const modal = document.getElementById('modal-editar-trainer');
    const botonCerrarX = document.getElementById('btn-cerrar-modal-edit-trainer');
    const botonCancelar = document.getElementById('btn-cancelar-modal-edit-trainer');

    if (!modal || !botonCerrarX || !botonCancelar) return;

    function cerrarModal() { 
        document.getElementById('form-editar-trainer').reset();
        modal.classList.add('hidden'); 
    }
    botonCerrarX.addEventListener('click', cerrarModal);
    botonCancelar.addEventListener('click', cerrarModal);
    modal.addEventListener('click', (event) => { if (event.target === modal) cerrarModal(); });
}


// --- TAREA 5: Conectar el formulario de edición (PUT /trainers/{id}) ---
function setupEditTrainerFormSubmitListener() {
    const form = document.getElementById('form-editar-trainer');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        
        const trainerId = formData.get('id');
        const expiryDate = formData.get('certification_expiry');

        const trainerData = {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            email: formData.get('email'),
            dni: formData.get('dni'),
            certification: formData.get('certification'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            date_of_birth: formData.get('date_of_birth'),
            specialty: formData.get('specialty'),
            certification_expiry: `${expiryDate}:00`
        };

        try {
            const respuesta = await fetch(`${API_BASE_URL}/trainers/${trainerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(trainerData)
            });

            const respuestaApi = await respuesta.json();

            if (!respuesta.ok || !respuestaApi.success) {
                throw new Error(respuestaApi.message || 'Error al actualizar al entrenador.');
            }

            alert('✅ ¡Entrenador actualizado con éxito!');
            document.getElementById('modal-editar-trainer').classList.add('hidden');
            document.getElementById('form-editar-trainer').reset();
            cargarEntrenadores(); 

        } catch (error) {
            console.error('Error al actualizar entrenador:', error);
            alert(`❌ Error al actualizar: ${error.message}`);
        }
    });
}


// --- FUNCIÓN HELPER: Abrir modal de Edición de Entrenador ---
function abrirModalEdicionTrainer(trainer) {
    const modal = document.getElementById('modal-editar-trainer');
    if (!modal) return;
    
    // 1. Rellenar el formulario
    document.getElementById('edit-trainer-id').value = trainer.id;
    document.getElementById('edit-trainer-nombre').value = trainer.first_name || '';
    document.getElementById('edit-trainer-apellido').value = trainer.last_name || '';
    document.getElementById('edit-trainer-email').value = trainer.email || '';
    document.getElementById('edit-trainer-dni').value = trainer.dni || '';
    document.getElementById('edit-trainer-phone').value = trainer.phone || '';
    document.getElementById('edit-trainer-address').value = trainer.address || '';
    document.getElementById('edit-trainer-certification').value = trainer.certification || '';
    document.getElementById('edit-trainer-specialty').value = trainer.specialty || 'general';
    
    // 2. Formatear fechas
    let fechaNacimiento = '';
    if (trainer.date_of_birth) {
        fechaNacimiento = new Date(trainer.date_of_birth).toISOString().split('T')[0];
    }
    document.getElementById('edit-trainer-nacimiento').value = fechaNacimiento;
    
    let fechaExpiracion = '';
    if (trainer.certification_expiry) {
        fechaExpiracion = trainer.certification_expiry.substring(0, 16);
    }
    document.getElementById('edit-trainer-expiry').value = fechaExpiracion;
    
    // 3. Mostrar el modal
    modal.classList.remove('hidden');
}


// --- TAREA 6 (¡NUEVA!): FUNCIÓN DE ELIMINACIÓN (DELETE /trainers/{id}) ---
async function eliminarTrainer(trainerId) {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/trainers/${trainerId}`, {
            method: 'DELETE'
        });

        if (!respuesta.ok) {
            // Si la API devuelve un error (ej. 404, 500), intenta leer el mensaje
            const errorData = await respuesta.json();
            throw new Error(errorData.message || `Error del servidor (Código: ${respuesta.status}).`);
        }
        
        // Si la API devuelve 204 No Content (éxito sin cuerpo), no hay .json()
        
        alert('¡Entrenador eliminado con éxito!');
        cargarEntrenadores(); // Recargar la lista

    } catch (error) {
        console.error('Error al eliminar entrenador:', error);
        alert(`Fallo al eliminar entrenador: ${error.message}`);
    }
}