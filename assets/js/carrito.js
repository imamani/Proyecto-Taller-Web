
const CLAVE_CARRITO = "carritoSalvaComida";

const CATALOGO_PRODUCTOS = {
    ceviche_mixto: { nombre: "Ceviche Mixto", precio: 30.00, imagen: "cevichemixto.webp", categoria: "menu", restaurante: "Sabor Peruano", descripcion: "Pescado fresco y mariscos en leche de tigre." },
    aji_gallina: { nombre: "Ají de Gallina", precio: 18.00, imagen: "ajidegallina.webp", categoria: "menu", restaurante: "Sabor Peruano", descripcion: "Cremoso ají de gallina tradicional." },
    arroz_chaufa: { nombre: "Arroz Chaufa", precio: 20.00, imagen: "ArrozChaufa.webp", categoria: "menu", restaurante: "Sabor Peruano", descripcion: "Arroz chaufa salteado al wok." },
    causa_limena: { nombre: "Causa Limeña", precio: 12.00, imagen: "causa-limena.webp", categoria: "entradas", restaurante: "Sabor Peruano", descripcion: "Causa rellena de pollo con palta." },
    tequenos: { nombre: "Tequeños", precio: 10.00, imagen: "tequenos.webp", categoria: "entradas", restaurante: "El Buen Sabor", descripcion: "Crujientes tequeños rellenos de queso." },
    jugo_maracuya: { nombre: "Jugo Maracuyá", precio: 7.00, imagen: "jugomaracuya.webp", categoria: "bebidas", restaurante: "Verde Vivo", descripcion: "Jugo de maracuyá 100% natural, refrescante." },
    pizza_hawaiana: { nombre: "Pizza Hawaiana", precio: 25.00, imagen: "pizzahawaiana.webp", categoria: "pasta", restaurante: "La Trattoria", descripcion: "Masa artesanal con jamón y piña." },
    lasagna_carne: { nombre: "Lasagna Carne", precio: 22.00, imagen: "lasagna.webp", categoria: "pasta", restaurante: "La Trattoria", descripcion: "Capas de pasta con salsa boloñesa." },
    picarones: { nombre: "Picarones", precio: 10.00, imagen: "picarones.webp", categoria: "postres", restaurante: "Sabor Peruano", descripcion: "Porción bañada en miel de chancaca." },
    helado_artesanal: { nombre: "Helado Artesanal", precio: 8.00, imagen: "heladoartesanal.webp", categoria: "postres", restaurante: "La Trattoria", descripcion: "Dos bolas de helado artesanal." },
    menu_dia: { nombre: "Menú del Día Completo", precio: 13.00, precio_original: 27.00, imagen: "menudeldia.webp", categoria: "oferta", restaurante: "Sabor Peruano", descripcion: "Sopa, segundo criollo y refresco. El menú más completo y nutritivo de Arequipa." },
    lomo_pasta: { nombre: "Lomo Saltado con Pasta", precio: 16.00, precio_original: 28.00, imagen: "Tallarin-Saltado.webp", categoria: "oferta", restaurante: "La Trattoria", descripcion: "Lomo saltado salteado con pasta al dente." },
    ensalada_cesar: { nombre: "Ensalada César Especial", precio: 12.00, precio_original: 22.00, imagen: "EnsaladaCesar.webp", categoria: "oferta", restaurante: "Verde Vivo", descripcion: "Clásica ensalada César con crutones y pollo." },
    pollo_brasa: { nombre: "Pollo a la Brasa", precio: 20.00, precio_original: 35.00, imagen: "Pollo-a-la-brasa.webp", categoria: "oferta", restaurante: "Sabor Peruano", descripcion: "Jugoso pollo a la brasa con papas fritas." },
    tiramisu: { nombre: "Tiramisú Artesanal", precio: 9.00, precio_original: 18.00, imagen: "tiramisu.webp", categoria: "oferta", restaurante: "La Trattoria", descripcion: "Clásico tiramisú italiano con cacao." },
    smoothie: { nombre: "Smoothie Verde Detox", precio: 7.00, precio_original: 14.00, imagen: "smoothieverde.webp", categoria: "oferta", restaurante: "Verde Vivo", descripcion: "Smoothie saludable de frutas y verduras verdes." },
    tallarines_verdes: { nombre: "Tallarines Verdes", precio: 18.00, precio_original: 26.00, imagen: "tallarinesverde.webp", categoria: "oferta", restaurante: "Sabor Peruano", descripcion: "Tallarines verdes acompañados con bistec." }
};

const ENTRO_DESDE_PAGINAS = window.location.pathname.includes("/pages/");
const RUTA_IMAGENES_CARRITO = ENTRO_DESDE_PAGINAS ? "../image/" : "image/";
const RUTA_FORM_PEDIDO_CARRITO = ENTRO_DESDE_PAGINAS ? "form_pedido.html" : "pages/form_pedido.html";

