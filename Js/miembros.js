// js/miembros.js
// Script exclusivo para la página miembros.html - Versión FINAL CRUD + BÚSQUEDA

// --- CONFIGURACIÓN ---
const API_BASE_URL = 'http://127.0.0.1:8000';
let todosLosMiembros = []; // <-- Variable global para almacenar los miembros
// let todosLosMiembros = []; 

// --- EJECUCIÓN PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Tarea 1: Cargar la grilla de miembros
    cargarMiembrosGrid();

    // Tarea 2: Conectar botones del modal CREAR
    setupCreateModalToggles();

    // Tarea 3: Conectar formulario de CREAR
    setupCreateFormSubmitListener();

    // Tarea 4: Conectar botones del modal EDITAR
    setupEditModalToggles();

    // Tarea 5: Conectar formulario de EDITAR
    setupEditFormSubmitListener();
    
    // Tarea 6: Conectar la barra de búsqueda (¡NUEVA!)
    setupSearchListener(); 
});


// --- TAREA 1: Cargar la grilla (MODIFICADA para guardar datos globalmente) ---
async function cargarMiembrosGrid() {
    const grid = document.querySelector('.members-grid');
    if (!grid) return; 

    grid.innerHTML = '<p>Cargando...</p>'; 

    try {
        const respuesta = await fetch(`${API_BASE_URL}/members`);
        if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);

        const respuestaApi = await respuesta.json();
        if (!respuestaApi.success || !respuestaApi.data) {
            throw new Error(respuestaApi.message || 'La API no devolvió datos válidos');
        }

        // 🚨 Guardar todos los miembros en la variable global
        todosLosMiembros = respuestaApi.data;
        
        // Dibujar todos los miembros al inicio
        renderizarMiembros(todosLosMiembros);

    } catch (error) {
        console.error('Error al cargar miembros:', error);
        grid.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
}


// --- TAREA 6 (¡NUEVA!): Conectar la barra de búsqueda ---
function setupSearchListener() {
    const inputBusqueda = document.getElementById('input-busqueda');
    if (!inputBusqueda) return;

    // Ejecutar la búsqueda cada vez que se teclea una letra
    inputBusqueda.addEventListener('input', () => {
        const termino = inputBusqueda.value.toLowerCase().trim();
        
        // Si no hay término de búsqueda, mostrar todos
        if (termino.length === 0) {
            renderizarMiembros(todosLosMiembros);
            return;
        }

        // Filtrar localmente la lista de miembros
        const miembrosFiltrados = todosLosMiembros.filter(miembro => {
            const nombreCompleto = `${miembro.first_name || ''} ${miembro.last_name || ''}`.toLowerCase();
            const dni = (miembro.dni || '').toString().toLowerCase();

            return nombreCompleto.includes(termino) || dni.includes(termino);
        });

        renderizarMiembros(miembrosFiltrados);
    });
}


// --- FUNCIÓN HELPER: Dibuja las tarjetas en el HTML ---
function renderizarMiembros(miembrosParaDibujar) {
    const grid = document.querySelector('.members-grid');
    if (!grid) return;

    grid.innerHTML = ''; // Limpiar la grilla antes de dibujar

    if (miembrosParaDibujar.length === 0) {
        grid.innerHTML = '<p>No se encontraron miembros con el término de búsqueda.</p>';
        return;
    }

    miembrosParaDibujar.forEach(miembro => {
        const card = document.createElement('div');
        card.className = 'member-card';
        
        // Lógica de estado
        const tipoMembresia = miembro.member_type || 'regular'; 
        let estadoTexto = '';
        let claseEstado = '';

        if (tipoMembresia.toLowerCase() === 'regular' || miembro.status.toLowerCase() === 'inactive') {
            estadoTexto = 'Inactivo';
            claseEstado = 'expired'; 
        } else {
            estadoTexto = 'Activo';
            claseEstado = 'active';
        }
        
        const fechaRegistro = miembro.registration_date 
            ? new Date(miembro.registration_date).toLocaleDateString() 
            : 'N/A';

        card.innerHTML = `
            <div class="status ${claseEstado}">${estadoTexto}</div>
            <div class="avatar">👤</div>
            <h3>${miembro.first_name || ''} ${miembro.last_name || ''}</h3>
            <p><strong>DNI:</strong> ${miembro.dni || 'N/A'}</p>
            <p><strong>Teléfono:</strong> ${miembro.phone || 'N/A'}</p>
            <p><strong>Membresía:</strong> ${tipoMembresia}</p>
            <p><strong>Registro:</strong> ${fechaRegistro}</p>
            <div class="actions_mem">
                <button class="btn edit btn-edit-card" data-id="${miembro.id}">✏️ Editar</button>
                <button class="btn delete btn-delete-card" data-id="${miembro.id}">🗑️ Eliminar</button>
            </div>
        `;
        
        // Conexión de botones (listeners)
        card.querySelector('.btn-edit-card').addEventListener('click', () => {
            abrirModalEdicion(miembro);
        });
        card.querySelector('.btn-delete-card').addEventListener('click', () => {
            if (confirm(`¿Estás seguro de que quieres eliminar a ${miembro.first_name} ${miembro.last_name}?`)) {
                eliminarMiembro(miembro.id);
            }
        });

        grid.appendChild(card);
    });
}


