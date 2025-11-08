// js/membresias.js (Versión Final con CRUD Completo de Asignaciones)

// --- CONFIGURACIÓN ---
const API_BASE_URL = 'http://127.0.0.1:8000';

// --- EJECUCIÓN PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    cargarMembresiasActivas();
    
    // Tareas "Crear Tipo" (Estético)
    setupCrearTipoModalToggles();
    setupCrearTipoFormSubmitListener();

    // Tareas "Asignar Membresía" (POST)
    setupAsignarModalToggles();
    setupAsignarFormSubmitListener();
    setupPlanCardButtons();

    // Tareas "Editar/Eliminar Asignación" (PUT/DELETE)
    setupEditAsignacionModalToggles();
    setupEditAsignacionFormSubmitListener();
});


// --- TAREA 0: Conectar botones de tarjetas (Asignar) ---
function setupPlanCardButtons() {
    const botonesAsignar = document.querySelectorAll('.btn-asignar-plan');
    const modal = document.getElementById('modal-asignar-membresia');
    const selectTipo = document.getElementById('input-membership-type');
    const inputPrecio = document.getElementById('input-price');

    if (!modal || botonesAsignar.length === 0 || !selectTipo || !inputPrecio) return;

    botonesAsignar.forEach(btn => {
        btn.addEventListener('click', () => {
            const planType = btn.getAttribute('data-type');
            const planPrice = btn.getAttribute('data-price');
            
            if (planType) selectTipo.value = planType;
            if (planPrice) inputPrecio.value = parseFloat(planPrice).toFixed(2);

            document.getElementById('input-member-id').value = '';
            document.getElementById('descuento-info').textContent = 'Ingrese un ID de miembro válido.';
            modal.classList.remove('hidden');
        });
    });
}

// --- TAREA 1: Cargar la lista (GET) (Modificada para CRUD) ---
async function cargarMembresiasActivas() {
    const tbody = document.getElementById('membresias-list');
    if (!tbody) return; 
    tbody.innerHTML = '<tr><td colspan="5">Cargando membresías...</td></tr>';

    try {
        const respuesta = await fetch(`${API_BASE_URL}/memberships`);
        if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);
        const respuestaApi = await respuesta.json();
        if (!respuestaApi.success || !respuestaApi.data) throw new Error(respuestaApi.message || 'La API no devolvió datos válidos');

        const membresias = respuestaApi.data;
        tbody.innerHTML = ''; 

        membresias.forEach(m => {
            const fila = document.createElement('tr');
            const fechaVencimiento = m.end_date ? new Date(m.end_date).toLocaleDateString() : 'N/A';
            const tipo = (m.membership_type || 'N/A').replace('_', ' ');
            
            fila.innerHTML = `
                <td>${m.member_id || 'N/A'}</td>
                <td style="text-transform: capitalize;">${tipo}</td>
                <td>${fechaVencimiento}</td>
                <td>$${m.price ? m.price.toFixed(2) : '0.00'}</td>
                <td>
                    <button class="btn small btn-edit-asignacion" data-id="${m.id}">Editar</button>
                    <button class="btn delete small btn-delete-asignacion" data-id="${m.id}">X</button>
                </td>
            `;
            
            // 🚨 CONEXIÓN DE BOTONES DE ACCIÓN 🚨
            
            // Conectar EDITAR
            fila.querySelector('.btn-edit-asignacion').addEventListener('click', () => {
                abrirModalEdicionAsignacion(m); // Pasa la membresía completa
            });

            // Conectar ELIMINAR
            fila.querySelector('.btn-delete-asignacion').addEventListener('click', () => {
                if (confirm(`¿Estás seguro de que quieres eliminar la asignación ${m.id} (Tipo: ${tipo})?`)) {
                    eliminarAsignacion(m.id);
                }
            });

            tbody.appendChild(fila);
        });

        if (membresias.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No hay membresías asignadas.</td></tr>';
        }
    } catch (error) {
        console.error('Error al cargar membresías:', error);
        tbody.innerHTML = `<tr><td colspan="5" class="error">Error: ${error.message}</td></tr>`;
    }
}


// --- TAREA 2: Lógica modal "Asignar Membresía" ---
function setupAsignarModalToggles() {
    const modal = document.getElementById('modal-asignar-membresia');
    const botonCerrarX = document.getElementById('btn-cerrar-modal-asignar');
    const botonCancelar = document.getElementById('btn-cancelar-modal-asignar');
    if (!modal || !botonCerrarX || !botonCancelar) return;

    function cerrarModal() { 
        document.getElementById('form-asignar-membresia').reset(); 
        document.getElementById('descuento-info').textContent = 'Ingrese un ID de miembro válido.'; 
        document.getElementById('input-price').value = ''; 
        modal.classList.add('hidden'); 
    }
    botonCerrarX.addEventListener('click', cerrarModal);
    botonCancelar.addEventListener('click', cerrarModal);
    modal.addEventListener('click', (event) => { if (event.target === modal) cerrarModal(); });
    
    const memberIdInput = document.getElementById('input-member-id');
    if (memberIdInput) memberIdInput.addEventListener('input', aplicarDescuentoAutomatico);
    const selectTipo = document.getElementById('input-membership-type');
    if (selectTipo) selectTipo.addEventListener('change', aplicarDescuentoAutomatico);
}