let mapaStockProductos = {};
let stockYaCargado = false;

let idsConNombreActualizado = [];

let idsConPrecioActualizado = [];

async function cargarStockGlobalDelCarrito() {
    if (typeof miSupabase === "undefined") return;
    try {
        let { data, error } = await miSupabase
            .from('productos')
            .select('id, nombre, precio, precio_original, stock_actual, imagen, categoria, restaurante, descripcion');

        if (error) {
            console.warn("No se pudo leer la columna 'precio_original' de la tabla 'productos'. Reintentando sin precio_original:", error.message);
            const respaldo = await miSupabase
                .from('productos')
                .select('id, nombre, precio, stock_actual, imagen, categoria, restaurante, descripcion');
            data = respaldo.data;
            error = respaldo.error;
        }

        if (!error && data) {
            data.forEach(p => {
                mapaStockProductos[p.id] = parseInt(p.stock_actual) || 0;

                // Si el producto no existía en CATALOGO_PRODUCTOS, lo insertamos
                if (!CATALOGO_PRODUCTOS[p.id]) {
                    CATALOGO_PRODUCTOS[p.id] = {
                        nombre: p.nombre || "Producto nuevo",
                        precio: parseFloat(p.precio) || 0.00,
                        precio_original: parseFloat(p.precio_original) || parseFloat(p.precio) || 0.00,
                        imagen: p.imagen || "default.jpg",
                        categoria: p.categoria || "otros",
                        restaurante: p.restaurante || "SalvaComida",
                        descripcion: p.descripcion || ""
                    };
                } else {
                    // Si ya existía, actualizamos sus campos con la base de datos
                    const nombreDeLaBD = (p.nombre || "").trim();
                    if (nombreDeLaBD && CATALOGO_PRODUCTOS[p.id].nombre !== nombreDeLaBD) {
                        CATALOGO_PRODUCTOS[p.id].nombre = nombreDeLaBD;
                        idsConNombreActualizado.push(p.id);
                    }

                    const precioDeLaBD = parseFloat(p.precio);
                    if (!isNaN(precioDeLaBD) && CATALOGO_PRODUCTOS[p.id].precio !== precioDeLaBD) {
                        CATALOGO_PRODUCTOS[p.id].precio = precioDeLaBD;
                        idsConPrecioActualizado.push(p.id);
                    }

                    const precioOriginalDeLaBD = parseFloat(p.precio_original);
                    if (!isNaN(precioOriginalDeLaBD)) {
                        CATALOGO_PRODUCTOS[p.id].precio_original = precioOriginalDeLaBD;
                    }

                    if (p.imagen) CATALOGO_PRODUCTOS[p.id].imagen = p.imagen;
                    if (p.categoria) CATALOGO_PRODUCTOS[p.id].categoria = p.categoria;
                    if (p.restaurante) CATALOGO_PRODUCTOS[p.id].restaurante = p.restaurante;
                    if (p.descripcion) CATALOGO_PRODUCTOS[p.id].descripcion = p.descripcion;
                }
            });
        }
    } catch (err) {
        console.error("No se pudo cargar el catálogo de productos ni el stock:", err);
    } finally {
        stockYaCargado = true;
        recortarCarritoAlStockDisponible();
        actualizarWidgetCarrito();
        document.dispatchEvent(new CustomEvent("stockCarritoListo"));
    }
}

function obtenerStockDisponible(idProducto) {
    if (!stockYaCargado) return Infinity; /* mientras carga, no bloqueamos la UI */
    return mapaStockProductos.hasOwnProperty(idProducto) ? mapaStockProductos[idProducto] : Infinity;
}

function recortarCarritoAlStockDisponible() {
    const carrito = obtenerCarrito();
    let seModifico = false;
    for (const id in carrito) {
        const stockDisponible = obtenerStockDisponible(id);
        if (carrito[id] > stockDisponible) {
            carrito[id] = stockDisponible;
            seModifico = true;
        }
        if (carrito[id] <= 0) {
            delete carrito[id];
            seModifico = true;
        }
    }
    if (seModifico) localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
}

function obtenerCarrito() {
    try {
        const guardado = localStorage.getItem(CLAVE_CARRITO);
        const carrito = guardado ? JSON.parse(guardado) : {};
        return (carrito && typeof carrito === "object") ? carrito : {};
    } catch (err) {
        console.error("No se pudo leer el carrito guardado, se reinicia:", err);
        return {};
    }
}

function guardarCarrito(carrito) {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
    document.dispatchEvent(new CustomEvent("carritoActualizado", { detail: carrito }));
    actualizarWidgetCarrito();
}

