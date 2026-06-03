const API_PRODUCTOS = "https://proyectovich.onrender.com/productos";
function obtenerUsuarioActual() {
  return JSON.parse(localStorage.getItem("usuarioActual"));
}

function obtenerClaveCarrito() {
  const usuario = obtenerUsuarioActual();

  if (!usuario) {
    return "carrito_invitado";
  }

  return `carrito_${usuario.usuario}`;
}

let carrito = JSON.parse(localStorage.getItem(obtenerClaveCarrito())) || [];

function guardarCarrito() {
  localStorage.setItem(obtenerClaveCarrito(), JSON.stringify(carrito));
}

// CONFIGURACIÓN DE LÍMITES GLOBAL
const MAX_PRODUCTOS_CARRITO = 35;

// INICIALIZACIÓN
window.onload = () => {
  verificarSesion();
  cargarCarrito();
  obtenerProductos();
  configurarBuscador();
  cargarDashboardAdmin();
};

// GESTIÓN DE MODALES
function abrirModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("active");
}

function cerrarModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("active");
}

window.onclick = (e) => {
  if (e.target.classList.contains("modal")) {
    e.target.classList.remove("active");
  }
};

// CONTROL DE SESIÓN, ROLES Y NOMBRE ACTIVO
function verificarSesion() {
  const user = JSON.parse(localStorage.getItem("usuarioActual"));
  const btnLogout = document.getElementById("btnLogut");
  const btnLoginNav = document.getElementById("btnLoginNav");
  const btnRegNav = document.getElementById("btnRegistroNav");
  const seccionAdmin = document.getElementById("seccionAdmin");
  const infoUsuario = document.getElementById("infoUsuario"); // <-- NUEVO: Contenedor para el nombre
  const btnHistorial = document.getElementById("btnHistorial");

  if (user) {
    if (btnLoginNav) btnLoginNav.style.display = "none";
    if (btnRegNav) btnRegNav.style.display = "none";
    if (btnLogout) btnLogout.style.display = "block";

    // Muestra el nombre del usuario activo si existe el elemento en el HTML
    if (infoUsuario) {
      infoUsuario.style.display = "inline-block";
      infoUsuario.innerHTML = `
    <img
        src="${user.imagen || "https://placehold.co/40"}"
        class="foto-usuario"
    >

    <div>
        <b>${user.nombre}</b><br>
        <small>${user.correo}</small>
    </div>
`;
    }

    if (user.rol === "admin") {
      if (seccionAdmin) seccionAdmin.style.display = "block";

      if (btnHistorial) btnHistorial.style.display = "none";

      configurarManual("tecnico");
    } else {
      if (btnHistorial) btnHistorial.style.display = "inline-block";

      configurarManual("usuario_cliente");
    }
  } else {
    if (btnLoginNav) btnLoginNav.style.display = "inline-block";
    if (btnRegNav) btnRegNav.style.display = "inline-block";
    if (btnLogout) btnLogout.style.display = "none";
    if (infoUsuario) infoUsuario.style.display = "none";
    if (btnHistorial) btnHistorial.style.display = "none";
    configurarManual("usuario_invitado");
  }
}

// NUEVO: BUSCADOR Y FILTRO DE CATEGORÍAS
function configurarBuscador() {
  const inputBuscar = document.getElementById("inputBuscar");
  const selectCategoria = document.getElementById("selectCategoria");

  const filtrar = () => {
    const tBusqueda = inputBuscar ? inputBuscar.value.toLowerCase() : "";
    const tCategoria = selectCategoria ? selectCategoria.value : "Todos";
    const filas = document.querySelectorAll("#cuerpoTabla tr");

    filas.forEach((fila) => {
      const nombre = fila.querySelector("b")
        ? fila.querySelector("b").innerText.toLowerCase()
        : "";
      const categoria = fila.querySelector(".category-tag")
        ? fila.querySelector(".category-tag").innerText.toLowerCase()
        : "";

      const coincideBusqueda = nombre.includes(tBusqueda);
      const coincideCategoria =
        tCategoria === "Todos" || categoria === tCategoria.toLowerCase();

      if (coincideBusqueda && coincideCategoria) {
        fila.style.display = "";
      } else {
        fila.style.display = "none";
      }
    });
  };

  if (inputBuscar) inputBuscar.oninput = filtrar;
  if (selectCategoria) selectCategoria.onchange = filtrar;
}