// --- TAREA 2: Lógica para mostrar/ocultar el modal CREAR ---
function setupCreateModalToggles() {
    const modal = document.getElementById('modal-crear-miembro');
    
    // IDs sincronizados con el HTML
    const botonAbrir = document.getElementById('btn-abrir-modal-crear'); 
    const botonCerrarX = document.getElementById('btn-cerrar-modal-crear');
    const botonCancelar = document.getElementById('btn-cancelar-modal-crear');

    if (!modal || !botonAbrir || !botonCerrarX || !botonCancelar) {
        console.error("Error Tarea 2: No se pudieron encontrar todos los botones del modal de creación.");
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


// --- TAREA 3: Conectar el formulario CREAR a la API ---
function setupCreateFormSubmitListener() {
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

            // Valores fijos
            member_type: "regular", 
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
                throw new Error(respuestaApi.message || 'Error del servidor');
            }
            form.reset(); 
            document.getElementById('modal-crear-miembro').classList.add('hidden');
            
            // 🚨 Actualizamos la lista después de crear
            cargarMiembrosGrid(); 
        } catch (error) {
            console.error('Error al crear miembro:', error);
            alert(`Error al crear miembro: ${error.message}`);
        }
    });
}


// --- TAREA 4: Lógica para mostrar/ocultar el modal EDITAR ---
function setupEditModalToggles() {
    const modal = document.getElementById('modal-editar-miembro');
    const botonCerrarX = document.getElementById('btn-cerrar-modal-edit');
    const botonCancelar = document.getElementById('btn-cancelar-modal-edit');

    if (!modal || !botonCerrarX || !botonCancelar) return;

    function cerrarModal() {
        modal.classList.add('hidden');
    }

    botonCerrarX.addEventListener('click', cerrarModal);
    botonCancelar.addEventListener('click', cerrarModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) cerrarModal();
    });
}


// --- TAREA 5: Conectar el formulario EDITAR a la API ---
function setupCreateFormSubmitListener() {
    const form = document.getElementById('form-crear-miembro');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);

        // Helper: intenta FormData y si falla hace fallback por id o por name
        const getField = (name, idFallback) => {
            let v = formData.get(name);
            if (v === null || v === undefined) {
                const elById = idFallback ? document.getElementById(idFallback) : null;
                const elByName = document.querySelector(`[name="${name}"]`);
                const el = elById || elByName;
                v = el ? el.value : '';
            }
            return typeof v === 'string' ? v.trim() : v;
        };

        const memberData = {
            first_name: getField('first_name', 'input-nombre'),
            last_name: getField('last_name', 'input-apellido'),
            email: getField('email', 'input-email'),
            dni: getField('dni', 'input-dni'),
            phone: getField('phone', 'input-telefono'),
            address: getField('address', 'input-address'),
            date_of_birth: getField('date_of_birth', 'input-nacimiento'),
            discount_type: getField('discount_type', 'input-discount-type'),

            // Valores fijos
            member_type: "regular",
            status: "inactive"
        };

        // Depuración: ver qué se va a enviar
        console.log('Creando miembro - datos enviados:', memberData);

        try {
            const respuesta = await fetch(`${API_BASE_URL}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(memberData)
            });
            const respuestaApi = await respuesta.json();
            if (!respuesta.ok || !respuestaApi.success) {
                throw new Error(respuestaApi.message || 'Error del servidor');
            }
            form.reset();
            document.getElementById('modal-crear-miembro').classList.add('hidden');

            // Actualizamos la lista después de crear
            cargarMiembrosGrid();
        } catch (error) {
            console.error('Error al crear miembro:', error);
            alert(`Error al crear miembro: ${error.message}`);
        }
    });
}


// --- FUNCIÓN HELPER: Abre el modal de edición y rellena los datos ---
function abrirModalEdicion(miembro) {
    const modal = document.getElementById('modal-editar-miembro');
    if (!modal) return;
    
    document.getElementById('edit-member-id').value = miembro.id;
    document.getElementById('edit-input-nombre').value = miembro.first_name || '';
    document.getElementById('edit-input-apellido').value = miembro.last_name || '';
    document.getElementById('edit-input-email').value = miembro.email || '';
    document.getElementById('edit-input-dni').value = miembro.dni || '';
    document.getElementById('edit-input-telefono').value = miembro.phone || '';
    document.getElementById('edit-input-address').value = miembro.address || '';
    
    document.getElementById('edit-input-member-type').value = miembro.member_type || 'regular';
    document.getElementById('edit-input-discount-type').value = miembro.discount_type || 'none';

    let fechaNacimiento = '';
    if (miembro.date_of_birth) {
        fechaNacimiento = new Date(miembro.date_of_birth).toISOString().split('T')[0];
    }
    document.getElementById('edit-input-nacimiento').value = fechaNacimiento;
    
    modal.classList.remove('hidden');
}


// --- FUNCIÓN DE ELIMINACIÓN (DELETE) ---
async function eliminarMiembro(memberId) {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/members/${memberId}`, {
            method: 'DELETE'
        });
        
        if (!respuesta.ok) {
            const errorData = await respuesta.json();
            throw new Error(errorData.message || `Error del servidor al intentar eliminar (Código: ${respuesta.status}).`);
        }

        alert('Miembro eliminado con éxito.');
        cargarMiembrosGrid(); 

    } catch (error) {
        console.error('Error al eliminar miembro:', error);
        alert(`Fallo al eliminar miembro: ${error.message}`);
    }
}