function agregarAlCarrito(idProducto, cantidad = 1) {
    if (!CATALOGO_PRODUCTOS[idProducto] || cantidad <= 0) return false;

    const carrito = obtenerCarrito();
    const stockDisponible = obtenerStockDisponible(idProducto);
    const cantidadActual = carrito[idProducto] || 0;
    let cantidadFinal = cantidadActual + cantidad;
    let superoStock = false;

    if (cantidadFinal > stockDisponible) {
        cantidadFinal = stockDisponible;
        superoStock = true;
        if (cantidadFinal <= cantidadActual) {
            mostrarAvisoCarrito(`⚠️ Solo tenemos ${stockDisponible} unidades de este producto`);
            return false;
        }
        mostrarAvisoCarrito(`⚠️ Solo tenemos ${stockDisponible} unidades de este producto, se ajustó tu cantidad`);
    }

    carrito[idProducto] = cantidadFinal;
    guardarCarrito(carrito);
    return !superoStock;
}

function establecerCantidadCarrito(idProducto, cantidad) {
    const carrito = obtenerCarrito();
    const stockDisponible = obtenerStockDisponible(idProducto);

    if (cantidad <= 0) {
        delete carrito[idProducto];
    } else {
        if (cantidad > stockDisponible) {
            cantidad = stockDisponible;
            mostrarAvisoCarrito(`⚠️ Solo tenemos ${stockDisponible} unidades de este producto`);
        }
        if (cantidad <= 0) {
            delete carrito[idProducto];
        } else {
            carrito[idProducto] = cantidad;
        }
    }
    guardarCarrito(carrito);
}

function quitarDelCarrito(idProducto) {
    const carrito = obtenerCarrito();
    delete carrito[idProducto];
    guardarCarrito(carrito);
}

function vaciarCarrito() {
    localStorage.removeItem(CLAVE_CARRITO);
    document.dispatchEvent(new CustomEvent("carritoActualizado", { detail: {} }));
    actualizarWidgetCarrito();
}

function totalUnidadesCarrito() {
    const carrito = obtenerCarrito();
    return Object.values(carrito).reduce((suma, cant) => suma + (parseInt(cant) || 0), 0);
}

function totalPrecioCarrito() {
    const carrito = obtenerCarrito();
    let total = 0;
    for (const id in carrito) {
        const producto = CATALOGO_PRODUCTOS[id];
        if (producto) total += producto.precio * carrito[id];
    }
    return total;
}

function crearWidgetCarrito() {
    const barra = document.querySelector(".barra-nav");
    if (!barra || document.getElementById("widget-carrito")) return;

    const contenedor = document.createElement("div");
    contenedor.id = "widget-carrito";
    contenedor.className = "widget-carrito";
    contenedor.innerHTML = `
        <button type="button" id="btn-carrito" class="btn-carrito" aria-label="Ver carrito de compras">
            🛒<span id="contador-carrito" class="contador-carrito" style="display:none;">0</span>
        </button>
        <div id="desplegable-carrito" class="desplegable-carrito">
            <div class="cabecera-desplegable-carrito">
                <h4>Tu carrito</h4>
                <button type="button" id="btn-vaciar-carrito" class="btn-vaciar-carrito">Vaciar</button>
            </div>
            <div id="items-carrito" class="items-carrito"></div>
            <div class="pie-desplegable-carrito">
                <div class="total-desplegable-carrito"><span>Total</span><span id="total-carrito">S/ 0.00</span></div>
                <a href="${RUTA_FORM_PEDIDO_CARRITO}" class="boton boton-primario boton-ancho">Ir a pagar</a>
            </div>
        </div>
    `;

    const listaNav = barra.querySelector(".lista-nav, .lista-nav-simple");
    if (listaNav) {
        barra.insertBefore(contenedor, listaNav);
    } else {
        barra.appendChild(contenedor);
    }

    document.getElementById("btn-carrito").addEventListener("click", (e) => {
        e.stopPropagation();
        document.getElementById("desplegable-carrito").classList.toggle("mostrar");
    });

    document.getElementById("btn-vaciar-carrito").addEventListener("click", (e) => {
        e.stopPropagation();
        if (totalUnidadesCarrito() === 0) return;
        if (confirm("¿Vaciar todo el carrito?")) vaciarCarrito();
    });

    /* Evita que un clic dentro del desplegable lo cierre */
    contenedor.addEventListener("click", (e) => e.stopPropagation());

    /* Cierra el desplegable al hacer clic en cualquier otro lugar de la página */
    document.addEventListener("click", () => {
        const desplegable = document.getElementById("desplegable-carrito");
        if (desplegable) desplegable.classList.remove("mostrar");
    });
}

