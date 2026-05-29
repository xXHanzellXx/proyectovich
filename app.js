const API_PRODUCTOS = "https://proyectovich.onrender.com/productos";
let carrito = [];

// CONFIGURACIÓN DE LÍMITES GLOBAL
const MAX_PRODUCTOS_CARRITO = 35; // <-- Configurado a 35 artículos máximos en total

// INICIALIZACIÓN
window.onload = () => {
    verificarSesion();
    obtenerProductos();
};

// GESTIÓN DE MODALES (Centrado Flex)
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

// CONTROL DE SESIÓN Y ROLES
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

// CATÁLOGO: OBTENER PRODUCTOS (Con soporte para Stock)
function obtenerProductos() {
    fetch(API_PRODUCTOS)
    .then(res => res.json())
    .then(data => {
        const tabla = document.getElementById("cuerpoTabla");
        if (!tabla) return;
        
        const user = JSON.parse(localStorage.getItem("usuarioActual"));
        const rol = user ? user.rol : "invitado";
        
        tabla.innerHTML = "";
        
        if (!Array.isArray(data)) {
            console.error("La API no devolvió un arreglo válido de productos:", data);
            return;
        }

        data.forEach(p => {
            let acciones = "";
            const cat = p.categoria || "General";
            
            const stockDisponible = p.stock !== undefined ? p.stock : 10; 

            if (rol === "admin") {
                acciones = `
                    <button class="btn-edit" onclick="prepararEdicion('${p._id}', '${p.nombre}', ${p.precio}, '${cat}', ${stockDisponible})">✏️</button>
                    <button class="btn-delete" onclick="eliminarProducto('${p._id}')">🗑️</button>
                `;
            } else {
                if (stockDisponible <= 0) {
                    acciones = `<span style="color: red; font-weight: bold;">Agotado ❌</span>`;
                } else {
                    acciones = `
                        <div class="flex gap-2 items-center">
                            <input type="number" id="cant-${p._id}" value="1" min="1" max="${stockDisponible}" style="width: 55px;">
                            <button class="btn-add-cart" onclick="agregarVarios('${p._id}', '${p.nombre}', ${p.precio}, ${stockDisponible})"> Añadir</button>
                        </div>
                    `;
                }
            }

            tabla.innerHTML += `
                <tr>
                    <td data-label="Producto / Categoría">
                        <span class="category-tag" style="display:block; font-size:10px; color:var(--primary-glow); font-weight:bold; text-transform:uppercase;">${cat}</span>
                        <b>${p.nombre}</b>
                        <small style="display:block; color: gray;">Stock disponible: ${stockDisponible}</small>
                    </td>
                    <td data-label="Precio">₡${p.precio}</td>
                    <td data-label="Acciones / Cantidad">${acciones}</td>
                </tr>
            `;
        });
    })
    .catch(err => console.error("Error al obtener productos:", err));
}

// CARRITO (Con validación de Stock y Límite de Carrito)
function agregarVarios(id, nombre, precio, stockDisponible) {
    const user = localStorage.getItem("usuarioActual");
    if (!user) {
        alert("Debes iniciar sesión para comprar.");
        window.location.href = "login.html";
        return;
    }

    const inputCantidad = document.getElementById(`cant-${id}`);
    const cantidadSolicitada = parseInt(inputCantidad.value);

    if (isNaN(cantidadSolicitada) || cantidadSolicitada < 1) return;

    const yaEnCarrito = carrito.filter(item => item.id === id).length;
    
    if (yaEnCarrito + cantidadSolicitada > stockDisponible) {
        alert(`❌ No puedes agregar esa cantidad. Ya tienes ${yaEnCarrito} en el carrito y el stock máximo es de ${stockDisponible}.`);
        return;
    }

    if (carrito.length + cantidadSolicitada > MAX_PRODUCTOS_CARRITO) {
        alert(`⚠️ El carrito no puede superar los ${MAX_PRODUCTOS_CARRITO} productos en total. Espacio disponible: ${MAX_PRODUCTOS_CARRITO - carrito.length}`);
        return;
    }

    for (let i = 0; i < cantidadSolicitada; i++) {
        carrito.push({ id, nombre, precio }); 
    }

    actualizarInterfazCarrito();
    alert(`Agregado: ${nombre} (x${cantidadSolicitada}) 🛒`);
    inputCantidad.value = 1;
}

function actualizarInterfazCarrito() {
    const lista = document.getElementById("listaCarrito");
    const contador = document.getElementById("contadorCarrito");
    const totalSpan = document.getElementById("totalCarrito");

    if (contador) contador.innerText = carrito.length;
    if (!lista) return;

    lista.innerHTML = "";
    let total = 0;

    if (carrito.length === 0) {
        lista.innerHTML = "<p class='text-muted'>El carrito está vacío.</p>";
    } else {
        carrito.forEach((item, index) => {
            total += item.precio;
            lista.innerHTML += `
                <div class="item-carrito" style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-glow);">
                    <span>${item.nombre}</span>
                    <span><b>₡${item.precio}</b> <button onclick="eliminarDelCarrito(${index})" style="background:none; color:red; margin-left:8px; border:none; cursor:pointer;">✕</button></span>
                </div>
            `;
        });
    }
    if (totalSpan) totalSpan.innerText = `₡${total}`;
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarInterfazCarrito();
}

