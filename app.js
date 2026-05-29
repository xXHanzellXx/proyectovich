const API = "http://localhost:5000/productos";
let carrito = [];

// 1. INICIALIZACIÓN
window.onload = () => {
    verificarSesion();
    obtenerProductos();
};

// 2. GESTIÓN DE MODALES (Centrado Flex)
function abrirModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function cerrarModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

// Cerrar al hacer clic en el fondo oscuro
window.onclick = (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
};

// 3. CONTROL DE SESIÓN Y ROLES
function verificarSesion() {
    const user = JSON.parse(localStorage.getItem("usuarioActual"));
    const btnLogout = document.getElementById("btnLogut");
    const btnLoginNav = document.getElementById("btnLoginNav");
    const btnRegNav = document.getElementById("btnRegistroNav");
    const seccionAdmin = document.getElementById("seccionAdmin");

    if (user) {
        if (btnLoginNav) btnLoginNav.style.display = "none";
        if (btnRegNav) btnRegNav.style.display = "none";
        if (btnLogout) btnLogout.style.display = "block";
        
        if (user.rol === "admin") {
            if (seccionAdmin) seccionAdmin.style.display = "block";
            configurarManual("tecnico");
        } else {
            configurarManual("usuario_cliente");
        }
    } else {
        if (btnLoginNav) btnLoginNav.style.display = "inline-block";
        if (btnRegNav) btnRegNav.style.display = "inline-block";
        if (btnLogout) btnLogout.style.display = "none";
        configurarManual("usuario_invitado");
    }
}

// 4. CATÁLOGO: OBTENER PRODUCTOS (Con Categorías y Contador)
function obtenerProductos() {
    fetch(API)
    .then(res => res.json())
    .then(data => {
        const tabla = document.getElementById("cuerpoTabla");
        const user = JSON.parse(localStorage.getItem("usuarioActual"));
        const rol = user ? user.rol : "invitado";
        
        tabla.innerHTML = "";
        data.forEach(p => {
            let acciones = "";
            const cat = p.categoria || "General";

            if (rol === "admin") {
                acciones = `
                    <button class="btn-edit" onclick="prepararEdicion('${p._id}', '${p.nombre}', ${p.precio}, '${cat}')">✏️</button>
                    <button class="btn-delete" onclick="eliminarProducto('${p._id}')">🗑️</button>
                `;
            } else {
                acciones = `
                    <div class="flex gap-2 items-center">
                        <input type="number" id="cant-${p._id}" value="1" min="1" max="99" style="width: 55px;">
                        <button class="btn-add-cart" onclick="agregarVarios('${p._id}', '${p.nombre}', ${p.precio})"> Añadir</button>
                    </div>
                `;
            }

            tabla.innerHTML += `
                <tr>
                    <td>
                        <span class="category-tag" style="display:block; font-size:10px; color:var(--primary); font-weight:bold; text-transform:uppercase;">${cat}</span>
                        <b>${p.nombre}</b>
                    </td>
                    <td>₡${p.precio}</td>
                    <td>${acciones}</td>
                </tr>
            `;
        });
    })
    .catch(err => console.error("Error al obtener productos:", err));
}

// 5. LÓGICA DEL CARRITO (Con Contador)
function agregarVarios(id, nombre, precio) {
    const user = localStorage.getItem("usuarioActual");
    if (!user) {
        alert("Debes iniciar sesión para comprar.");
        window.location.href = "login.html";
        return;
    }

    const inputCantidad = document.getElementById(`cant-${id}`);
    const cantidad = parseInt(inputCantidad.value);

    if (isNaN(cantidad) || cantidad < 1) return;

    for (let i = 0; i < cantidad; i++) {
        carrito.push({ nombre, precio });
    }

    actualizarInterfazCarrito();
    alert(`Agregado: ${nombre} (x${cantidad}) 🛒`);
    inputCantidad.value = 1;
}

function actualizarInterfazCarrito() {
    const lista = document.getElementById("listaCarrito");
    const contador = document.getElementById("contadorCarrito");
    const totalSpan = document.getElementById("totalCarrito");

    contador.innerText = carrito.length;
    lista.innerHTML = "";
    let total = 0;

    if (carrito.length === 0) {
        lista.innerHTML = "<p class='text-muted'>El carrito está vacío.</p>";
    } else {
        carrito.forEach((item, index) => {
            total += item.precio;
            lista.innerHTML += `
                <div class="item-carrito" style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border);">
                    <span>${item.nombre}</span>
                    <span><b>₡${item.precio}</b> <button onclick="eliminarDelCarrito(${index})" style="background:none; color:red; margin-left:8px;">✕</button></span>
                </div>
            `;
        });
    }
    totalSpan.innerText = `Total: ₡${total}`;
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarInterfazCarrito();
}

function finalizarCompra() {
    if (carrito.length === 0) return alert("El carrito está vacío.");
    alert("🚀 ¡Pedido confirmado! Gracias por tu compra.");
    carrito = [];
    actualizarInterfazCarrito();
    cerrarModal('modalCarrito');
}