function actualizarWidgetCarrito() {
    const contador = document.getElementById("contador-carrito");
    const contenedorItems = document.getElementById("items-carrito");
    const totalTexto = document.getElementById("total-carrito");
    if (!contador || !contenedorItems || !totalTexto) return;

    const carrito = obtenerCarrito();
    const idsEnCarrito = Object.keys(carrito).filter(id => carrito[id] > 0 && CATALOGO_PRODUCTOS[id]);
    const totalUnidades = totalUnidadesCarrito();

    // Animación física del contador para llamar la atención del usuario de forma amigable
    const cantidadAnterior = parseInt(contador.textContent) || 0;
    contador.textContent = totalUnidades;
    contador.style.display = totalUnidades > 0 ? "flex" : "none";

    if (totalUnidades !== cantidadAnterior && totalUnidades > 0) {
        contador.classList.remove("animar-contador");
        void contador.offsetWidth; // Forzar reflujo de renderizado en el navegador
        contador.classList.add("animar-contador");
    }

    if (idsEnCarrito.length === 0) {
        const rutaMenu = ENTRO_DESDE_PAGINAS ? "menu.html" : "pages/menu.html";
        contenedorItems.innerHTML = `
            <div style="text-align: center; padding: 25px 15px;">
                <p class="carrito-vacio" style="margin-bottom: 12px; color: #666; font-size: 14px;">Tu carrito está vacío</p>
                <a href="${rutaMenu}" class="boton boton-primario" style="font-size: 12px; padding: 8px 16px; border-radius: 8px; display: inline-block;">😋 ¡Ver el menú de hoy!</a>
            </div>
        `;
    } else {
        contenedorItems.innerHTML = idsEnCarrito.map(id => {
            const producto = CATALOGO_PRODUCTOS[id];
            const subtotal = (producto.precio * carrito[id]).toFixed(2);
            const stockDisponible = obtenerStockDisponible(id);
            const alcanzoElTope = carrito[id] >= stockDisponible;
            /* FIX #3 — Escapar nombre del producto antes de innerHTML */
            const nombreSeguro = typeof escapeHTML === 'function' ? escapeHTML(producto.nombre) : producto.nombre;
            return `
                <div class="item-carrito" data-id="${typeof escapeHTML === 'function' ? escapeHTML(id) : id}">
                    <img src="${RUTA_IMAGENES_CARRITO}${producto.imagen}" alt="${nombreSeguro}" class="item-carrito-img" loading="lazy">
                    <div class="item-carrito-info">
                        <p class="item-carrito-nombre">${nombreSeguro}</p>
                        <p class="item-carrito-precio">S/ ${producto.precio.toFixed(2)} c/u</p>
                    </div>
                    <div class="item-carrito-control">
                        <button type="button" class="btn-item-restar" data-id="${typeof escapeHTML === 'function' ? escapeHTML(id) : id}" aria-label="Quitar una unidad">-</button>
                        <span>${parseInt(carrito[id]) || 0}</span>
                        <button type="button" class="btn-item-sumar" data-id="${typeof escapeHTML === 'function' ? escapeHTML(id) : id}" aria-label="Agregar una unidad" ${alcanzoElTope ? "disabled" : ""}>+</button>
                    </div>
                    <span class="item-carrito-subtotal">S/ ${subtotal}</span>
                </div>
            `;
        }).join("");

        contenedorItems.querySelectorAll(".btn-item-sumar").forEach(btn => {
            btn.addEventListener("click", () => agregarAlCarrito(btn.getAttribute("data-id"), 1));
        });
        contenedorItems.querySelectorAll(".btn-item-restar").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                const cantidadActual = obtenerCarrito()[id] || 0;
                establecerCantidadCarrito(id, cantidadActual - 1);
            });
        });
    }

    totalTexto.textContent = `S/ ${totalPrecioCarrito().toFixed(2)}`;
}

function mostrarAvisoCarrito(texto = "✅ Añadido al carrito") {
    let aviso = document.getElementById("aviso-carrito-flotante");
    if (!aviso) {
        aviso = document.createElement("div");
        aviso.id = "aviso-carrito-flotante";
        aviso.className = "aviso-flotante aviso-carrito-flotante";
        document.body.appendChild(aviso);
    }
    aviso.textContent = texto;
    aviso.style.display = "block";
    clearTimeout(aviso._temporizador);
    aviso._temporizador = setTimeout(() => { aviso.style.display = "none"; }, 1800);
}

document.addEventListener("DOMContentLoaded", () => {
    crearWidgetCarrito();
    actualizarWidgetCarrito();
    cargarStockGlobalDelCarrito();
});

window.addEventListener("storage", (e) => {
    if (e.key === CLAVE_CARRITO) actualizarWidgetCarrito();
});