// --- TAREA 3: Conectar formulario "Asignar Membresía" (POST) ---
function setupAsignarFormSubmitListener() {
    const form = document.getElementById('form-asignar-membresia');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const data = {
            member_id: parseInt(formData.get('member_id')),
            membership_type: formData.get('membership_type'),
            price: parseFloat(formData.get('price')),
        };
        // ... (Validaciones omitidas por brevedad) ...
        try {
            const respuesta = await fetch(`${API_BASE_URL}/memberships`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const respuestaApi = await respuesta.json();
            if (!respuesta.ok || !respuestaApi.success) throw new Error(respuestaApi.message || 'Error al procesar la asignación');
            alert('¡Membresía asignada con éxito!');
            document.getElementById('form-asignar-membresia').reset();
            document.getElementById('modal-asignar-membresia').classList.add('hidden');
            cargarMembresiasActivas(); 
        } catch (error) {
            console.error('Error al asignar membresía:', error);
            alert(`Error al asignar membresía: ${error.message}`);
        }
    });
}

// --- TAREA 4: Lógica modal "Crear Tipo" ---
function setupCrearTipoModalToggles() {
    const modal = document.getElementById('modal-crear-tipo'); 
    const botonAbrir = document.getElementById('btn-abrir-modal-crear-tipo'); 
    const botonCerrarX = document.getElementById('btn-cerrar-modal-tipo');
    const botonCancelar = document.getElementById('btn-cancelar-modal-tipo');
    if (!modal || !botonAbrir || !botonCerrarX || !botonCancelar) return;
    function abrirModal() { modal.classList.remove('hidden'); } 
    function cerrarModal() { 
        document.getElementById('form-crear-tipo').reset(); 
        modal.classList.add('hidden'); 
    }
    botonAbrir.addEventListener('click', abrirModal); 
    botonCerrarX.addEventListener('click', cerrarModal);
    botonCancelar.addEventListener('click', cerrarModal);
    modal.addEventListener('click', (event) => { if (event.target === modal) cerrarModal(); });
}

// --- TAREA 5: Conectar formulario "Crear Tipo" (Simulado) ---
function setupCrearTipoFormSubmitListener() {
    const form = document.getElementById('form-crear-tipo');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        alert('Simulación Exitosa: El plan ha sido creado. (API endpoint no implementado).');
        document.getElementById('form-crear-tipo').reset();
        document.getElementById('modal-crear-tipo').classList.add('hidden');
    });
}

// --- TAREA 6: Lógica de Descuento Automático (CORREGIDA) ---
async function aplicarDescuentoAutomatico() {
    const memberIdInput = document.getElementById('input-member-id');
    const precioInput = document.getElementById('input-price');
    const infoDiv = document.getElementById('descuento-info'); 
    const selectTipo = document.getElementById('input-membership-type');
    const memberId = parseInt(memberIdInput.value);

    // 1. Definir los precios base (deben coincidir con el HTML data-price)
    const preciosBase = {
        'monthly': 15000,
        'quarterly': 40000,
        'annual': 150000,
        'semiannual': 0 // (Añade el precio si existe)
    };
    
    // 2. Obtener el precio base del plan seleccionado actualmente
    const tipoPlanActual = selectTipo.value;
    const precioBase = preciosBase[tipoPlanActual] || 0;

    // Si el ID de miembro está vacío, resetea el precio al base
    if (isNaN(memberId) || memberIdInput.value.trim() === '') {
        if (infoDiv) infoDiv.textContent = 'Ingrese un ID de miembro válido.';
        precioInput.value = precioBase.toFixed(2);
        return;
    }

    try {
        // 3. Buscar al miembro para ver su descuento
        const respuesta = await fetch(`${API_BASE_URL}/members/${memberId}`);
        if (respuesta.status === 404) throw new Error("ID de Miembro no encontrado.");
        if (!respuesta.ok) throw new Error("Error de API al obtener miembro.");
        
        const miembroApi = await respuesta.json();
        
        let miembro;
        if (miembroApi.data) {
            miembro = miembroApi.data;
        } else if (miembroApi.success !== false) { // Acepta si no tiene 'data' pero no es un error
            miembro = miembroApi;
        } else {
             throw new Error(miembroApi.message || "Respuesta de API inválida.");
        }
        
        // 🚨 INICIO DE LA CORRECCIÓN 🚨
        // Limpiamos el dato que viene de la API (quitamos espacios y convertimos a minúscula)
        const descuentoInfo = (miembro.discount_type || 'none').trim().toLowerCase();
        
        let porcentaje = 0;
        let texto = `Miembro: ${miembro.first_name} ${miembro.last_name}. `;

        if (descuentoInfo === 'student') {
            porcentaje = 20;
            texto += '✅ Descuento aplicado: 20% (Estudiante)';
        } else if (descuentoInfo === 'senior') {
            porcentaje = 40;
            texto += '✅ Descuento aplicado: 40% (Adulto Mayor)';
        } else {
            // Esto es lo que estabas viendo
            texto += 'No aplica descuento automático.';
        }
        // 🚨 FIN DE LA CORRECCIÓN 🚨
        
        if (infoDiv) infoDiv.textContent = texto;

        // 4. CALCULAR Y MOSTRAR PRECIO FINAL
        const precioFinal = precioBase * (1 - (porcentaje / 100));
        precioInput.value = precioFinal.toFixed(2); // Actualiza el input de precio

    } catch (error) {
        if (infoDiv) infoDiv.textContent = `❌ ${error.message}`;
        precioInput.value = precioBase.toFixed(2); // Si hay error, vuelve al precio base
        console.error('Error al obtener descuento:', error);
    }
}