// CATÁLOGO: OBTENER PRODUCTOS
function obtenerProductos() {
  fetch(API_PRODUCTOS)
    .then((res) => res.json())
    .then((data) => {
      const tabla = document.getElementById("cuerpoTabla");
      if (!tabla) return;

      const user = JSON.parse(localStorage.getItem("usuarioActual"));
      const rol = user ? user.rol : "invitado";

      tabla.innerHTML = "";

      if (!Array.isArray(data)) return;

      data.forEach((p) => {
        let acciones = "";
        const cat = p.categoria || "General";
        const stockDisponible = p.stock !== undefined ? p.stock : 10;

        if (rol === "admin") {
          acciones = `
                    <button class="btn-edit" onclick="prepararEdicion(
'${p._id}',
'${p.nombre}',
${p.precio},
'${cat}',
${stockDisponible},
'${p.imagen || ""}'
)">✏️</button>
                    <button class="btn-delete" onclick="eliminarProducto('${p._id}')">🗑️</button>
                `;
        } else {
          if (stockDisponible <= 0) {
            acciones = `<span style="color: red; font-weight: bold;">Agotado ❌</span>`;
          } else {
            acciones = `
                        <div class="flex gap-2 items-center">
                            <input type="number" id="cant-${p._id}" value="1" min="1" max="${stockDisponible}" style="width: 55px;">
                            <button class="btn-add-cart" onclick="agregarVarios('${p._id}', '${p.nombre}', ${p.precio}, ${stockDisponible},'${p.imagen || ""}')"> Añadir</button>
                        </div>
                    `;
          }
        }

        // SOPORTE PARA IMAGEN: Si el producto tiene p.imagen la usa, si no, usa una por defecto
        const urlImagen = p.imagen || "https://placehold.co/50x50?text=📦";

        tabla.innerHTML += `
                <tr>
                    <td data-label="Producto / Categoría">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="${urlImagen}" alt="${p.nombre}" class="img-producto-tabla" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                            <div>
                                <span class="category-tag" style="display:block; font-size:10px; color:var(--primary-glow); font-weight:bold; text-transform:uppercase;">${cat}</span>
                                <b>${p.nombre}</b>
                                <small style="display:block; color: gray;">Stock disponible: ${stockDisponible}</small>
                            </div>
                        </div>
                    </td>
                    <td data-label="Precio">₡${p.precio}</td>
                    <td data-label="Acciones / Cantidad">${acciones}</td>
                </tr>
            `;
      });
    })
    .catch((err) => console.error("Error al obtener productos:", err));
}

// CARRITO MODIFICADO (Guarda objetos con cantidad integrada)
function agregarVarios(id, nombre, precio, stockDisponible, imagen) {
  const user = localStorage.getItem("usuarioActual");
  if (!user) {
    alert("Debes iniciar sesión para comprar.");
    window.location.href = "login.html";
    return;
  }

  const inputCantidad = document.getElementById(`cant-${id}`);
  const cantidadSolicitada = parseInt(inputCantidad.value);

  if (isNaN(cantidadSolicitada) || cantidadSolicitada < 1) return;

  // Contar cuántos de este producto ya hay en el carrito acumulados
  const productoEnCarrito = carrito.find((item) => item.id === id);
  const yaEnCarrito = productoEnCarrito ? productoEnCarrito.cantidad : 0;

  if (yaEnCarrito + cantidadSolicitada > stockDisponible) {
    alert(
      `❌ No puedes agregar esa cantidad. Ya tienes ${yaEnCarrito} en el carrito y el stock máximo es de ${stockDisponible}.`,
    );
    return;
  }

  // Contar el TOTAL de artículos en el carrito sumando sus cantidades individuales
  const totalArticulos = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  if (totalArticulos + cantidadSolicitada > MAX_PRODUCTOS_CARRITO) {
    alert(
      `⚠️ El carrito no puede superar los ${MAX_PRODUCTOS_CARRITO} productos en total. Espacio disponible: ${MAX_PRODUCTOS_CARRITO - totalArticulos}`,
    );
    return;
  }

  // SI YA EXISTE, SE SUMA LA CANTIDAD. SI NO, SE AGREGA NUEVO OBJETO
  if (productoEnCarrito) {
    productoEnCarrito.cantidad += cantidadSolicitada;
  } else {
    carrito.push({
      id,
      nombre,
      precio,
      cantidad: cantidadSolicitada,
      imagen,
    });
  }

  guardarCarrito();
  actualizarInterfazCarrito();

  alert(`Agregado: ${nombre} (x${cantidadSolicitada}) 🛒`);
  inputCantidad.value = 1;
}