// PROCESAR COMPRA Y DISMINUIR STOCK REAL
async function finalizarCompra() {
    if (carrito.length === 0) return alert("El carrito está vacío.");
    
    // 1. Agrupar cantidades pedidas por ID de producto
    const conteoCompra = {};
    carrito.forEach(item => {
        conteoCompra[item.id] = (conteoCompra[item.id] || 0) + 1;
    });

    try {
        // Bloqueo temporal del botón para evitar clicks fantasma
        const btnFinalizar = document.querySelector("#modalCarrito .btn-primary");
        if (btnFinalizar) {
            btnFinalizar.disabled = true;
            btnFinalizar.innerText = "Procesando pedido... ⏳";
        }

        // 2. Traer el stock fresco directo desde el servidor
        const response = await fetch(API_PRODUCTOS);
        const productosBackend = await response.json();

        // 3. Iterar y actualizar cada producto que está en el carrito
        for (const idProducto in conteoCompra) {
            const cantidadComprada = conteoCompra[idProducto];
            const productoReal = productosBackend.find(p => p._id === idProducto);
            
            if (productoReal) {
                const stockActual = productoReal.stock !== undefined ? productoReal.stock : 10;
                const nuevoStock = Math.max(0, stockActual - cantidadComprada);

                // Mandar la petición PUT para actualizar MongoDB de forma permanente
                await fetch(`${API_PRODUCTOS}/${idProducto}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        nombre: productoReal.nombre,
                        precio: parseFloat(productoReal.precio),
                        categoria: productoReal.categoria || "General",
                        stock: parseInt(nuevoStock)
                    })
                });
            }
        }

        alert("🚀 ¡Pedido confirmado! El inventario se ha actualizado en la base de datos.");
        carrito = [];
        actualizarInterfazCarrito();
        cerrarModal('modalCarrito');
        obtenerProductos(); // Redibuja el catálogo con los nuevos stocks disminuidos

    } catch (error) {
        console.error("Error al descontar stock:", error);
        alert("❌ Ocurrió un error al procesar el stock. Inténtalo de nuevo.");
    } finally {
        const btnFinalizar = document.querySelector("#modalCarrito .btn-primary");
        if (btnFinalizar) {
            btnFinalizar.disabled = false;
            btnFinalizar.innerText = "Finalizar Compra";
        }
    }
}

// CRUD ADMINISTRADOR (Con soporte para modificar Stock)
function agregarProducto() {
    const nombre = document.getElementById("nombre").value;
    const precio = document.getElementById("precio").value;
    const categoria = document.getElementById("categoria").value;
    const stock = document.getElementById("stock") ? document.getElementById("stock").value : 10;

    if (!nombre || !precio) return alert("Completa los campos");

    fetch(API_PRODUCTOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, precio: parseFloat(precio), categoria, stock: parseInt(stock) })
    })
    .then(res => {
        if (!res.ok) throw new Error("Error al guardar producto");
        return res.json();
    })
    .then(() => {
        obtenerProductos();
        resetFormulario();
    })
    .catch(err => alert(err.message));
}

function eliminarProducto(id) {
    if (confirm("¿Seguro que deseas eliminarlo?")) {
        fetch(`${API_PRODUCTOS}/${id}`, { method: "DELETE" })
        .then(() => obtenerProductos())
        .catch(err => console.error("Error al eliminar:", err));
    }
}

function prepararEdicion(id, nombre, precio, categoria, stock) {
    document.getElementById("nombre").value = nombre;
    document.getElementById("precio").value = precio;
    document.getElementById("categoria").value = categoria;
    
    if (document.getElementById("stock")) {
        document.getElementById("stock").value = stock;
    }

    const btn = document.getElementById("btnPrincipal");
    if (btn) {
        btn.innerText = "Actualizar Producto";
        btn.onclick = () => enviarEdicion(id);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function enviarEdicion(id) {
    const nombre = document.getElementById("nombre").value;
    const precio = document.getElementById("precio").value;
    const categoria = document.getElementById("categoria").value;
    const stock = document.getElementById("stock") ? parseInt(document.getElementById("stock").value) : 10;

    fetch(`${API_PRODUCTOS}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, precio: parseFloat(precio), categoria, stock })
    })
    .then(() => {
        alert("Actualizado ✅");
        resetFormulario();
        obtenerProductos();
    })
    .catch(err => console.error("Error al actualizar:", err));
}

// MANUALES DINÁMICOS Y OTROS
function configurarManual(tipo) {
    const titulo = document.getElementById("manualTitulo");
    const cuerpo = document.getElementById("manualCuerpo");
    const contenidos = {
        "tecnico": {
            titulo: "🛠️ Manual Técnico de Arquitectura",
            cuerpo: `<p><b>Arquitectura del Sistema:</b> MERN-lite...</p>`
        },
        "usuario_invitado": {
            titulo: "📖 Guía de Navegación para Visitantes",
            cuerpo: `<p>¡Bienvenido a <b>ShopSystem</b>!...</p>`
        },
        "usuario_cliente": {
            titulo: "🛍️ Panel de Ayuda para Clientes",
            cuerpo: `<p>¡Hola! Has iniciado sesión correctamente...</p>`
        }
    };

    if (titulo && cuerpo && contenidos[tipo]) {
        titulo.innerText = contenidos[tipo].titulo;
        cuerpo.innerHTML = contenidos[tipo].cuerpo;
    }
    
    const btnManual = document.getElementById("btnManual");
    if (btnManual) {
        btnManual.onclick = () => abrirModal('modalManual');
    }
}

function resetFormulario() {
    document.getElementById("nombre").value = "";
    document.getElementById("precio").value = "";
    document.getElementById("categoria").value = "General";
    if (document.getElementById("stock")) document.getElementById("stock").value = "10";
    
    const btn = document.getElementById("btnPrincipal");
    if (btn) {
        btn.innerText = "Añadir Producto";
        btn.onclick = agregarProducto;
    }
}

function logout() {
    localStorage.removeItem("usuarioActual");
    window.location.reload();
}