// --- TAREA 7 (¡NUEVA!): FUNCIÓN DE ELIMINACIÓN (DELETE) ---
async function eliminarAsignacion(membershipId) {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/memberships/${membershipId}`, {
            method: 'DELETE'
        });
        
        if (!respuesta.ok) {
            // Intenta leer el error del backend
            try {
                const errorData = await respuesta.json();
                throw new Error(errorData.message || `Error del servidor (Código: ${respuesta.status}).`);
            } catch (jsonError) {
                // Si la respuesta no es JSON (ej. un 500 HTML)
                throw new Error(`Error del servidor (Código: ${respuesta.status}).`);
            }
        }
        
        alert('Asignación de membresía eliminada con éxito.');
        cargarMembresiasActivas(); 

    } catch (error) {
        console.error('Error al eliminar membresía:', error);
        alert(`Fallo al eliminar membresía: ${error.message}`);
    }
}

// --- TAREA 8 (¡NUEVA!): Lógica modal "Editar Asignación" ---
function setupEditAsignacionModalToggles() {
    const modal = document.getElementById('modal-editar-asignacion');
    const botonCerrarX = document.getElementById('btn-cerrar-modal-edit-asig');
    const botonCancelar = document.getElementById('btn-cancelar-modal-edit-asig');
    if (!modal || !botonCerrarX || !botonCancelar) return;

    function cerrarModal() { 
        document.getElementById('form-editar-asignacion').reset();
        modal.classList.add('hidden'); 
    }
    botonCerrarX.addEventListener('click', cerrarModal);
    botonCancelar.addEventListener('click', cerrarModal);
    modal.addEventListener('click', (event) => { if (event.target === modal) cerrarModal(); });
}

// --- TAREA 9 (¡NUEVA!): Conectar formulario "Editar Asignación" (PUT) ---
function setupEditAsignacionFormSubmitListener() {
    const form = document.getElementById('form-editar-asignacion');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        
        const asignacionId = formData.get('id');

        const data = {
            membership_type: formData.get('membership_type'),
            price: parseFloat(formData.get('price')),
            end_date: formData.get('end_date') 
        };

        try {
            const respuesta = await fetch(`${API_BASE_URL}/memberships/${asignacionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const respuestaApi = await respuesta.json();
            if (!respuesta.ok || !respuestaApi.success) throw new Error(respuestaApi.message || 'Error al actualizar');
            
            alert('Asignación actualizada con éxito.');
            document.getElementById('modal-editar-asignacion').classList.add('hidden');
            cargarMembresiasActivas();
        } catch (error) {
            console.error('Error al actualizar asignación:', error);
            alert(`Error al actualizar: ${error.message}`);
        }
    });
}

// --- FUNCIÓN HELPER (¡NUEVA!): Abrir modal de Edición de Asignación ---
function abrirModalEdicionAsignacion(asignacion) {
    const modal = document.getElementById('modal-editar-asignacion');
    if (!modal) return;
    
    // Rellenar el formulario con los datos de la asignación
    document.getElementById('edit-asignacion-id').value = asignacion.id;
    document.getElementById('edit-asig-member-id').value = asignacion.member_id;
    document.getElementById('edit-asig-type').value = asignacion.membership_type;
    document.getElementById('edit-asig-price').value = asignacion.price.toFixed(2);
    
    // Formatear la fecha para el input type="date" (YYYY-MM-DD)
    let fechaVencimiento = '';
    if (asignacion.end_date) {
        fechaVencimiento = new Date(asignacion.end_date).toISOString().split('T')[0];
    }
    document.getElementById('edit-asig-end-date').value = fechaVencimiento;
    
    modal.classList.remove('hidden');
}