// INTERFAZ DEL CARRITO AGRUPADO
function actualizarInterfazCarrito() {
  const lista = document.getElementById("listaCarrito");
  const contador = document.getElementById("contadorCarrito");
  const totalSpan = document.getElementById("totalCarrito");

  const totalArticulos = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  if (contador) contador.innerText = totalArticulos;
  if (!lista) return;

  lista.innerHTML = "";
  let total = 0;

  if (carrito.length === 0) {
    lista.innerHTML = "<p class='text-muted'>El carrito está vacío.</p>";
  } else {
    carrito.forEach((item, index) => {
      const subtotalItem = item.precio * item.cantidad;
      total += subtotalItem;
      lista.innerHTML += `
                <div class="item-carrito" style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-glow); align-items: center;">
                    <div style="display:flex;align-items:center;gap:10px;">
  <img
    src="${item.imagen || "https://placehold.co/50x50"}"
    style="
      width:45px;
      height:45px;
      object-fit:cover;
      border-radius:6px;
    "
  >

  <span>
    ${item.nombre}
    <b>(x${item.cantidad})</b>
  </span>
</div>
                    <span><b>₡${subtotalItem}</b> <button onclick="eliminarDelCarrito(${index})" style="background:none; color:red; margin-left:8px; border:none; cursor:pointer;">✕</button></span>
                </div>
            `;
    });
  }
  if (totalSpan) totalSpan.innerText = `₡${total}`;
}

function eliminarDelCarrito(index) {
  carrito.splice(index, 1);

  guardarCarrito();
  actualizarInterfazCarrito();
}