// 6. CRUD ADMINISTRADOR (Con Categorías)
function agregarProducto() {
    const nombre = document.getElementById("nombre").value;
    const precio = document.getElementById("precio").value;
    const categoria = document.getElementById("categoria").value;

    if(!nombre || !precio) return alert("Completa los campos");

    fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, precio: parseFloat(precio), categoria })
    }).then(() => {
        obtenerProductos();
        document.getElementById("nombre").value = "";
        document.getElementById("precio").value = "";
    });
}

function eliminarProducto(id) {
    if(confirm("¿Seguro que deseas eliminarlo?")) {
        fetch(`${API}/${id}`, { method: "DELETE" }).then(() => obtenerProductos());
    }
}

function prepararEdicion(id, nombre, precio, categoria) {
    document.getElementById("nombre").value = nombre;
    document.getElementById("precio").value = precio;
    document.getElementById("categoria").value = categoria;
    const btn = document.getElementById("btnPrincipal");
    btn.innerText = "Actualizar Producto";
    btn.onclick = () => enviarEdicion(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function enviarEdicion(id) {
    const nombre = document.getElementById("nombre").value;
    const precio = document.getElementById("precio").value;
    const categoria = document.getElementById("categoria").value;

    fetch(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, precio: parseFloat(precio), categoria })
    }).then(() => {
        alert("Actualizado ✅");
        resetFormulario();
        obtenerProductos();
    });
}

function resetFormulario() {
    document.getElementById("nombre").value = "";
    document.getElementById("precio").value = "";
    document.getElementById("categoria").value = "General";
    const btn = document.getElementById("btnPrincipal");
    btn.innerText = "Añadir Producto";
    btn.onclick = agregarProducto;
}

// 7. MANUALES DINÁMICOS
function configurarManual(tipo) {
    const titulo = document.getElementById("manualTitulo");
    const cuerpo = document.getElementById("manualCuerpo");

    const contenidos = {
    "tecnico": {
        titulo: "🛠️ Manual Técnico de Arquitectura",
        cuerpo: `
            <p><b>Arquitectura del Sistema:</b> Basada en el stack <b>MERN-lite</b> (MongoDB, Express/Flask, JS nativo). Utiliza una estructura de microservicios para el manejo de datos.</p>
            <br>
            <p><b>Componentes Clave:</b></p>
            <ul>
                <li><b>Base de Datos:</b> Cluster en la nube con MongoDB Atlas utilizando documentos JSON.</li>
                <li><b>Backend:</b> API REST desarrollada en Flask con manejo de CORS y serialización de objetos.</li>
                <li><b>Frontend:</b> Interfaz dinámica con manipulacion del DOM y persistencia local mediante LocalStorage.</li>
            </ul>
            <br>
            <p><b>Endpoints Habilitados:</b> GET (Lectura), POST (Creación), PUT (Actualización) y DELETE (Eliminación) sobre la ruta <code>/productos</code>.</p>
        `
    },
    "usuario_invitado": {
        titulo: "📖 Guía de Navegación para Visitantes",
        cuerpo: `
            <p>¡Bienvenido a <b>ShopSystem</b>! Actualmente estás navegando en modo lectura.</p>
            <br>
            <p><b>¿Qué puedes hacer?</b></p>
            <ul>
                <li>Explorar nuestro catálogo de productos en tiempo real.</li>
                <li>Visualizar precios actualizados y disponibilidad.</li>
            </ul>
            <br>
            <p>Para poder agregar artículos a tu carrito de compras y realizar pedidos, por favor utiliza los botones de la parte superior para <b>Iniciar Sesión</b> o <b>Crear una cuenta nueva</b> en pocos segundos.</p>
        `
    },
    "usuario_cliente": {
        titulo: "🛍️ Panel de Ayuda para Clientes",
        cuerpo: `
            <p>¡Hola! Has iniciado sesión correctamente. Ahora tienes acceso total a las funciones de compra.</p>
            <br>
            <p><b>Instrucciones de Compra:</b></p>
            <ol>
                <li>Navega por la tabla de productos y haz clic en el botón <b> Comprar</b> para añadir items.</li>
                <li>Revisa tu selección haciendo clic en el <b>botón flotante verde</b> ubicado en la esquina inferior izquierda.</li>
                <li>Desde el carrito modal, puedes eliminar productos o confirmar tu pedido final.</li>
            </ol>
            <br>
            <p><i>Nota: Tu sesión permanecerá activa hasta que decidas usar el botón de "Cerrar Sesión".</i></p>
        `
    }
};

    if(titulo && cuerpo) {
        titulo.innerText = contenidos[tipo].titulo;
        cuerpo.innerHTML = contenidos[tipo].cuerpo;
    }
    document.getElementById("btnManual").onclick = () => abrirModal('modalManual');
}

function logout() {
    localStorage.removeItem("usuarioActual");
    window.location.reload();
}