// FINALIZAR COMPRA ACTUALIZADO
async function finalizarCompra() {
  if (carrito.length === 0) return alert("El carrito está vacío.");

  try {
    const btnFinalizar = document.querySelector("#modalCarrito .btn-primary");
    if (btnFinalizar) {
      btnFinalizar.disabled = true;
      btnFinalizar.innerText = "Procesando pedido... ⏳";
    }

    const response = await fetch(API_PRODUCTOS);
    const productosBackend = await response.json();

    for (const item of carrito) {
      const productoReal = productosBackend.find((p) => p._id === item.id);

      if (productoReal) {
        const stockActual =
          productoReal.stock !== undefined ? productoReal.stock : 10;
        const nuevoStock = Math.max(0, stockActual - item.cantidad);

        await fetch(`${API_PRODUCTOS}/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: productoReal.nombre,
            precio: parseFloat(productoReal.precio),
            categoria: productoReal.categoria || "General",
            stock: parseInt(nuevoStock),
            imagen: productoReal.imagen || "", // No perder la imagen al editar
          }),
        });
      }
    }

    alert(
      "🚀 ¡Pedido confirmado! El inventario se ha actualizado en la base de datos.",
    );
    guardarCompraHistorial();

    carrito = [];

    guardarCarrito();
    actualizarInterfazCarrito();
    cerrarModal("modalCarrito");
    obtenerProductos();
  } catch (error) {
    console.error(error);

    alert("ERROR:\n" + error.message + "\n\nRevisa la consola (F12)");
  } finally {
    const btnFinalizar = document.querySelector("#modalCarrito .btn-primary");
    if (btnFinalizar) {
      btnFinalizar.disabled = false;
      btnFinalizar.innerText = "Finalizar Compra";
    }
  }
}

// CRUD ADMINISTRADOR
async function agregarProducto() {
  const nombre = document.getElementById("nombre").value;
  const precio = document.getElementById("precio").value;
  const categoria = document.getElementById("categoria").value;
  const stock = document.getElementById("stock").value;

  const archivo = document.getElementById("imagen").files[0];

  if (!nombre || !precio) {
    return alert("Completa los campos");
  }

  let imagenBase64 = "";

  if (archivo) {
    imagenBase64 = await convertirABase64(archivo);
  }
  console.log(imagenBase64);

  fetch(API_PRODUCTOS, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nombre,
      precio: parseFloat(precio),
      categoria,
      stock: parseInt(stock),
      imagen: imagenBase64,
    }),
  })
    .then((res) => res.json())
    .then(() => {
      obtenerProductos();
      resetFormulario();
      alert("Producto agregado ✅");
    })
    .catch((err) => {
      console.error(err);
      alert("Error al agregar producto");
    });
}

function convertirABase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = (error) => {
      reject(error);
    };
  });
}

function eliminarProducto(id) {
  if (confirm("¿Seguro que deseas eliminarlo?")) {
    fetch(`${API_PRODUCTOS}/${id}`, { method: "DELETE" })
      .then(() => obtenerProductos())
      .catch((err) => console.error("Error al eliminar:", err));
  }
}

function prepararEdicion(id, nombre, precio, categoria, stock, imagen) {
  document.getElementById("nombre").value = nombre;
  document.getElementById("precio").value = precio;
  document.getElementById("categoria").value = categoria;

  if (document.getElementById("stock"))
    document.getElementById("stock").value = stock;
  if (document.getElementById("imagen")) {
    document.getElementById("imagen").value = "";
  } // <-- NUEVO

  const btn = document.getElementById("btnPrincipal");
  if (btn) {
    btn.innerText = "Actualizar Producto";
    btn.onclick = () => enviarEdicion(id);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function enviarEdicion(id) {
  const nombre = document.getElementById("nombre").value;
  const precio = document.getElementById("precio").value;
  const categoria = document.getElementById("categoria").value;

  const stock = document.getElementById("stock")
    ? parseInt(document.getElementById("stock").value)
    : 10;

  const archivo = document.getElementById("imagen").files[0];

  let imagenBase64 = "";

  if (archivo) {
    imagenBase64 = await convertirABase64(archivo);
  }

  fetch(`${API_PRODUCTOS}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nombre,
      precio: parseFloat(precio),
      categoria,
      stock,
      imagen: imagenBase64,
    }),
  })
    .then(() => {
      alert("Actualizado ✅");
      resetFormulario();
      obtenerProductos();
    })
    .catch((err) => {
      console.error("Error al actualizar:", err);
      alert("Error al actualizar");
    });
}

// MANUALES DINÁMICOS
function configurarManual(tipo) {
  const titulo = document.getElementById("manualTitulo");
  const cuerpo = document.getElementById("manualCuerpo");
  const contenidos = {
    tecnico: {
      titulo: "🛠️ Manual Técnico de Arquitectura",
      cuerpo: `<p><b>Arquitectura del Sistema:</b> MERN-lite...</p>`,
    },
    usuario_invitado: {
      titulo: "📖 Guía de Navegación para Visitantes",
      cuerpo: `<p>¡Bienvenido a <b>ShopSystem</b>!...</p>`,
    },
    usuario_cliente: {
      titulo: "🛍️ Panel de Ayuda para Clientes",
      cuerpo: `<p>¡Hola! Has iniciado sesión correctamente...</p>`,
    },
  };

  if (titulo && cuerpo && contenidos[tipo]) {
    titulo.innerText = contenidos[tipo].titulo;
    cuerpo.innerHTML = contenidos[tipo].cuerpo;
  }

  const btnManual = document.getElementById("btnManual");
  if (btnManual) {
    btnManual.onclick = () => abrirModal("modalManual");
  }
}

function resetFormulario() {
  document.getElementById("nombre").value = "";
  document.getElementById("precio").value = "";
  document.getElementById("categoria").value = "General";
  if (document.getElementById("stock"))
    document.getElementById("stock").value = "10";
  if (document.getElementById("imagen"))
    document.getElementById("imagen").value = "";

  const btn = document.getElementById("btnPrincipal");
  if (btn) {
    btn.innerText = "Añadir Producto";
    btn.onclick = agregarProducto;
  }
}

function obtenerUsuarioActual() {
  const user = JSON.parse(localStorage.getItem("usuarioActual"));

  if (!user) return null;

  return user.usuario;
}

function obtenerClaveCarrito() {
  const usuario = obtenerUsuarioActual();

  if (!usuario) return "carrito_invitado";

  return `carrito_${usuario}`;
}

function guardarCarrito() {
  localStorage.setItem(obtenerClaveCarrito(), JSON.stringify(carrito));
}

function cargarCarrito() {
  const datos = localStorage.getItem(obtenerClaveCarrito());

  carrito = datos ? JSON.parse(datos) : [];

  actualizarInterfazCarrito();
}

function logout() {
  localStorage.removeItem("usuarioActual");

  carrito = [];

  actualizarInterfazCarrito();

  window.location.reload();
}

function guardarCompraHistorial() {
  const usuario = obtenerUsuarioActual();

  if (!usuario) return;

  const clave = `historial_${usuario}`;

  const historial = JSON.parse(localStorage.getItem(clave)) || [];

  const total = carrito.reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0,
  );

  historial.push({
    fecha: new Date().toLocaleString(),
    total,
    productos: [...carrito],
  });

  localStorage.setItem(clave, JSON.stringify(historial));
}

function obtenerHistorialCompras() {
  const usuario = obtenerUsuarioActual();

  if (!usuario) return [];

  return JSON.parse(localStorage.getItem(`historial_${usuario}`)) || [];
}

function mostrarHistorial() {
  const historial = obtenerHistorialCompras();

  if (historial.length === 0) {
    alert("No hay compras registradas.");
    return;
  }

  const contenedor = document.getElementById("contenidoHistorial");

  let html = "";

  historial.forEach((compra, index) => {
    html += `
      <div class="historial-compra">
        <h3>Compra #${index + 1}</h3>

        <p>
          <strong>Fecha:</strong>
          ${compra.fecha}
        </p>

        <p>
          <strong>Total:</strong>
          ₡${compra.total.toLocaleString()}
        </p>

        <div class="historial-productos">
    `;

    compra.productos.forEach((p) => {
      html += `
        <div class="producto-historial">
          <img
            src="${p.imagen || "https://placehold.co/60x60"}"
            alt="${p.nombre}"
          >

          <div>
            <strong>${p.nombre}</strong><br>
            Cantidad: ${p.cantidad}
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  contenedor.innerHTML = html;

  abrirModal("modalHistorial");
}

async function cargarDashboardAdmin() {
  const user = JSON.parse(localStorage.getItem("usuarioActual"));

  if (!user || user.rol !== "admin") return;

  try {
    const productos = await fetch(API_PRODUCTOS).then((r) => r.json());

    document.getElementById("totalProductos").innerText = productos.length;

    let totalUsuarios = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const clave = localStorage.key(i);

      if (clave.startsWith("historial_")) {
        totalUsuarios++;
      }
    }

    document.getElementById("totalUsuarios").innerText = totalUsuarios;

    let compras = 0;
    let ventas = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const clave = localStorage.key(i);

      if (clave.startsWith("historial_")) {
        const historial = JSON.parse(localStorage.getItem(clave));

        compras += historial.length;

        historial.forEach((c) => {
          ventas += c.total;
        });
      }
    }

    document.getElementById("totalCompras").innerText = compras;

    document.getElementById("totalVentas").innerText =
      `₡${ventas.toLocaleString()}`;
  } catch (error) {
    console.error("Error dashboard:", error);
  }
}
