document.addEventListener("DOMContentLoaded", () => {

    const contenedorPlatos = document.getElementById("contenedor-platos");
    const contenedorOfertas = document.getElementById("contenedor-ofertas");
    const contenedorOfertaDia = document.getElementById("contenedor-oferta-dia");

    // Inicializar el renderizado según la página
    if (contenedorPlatos) {
        if (typeof stockYaCargado !== "undefined" && stockYaCargado) {
            renderizarMenuDinamico();
        } else {
            document.addEventListener("stockCarritoListo", renderizarMenuDinamico);
        }
    } else if (contenedorOfertas || contenedorOfertaDia) {
        if (typeof stockYaCargado !== "undefined" && stockYaCargado) {
            renderizarOfertasDinamico();
        } else {
            document.addEventListener("stockCarritoListo", renderizarOfertasDinamico);
        }
    } else {
        // Para páginas con elementos estáticos (como index.html)
        inicializarTarjetasDeProducto();
        inicializarFiltrosMenu();
    }

    function renderizarOfertasDinamico() {
        // Oferta del día: menu_dia
        if (contenedorOfertaDia && CATALOGO_PRODUCTOS["menu_dia"]) {
            const prod = CATALOGO_PRODUCTOS["menu_dia"];
            const nomSeg = typeof escapeHTML === 'function' ? escapeHTML(prod.nombre) : prod.nombre;
            const descSeg = typeof escapeHTML === 'function' ? escapeHTML(prod.descripcion || '') : (prod.descripcion || '');
            const restSeg = typeof escapeHTML === 'function' ? escapeHTML(prod.restaurante || 'Sabor Peruano') : (prod.restaurante || 'Sabor Peruano');
            const imgSeg = typeof escapeHTML === 'function' ? escapeHTML(prod.imagen) : prod.imagen;
            
            const precioOriginal = prod.precio_original || 27.00;
            const precioActual = prod.precio;
            const descPorcentaje = Math.round(((precioOriginal - precioActual) / precioOriginal) * 100);

            contenedorOfertaDia.innerHTML = `
                <h2 class="titulo-seccion">⭐ Oferta del Día</h2>
                <div class="tarjeta-oferta-dia" data-id="menu_dia">
                    <div class="icono-oferta-dia"><img src="../image/${imgSeg}" alt="${nomSeg}" loading="lazy"></div>
                    <div class="info-oferta-dia">
                        <p class="restaurante-oferta">${restSeg}</p>
                        <h3 class="nombre-oferta">${nomSeg}</h3>
                        <p class="descripcion-oferta">${descSeg}</p>
                        <div class="precios-oferta">
                            <s class="precio-anterior">S/ ${precioOriginal.toFixed(2)}</s>
                            <span class="precio-actual">S/ ${precioActual.toFixed(2)}</span>
                            <span class="etiqueta-descuento">-${descPorcentaje}%</span>
                        </div>
                        <div class="stock-plato" data-stock-info>Consultando stock...</div>
                        <div class="control-cantidad-tarjeta">
                            <button type="button" class="btn-restar-tarjeta" aria-label="Disminuir cantidad">-</button>
                            <span class="cantidad-tarjeta">1</span>
                            <button type="button" class="btn-sumar-tarjeta" aria-label="Aumentar cantidad">+</button>
                        </div>
                        <button type="button" class="boton boton-primario btn-agregar-carrito">🛒 Pedir ahora</button>
                    </div>
                </div>
            `;
        }

        // Resto de ofertas
        if (contenedorOfertas) {
            const idsOfertas = Object.keys(CATALOGO_PRODUCTOS).filter(id => {
                const prod = CATALOGO_PRODUCTOS[id];
                return prod && prod.categoria === "oferta" && id !== "menu_dia";
            });

            if (idsOfertas.length === 0) {
                contenedorOfertas.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #666;'>No hay más ofertas disponibles hoy.</p>";
            } else {
                contenedorOfertas.innerHTML = idsOfertas.map(id => {
                    const prod = CATALOGO_PRODUCTOS[id];
                    const nomSeg = typeof escapeHTML === 'function' ? escapeHTML(prod.nombre) : prod.nombre;
                    const restSeg = typeof escapeHTML === 'function' ? escapeHTML(prod.restaurante || 'SalvaComida') : (prod.restaurante || 'SalvaComida');
                    const imgSeg = typeof escapeHTML === 'function' ? escapeHTML(prod.imagen) : prod.imagen;
                    const idSeg = typeof escapeHTML === 'function' ? escapeHTML(id) : id;

                    const precioOriginal = prod.precio_original || prod.precio * 1.5;
                    const precioActual = prod.precio;
                    const descPorcentaje = Math.round(((precioOriginal - precioActual) / precioOriginal) * 100);

                    return `
                    <div class="tarjeta-oferta" data-id="${idSeg}">
                        <div class="etiqueta-descuento-esquina">-${descPorcentaje}%</div>
                        <div class="icono-oferta"><img src="../image/${imgSeg}" alt="${nomSeg}" loading="lazy"></div>
                        <div class="info-oferta">
                            <p class="restaurante-oferta">${restSeg}</p>
                            <h3 class="nombre-oferta">${nomSeg}</h3>
                            <div class="precios-oferta"><s>S/ ${precioOriginal.toFixed(2)}</s><span class="precio-actual">S/ ${precioActual.toFixed(2)}</span></div>
                            <div class="stock-plato" data-stock-info>Consultando stock...</div>
                            <div class="control-cantidad-tarjeta">
                                <button type="button" class="btn-restar-tarjeta" aria-label="Disminuir cantidad">-</button>
                                <span class="cantidad-tarjeta">1</span>
                                <button type="button" class="btn-sumar-tarjeta" aria-label="Aumentar cantidad">+</button>
                            </div>
                            <button type="button" class="enlace-pedir btn-agregar-carrito">Pedir ya →</button>
                        </div>
                    </div>
                    `;
                }).join("");
            }
        }

        // Inicializar eventos para las tarjetas de ofertas inyectadas
        inicializarTarjetasDeProducto();
    }

    function renderizarMenuDinamico() {
        const categoriasRegulares = ["menu", "entradas", "bebidas", "pasta", "postres"];
        const idsProductos = Object.keys(CATALOGO_PRODUCTOS).filter(id => {
            const prod = CATALOGO_PRODUCTOS[id];
            return prod && categoriasRegulares.includes(prod.categoria);
        });

        if (idsProductos.length === 0) {
            contenedorPlatos.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #666;'>No se encontraron productos en el menú.</p>";
            return;
        }

        const fallbackRestaurante = {
            menu: "Sabor Peruano",
            entradas: "El Buen Sabor",
            bebidas: "Verde Vivo",
            pasta: "La Trattoria",
            postres: "Sabor Peruano"
        };

        contenedorPlatos.innerHTML = idsProductos.map(id => {
            const prod = CATALOGO_PRODUCTOS[id];
            const nomSeg = typeof escapeHTML === 'function' ? escapeHTML(prod.nombre) : prod.nombre;
            const descSeg = typeof escapeHTML === 'function' ? escapeHTML(prod.descripcion || '') : (prod.descripcion || '');
            const restSeg = typeof escapeHTML === 'function' ? escapeHTML(prod.restaurante || fallbackRestaurante[prod.categoria] || 'SalvaComida') : (prod.restaurante || fallbackRestaurante[prod.categoria] || 'SalvaComida');
            const catSeg = typeof escapeHTML === 'function' ? escapeHTML(prod.categoria) : prod.categoria;
            const imgSeg = typeof escapeHTML === 'function' ? escapeHTML(prod.imagen) : prod.imagen;
            const idSeg = typeof escapeHTML === 'function' ? escapeHTML(id) : id;

            return `
            <div class="tarjeta-plato" data-categoria="${catSeg}" data-id="${idSeg}">
                <div class="icono-plato"><img src="../image/${imgSeg}" alt="${nomSeg}" loading="lazy"></div>
                <div class="info-plato">
                    <h3 class="nombre-plato">${nomSeg}</h3>
                    <p class="restaurante-plato">📍 ${restSeg}</p>
                    <p class="descripcion-plato">${descSeg}</p>
                    <div class="precio-plato">S/ ${prod.precio.toFixed(2)}</div>
                    <div class="stock-plato" data-stock-info>Consultando stock...</div>
                    <div class="control-cantidad-tarjeta">
                        <button type="button" class="btn-restar-tarjeta" aria-label="Disminuir cantidad">-</button>
                        <span class="cantidad-tarjeta">1</span>
                        <button type="button" class="btn-sumar-tarjeta" aria-label="Aumentar cantidad">+</button>
                    </div>
                    <button type="button" class="boton boton-pequeno btn-agregar-carrito">🛒 Añadir</button>
                </div>
            </div>
            `;
        }).join("");

        // Inicializar eventos para las tarjetas inyectadas
        inicializarTarjetasDeProducto();
        inicializarFiltrosMenu();
    }

    function inicializarFiltrosMenu() {
        const botones = document.querySelectorAll(".btn-filtro");
        const platos = document.querySelectorAll(".tarjeta-plato");

        botones.forEach(boton => {
            // Removemos listeners previos para evitar duplicados
            const nuevoBoton = boton.cloneNode(true);
            boton.parentNode.replaceChild(nuevoBoton, boton);

            nuevoBoton.addEventListener("click", () => {
                document.querySelectorAll(".btn-filtro").forEach(b => b.classList.remove("activo"));
                nuevoBoton.classList.add("activo");

                const categoriaSeleccionada = nuevoBoton.getAttribute("data-filtro");

                platos.forEach(plato => {
                    const categoriaPlato = plato.getAttribute("data-categoria");
                    if (categoriaSeleccionada === "todos" || categoriaSeleccionada === categoriaPlato) {
                        plato.style.display = "flex";
                    } else {
                        plato.style.display = "none";
                    }
                });
            });
        });
    }

    function inicializarTarjetasDeProducto() {
        const tarjetasProducto = document.querySelectorAll(
            ".tarjeta-plato[data-id], .tarjeta-oferta[data-id], .tarjeta-oferta-dia[data-id]"
        );

        if (tarjetasProducto.length > 0 && typeof miSupabase !== "undefined") {
            pintarStockDeTarjetas(tarjetasProducto);

            tarjetasProducto.forEach(tarjeta => {
                const contador = tarjeta.querySelector(".cantidad-tarjeta");
                const btnRestar = tarjeta.querySelector(".btn-restar-tarjeta");
                const btnSumar = tarjeta.querySelector(".btn-sumar-tarjeta");
                const btnAgregar = tarjeta.querySelector(".btn-agregar-carrito");

                if (!contador || !btnRestar || !btnSumar || !btnAgregar) return;

                // Clonación para limpiar listeners anteriores
                const nuevoBtnSumar = btnSumar.cloneNode(true);
                const nuevoBtnRestar = btnRestar.cloneNode(true);
                const nuevoBtnAgregar = btnAgregar.cloneNode(true);

                btnSumar.parentNode.replaceChild(nuevoBtnSumar, btnSumar);
                btnRestar.parentNode.replaceChild(nuevoBtnRestar, btnRestar);
                btnAgregar.parentNode.replaceChild(nuevoBtnAgregar, btnAgregar);

                nuevoBtnSumar.addEventListener("click", () => {
                    const stockMaximo = parseInt(tarjeta.dataset.stockMaximo) || 99;
                    let cantidad = parseInt(contador.textContent) || 1;
                    if (cantidad < stockMaximo) {
                        contador.textContent = cantidad + 1;
                    } else {
                        mostrarAvisoCarrito(`Solo hay ${stockMaximo} unidades disponibles`);
                    }
                });

                nuevoBtnRestar.addEventListener("click", () => {
                    let cantidad = parseInt(contador.textContent) || 1;
                    if (cantidad > 1) contador.textContent = cantidad - 1;
                });

                nuevoBtnAgregar.addEventListener("click", () => {
                    const id = tarjeta.getAttribute("data-id");
                    const cantidadElegida = parseInt(contador.textContent) || 1;
                    const nombreProducto = tarjeta.querySelector(".nombre-plato, .nombre-oferta");

                    agregarAlCarrito(id, cantidadElegida);
                    mostrarAvisoCarrito(`✅ ${nombreProducto ? nombreProducto.textContent : "Producto"} añadido al carrito`);

                    contador.textContent = "1";
                });
            });

            // Registrar refresco del stock ante eventos de actualización
            document.removeEventListener("stockCarritoListo", actualizarStock);
            document.addEventListener("stockCarritoListo", actualizarStock);
        }
    }

    function actualizarStock() {
        const tarjetas = document.querySelectorAll(
            ".tarjeta-plato[data-id], .tarjeta-oferta[data-id], .tarjeta-oferta-dia[data-id]"
        );
        pintarStockDeTarjetas(tarjetas);
    }

    function pintarStockDeTarjetas(tarjetas) {
        tarjetas.forEach(tarjeta => {
            const id = tarjeta.getAttribute("data-id");
            const textoStock = tarjeta.querySelector("[data-stock-info]");
            const contador = tarjeta.querySelector(".cantidad-tarjeta");
            const btnAgregar = tarjeta.querySelector(".btn-agregar-carrito");
            const btnSumar = tarjeta.querySelector(".btn-sumar-tarjeta");

            if (typeof idsConNombreActualizado !== "undefined" && idsConNombreActualizado.includes(id)) {
                const nombreEnTarjeta = tarjeta.querySelector(".nombre-plato, .nombre-oferta");
                if (nombreEnTarjeta && CATALOGO_PRODUCTOS[id]) {
                    nombreEnTarjeta.textContent = CATALOGO_PRODUCTOS[id].nombre;
                }
            }
            if (typeof idsConPrecioActualizado !== "undefined" && idsConPrecioActualizado.includes(id) && CATALOGO_PRODUCTOS[id]) {
                const precioFormateado = `S/ ${CATALOGO_PRODUCTOS[id].precio.toFixed(2)}`;
                const precioEnTarjeta = tarjeta.querySelector(".precio-plato, .precios-oferta .precio-actual");
                if (precioEnTarjeta) precioEnTarjeta.textContent = precioFormateado;
            }

            const stockDisponible = obtenerStockDisponible(id);
            tarjeta.dataset.stockMaximo = (stockDisponible === Infinity) ? 99 : stockDisponible;

            if (!textoStock) return;

            if (stockDisponible === Infinity) {
                textoStock.textContent = "";
                return;
            }

            textoStock.classList.remove("stock-disponible", "stock-bajo", "stock-agotado");
            if (btnAgregar) { btnAgregar.disabled = false; btnAgregar.classList.remove("boton-deshabilitado"); }
            if (btnSumar) btnSumar.disabled = false;

            if (stockDisponible <= 0) {
                textoStock.textContent = "❌ Agotado por hoy";
                textoStock.classList.add("stock-agotado");
                if (contador) contador.textContent = "0";
                if (btnAgregar) { btnAgregar.disabled = true; btnAgregar.classList.add("boton-deshabilitado"); }
                if (btnSumar) btnSumar.disabled = true;
            } else if (stockDisponible <= 5) {
                textoStock.textContent = `⚠️ ¡Solo quedan ${stockDisponible} unidades!`;
                textoStock.classList.add("stock-bajo");
            } else {
                textoStock.textContent = `✅ Quedan ${stockDisponible} unidades`;
                textoStock.classList.add("stock-disponible");
            }
        });
    }

    const formPedido = document.getElementById("form-pedido");

    if (formPedido) {
        const selectMetodo = document.getElementById("pedido-metodo-entrega");
        const txtSubtotal = document.getElementById("pedido-subtotal");
        const txtDelivery = document.getElementById("pedido-costo-delivery");
        const txtTotal = document.getElementById("pedido-total");
        const listaItemsCheckout = document.getElementById("lista-items-checkout");
        const contadorItemsCheckout = document.getElementById("contador-items-checkout");
        function renderizarCheckout() {
            const carrito = obtenerCarrito();
            const idsEnCarrito = Object.keys(carrito).filter(id => carrito[id] > 0 && CATALOGO_PRODUCTOS[id]);

            let subtotal = 0;
            let totalUnidades = 0;

            if (idsEnCarrito.length === 0) {
                listaItemsCheckout.innerHTML = `
                    <p class="carrito-vacio">Tu carrito está vacío. <a href="menu.html" class="enlace-agregar-mas">Ir al menú →</a></p>
                `;
            } else {
                listaItemsCheckout.innerHTML = idsEnCarrito.map(id => {
                    const producto = CATALOGO_PRODUCTOS[id];
                    const cantidad = carrito[id];
                    const stockDisponible = obtenerStockDisponible(id);
                    const alcanzoElTope = cantidad >= stockDisponible;
                    const subtotalProducto = producto.precio * cantidad;

                    subtotal += subtotalProducto;
                    totalUnidades += cantidad;

                    /* FIX #2 — Escapar nombre del producto antes de innerHTML */
                    const nomSeg = typeof escapeHTML === 'function' ? escapeHTML(producto.nombre) : producto.nombre;
                    const idSeg = typeof escapeHTML === 'function' ? escapeHTML(id) : id;
                    return `
                        <div class="item-carrito" data-id="${idSeg}">
                            <img src="../image/${producto.imagen}" alt="${nomSeg}" class="item-carrito-img">
                            <div class="item-carrito-info">
                                <p class="item-carrito-nombre">${nomSeg}</p>
                                <p class="item-carrito-precio">S/ ${producto.precio.toFixed(2)} c/u</p>
                            </div>
                            <div class="item-carrito-control">
                                <button type="button" class="btn-item-restar-checkout" data-id="${idSeg}" aria-label="Quitar una unidad">-</button>
                                <span>${cantidad}</span>
                                <button type="button" class="btn-item-sumar-checkout" data-id="${idSeg}" aria-label="Agregar una unidad" ${alcanzoElTope ? "disabled" : ""}>+</button>
                            </div>
                            <span class="item-carrito-subtotal">S/ ${subtotalProducto.toFixed(2)}</span>
                        </div>
                    `;
                }).join("");

                listaItemsCheckout.querySelectorAll(".btn-item-sumar-checkout").forEach(btn => {
                    btn.addEventListener("click", () => agregarAlCarrito(btn.getAttribute("data-id"), 1));
                });
                listaItemsCheckout.querySelectorAll(".btn-item-restar-checkout").forEach(btn => {
                    btn.addEventListener("click", () => {
                        const id = btn.getAttribute("data-id");
                        const cantidadActual = obtenerCarrito()[id] || 0;
                        establecerCantidadCarrito(id, cantidadActual - 1);
                    });
                });
            }

            if (contadorItemsCheckout) contadorItemsCheckout.textContent = totalUnidades;

            const costoDelivery = selectMetodo.value === "delivery" ? 3.00 : 0.00;
            const totalFinal = subtotal + costoDelivery;

            txtSubtotal.textContent = `S/ ${subtotal.toFixed(2)}`;
            txtDelivery.textContent = `S/ ${costoDelivery.toFixed(2)}`;
            txtTotal.textContent = `S/ ${totalFinal.toFixed(2)}`;

            sessionStorage.setItem("metodoSalvaComida", selectMetodo.value);
        }

        selectMetodo.addEventListener("change", renderizarCheckout);

        const datosTarjeta = document.getElementById("datos-tarjeta");
        const radiosPago = formPedido.querySelectorAll('input[name="metodo_pago"]');
        function actualizarVisibilidadTarjeta() {
            const seleccionado = formPedido.querySelector('input[name="metodo_pago"]:checked');
            if (datosTarjeta) {
                datosTarjeta.style.display = (seleccionado && seleccionado.value === "Tarjeta") ? "block" : "none";
            }
        }
        radiosPago.forEach(radio => radio.addEventListener("change", actualizarVisibilidadTarjeta));
        actualizarVisibilidadTarjeta();

        document.addEventListener("carritoActualizado", renderizarCheckout);
        document.addEventListener("stockCarritoListo", renderizarCheckout);

        const metodoGuardado = sessionStorage.getItem("metodoSalvaComida");
        if (metodoGuardado) selectMetodo.value = metodoGuardado;

        const parametrosURL = new URLSearchParams(window.location.search);
        const platoIDRaw = parametrosURL.get("plato");
        const CATALOGO_IDS_PERMITIDOS = Object.keys(CATALOGO_PRODUCTOS);
        const platoID = (platoIDRaw && CATALOGO_IDS_PERMITIDOS.includes(platoIDRaw)) ? platoIDRaw : null;
        if (platoID) {
            const cantidadActual = obtenerCarrito()[platoID] || 0;
            if (cantidadActual === 0) {
                establecerCantidadCarrito(platoID, 1);
            }
        }

        renderizarCheckout();

        function validarDatosDeTarjeta() {
            const numero = document.getElementById("tarjeta-numero").value.replace(/\s/g, "");
            const expira = document.getElementById("tarjeta-expira").value.trim();
            const cvv = document.getElementById("tarjeta-cvv").value.trim();

            if (!/^\d{16}$/.test(numero)) {
                return "El número de tarjeta debe tener 16 dígitos.";
            }

            const coincidenciaExpira = expira.match(/^(\d{2})\/(\d{2})$/);
            if (!coincidenciaExpira) {
                return "La fecha de expiración debe tener el formato MM/AA.";
            }
            const mesExpira = parseInt(coincidenciaExpira[1]);
            const anioExpira = parseInt(coincidenciaExpira[2]);
            if (mesExpira < 1 || mesExpira > 12) {
                return "El mes de expiración de la tarjeta no es válido.";
            }
            const ahora = new Date();
            const anioActualCorto = ahora.getFullYear() % 100;
            const mesActual = ahora.getMonth() + 1;
            if (anioExpira < anioActualCorto || (anioExpira === anioActualCorto && mesExpira < mesActual)) {
                return "Tu tarjeta está vencida. Usa otra tarjeta u otro método de pago.";
            }

            if (!/^\d{3}$/.test(cvv)) {
                return "El CVV debe tener 3 dígitos.";
            }

            return null; /* sin errores */
        }

        /* SE GUARDA EL PEDIDO Y LA BASE DE DATOS LO RESTA EN EL STOCK DEL PRODUCTO */
        formPedido.addEventListener("submit", async (e) => {
            e.preventDefault();

            const { data: { user } } = await miSupabase.auth.getUser();
            if (!user) {
                alert("Debes iniciar sesión para confirmar tu pedido.");
                return;
            }

            /* DECLARACION DE TODAS LAS VARIABLES NECESARIAS */
            const metodoEntrega = selectMetodo.value;
            const radioPagoSeleccionado = formPedido.querySelector('input[name="metodo_pago"]:checked');
            if (!radioPagoSeleccionado) {
                alert("Selecciona un método de pago.");
                return;
            }
            const metodoPago = radioPagoSeleccionado.value;
            const carritoActual = obtenerCarrito();
            const itemsCarrito = Object.keys(carritoActual)
                .filter(id => carritoActual[id] > 0 && CATALOGO_PRODUCTOS[id])
                .map(id => ({
                    id,
                    nombre: CATALOGO_PRODUCTOS[id].nombre,
                    precio: CATALOGO_PRODUCTOS[id].precio,
                    cantidad: carritoActual[id]
                }));

            if (itemsCarrito.length === 0) {
                alert("Tu carrito está vacío. Agrega mínimo un producto.");
                return;
            }

            const subtotalCalculado = itemsCarrito.reduce((suma, item) => suma + (item.precio * item.cantidad), 0);
            const costoDelivery = metodoEntrega === "delivery" ? 3.00 : 0.00;
            let totalFinal = subtotalCalculado + costoDelivery;

            /* CAPTURAR DATOS DEL RECEPTOR EDITADOS EN EL FORMULARIO */
            const nombreFinal = document.getElementById("pedido-nombre").value.trim().replace(/\s+/g, " ");
            const telefonoFinal = document.getElementById("pedido-telefono").value.trim();
            const direccionFinal = document.getElementById("pedido-direccion").value.trim().replace(/\s+/g, " ");

            const errorNombreReceptor = validarSoloNombre(nombreFinal, "El nombre de quien recibe");
            mostrarErrorCampo("pedido-nombre", errorNombreReceptor);
            if (errorNombreReceptor) {
                document.getElementById("pedido-nombre").focus();
                return;
            }
            mostrarErrorCampo("pedido-nombre", null);

            const errorTelefonoReceptor = validarTelefono(telefonoFinal);
            mostrarErrorCampo("pedido-telefono", errorTelefonoReceptor);
            if (errorTelefonoReceptor) {
                document.getElementById("pedido-telefono").focus();
                return;
            }
            mostrarErrorCampo("pedido-telefono", null);

            const errorDireccionEntrega = validarDireccion(direccionFinal);
            mostrarErrorCampo("pedido-direccion", errorDireccionEntrega);
            if (errorDireccionEntrega) {
                document.getElementById("pedido-direccion").focus();
                return;
            }
            mostrarErrorCampo("pedido-direccion", null);

            const cajaNotas = document.getElementById("pedido-notas");
            /* FIX #11 — Sanitizar notas: maxlength en JS + strip de HTML */
            let notasRaw = (cajaNotas && cajaNotas.value) ? cajaNotas.value.trim() : "";
            if (notasRaw.length > 200) notasRaw = notasRaw.slice(0, 200);
            notasRaw = notasRaw.replace(/<[^>]*>/g, '').replace(/&/g, '&amp;');
            const notasAdicionales = notasRaw !== "" ? notasRaw : "Sin notas extra";

            /* CONSOLIDAR DATOS EN LA NOTA PARA NO ALTERAR LA BASE DE DATOS */
            const notaParaRestaurante = `Recibe: ${nombreFinal} | Telf: ${telefonoFinal} | Dirección: ${direccionFinal} | Notas: ${notasAdicionales}`;

            /* VALIDACIÓN DE LA PASARELA DE PAGO ANTES DE "COBRAR" */
            if (metodoPago === "Tarjeta") {
                const errorTarjeta = validarDatosDeTarjeta();
                if (errorTarjeta) {
                    alert("⚠️ " + errorTarjeta);
                    return;
                }
            }

            const pantallaCarga = document.getElementById("pantalla-pago");
            const giroCarga = document.getElementById("giro-carga");
            const iconoExito = document.getElementById("icono-exito");
            const textoCarga = document.querySelector(".texto-carga");
            if (giroCarga) giroCarga.style.display = "block";
            if (iconoExito) iconoExito.style.display = "none";
            if (textoCarga) textoCarga.textContent = "Verificando disponibilidad...";
            if (pantallaCarga) pantallaCarga.style.display = "flex";

            try {
                let { data: productosActuales, error: errorStockActual } = await miSupabase
                    .from('productos')
                    .select('id, precio, stock_actual')
                    .in('id', itemsCarrito.map(item => item.id));

                if (errorStockActual) {
                    const respaldo = await miSupabase
                        .from('productos')
                        .select('id, stock_actual')
                        .in('id', itemsCarrito.map(item => item.id));
                    productosActuales = respaldo.data;
                    errorStockActual = respaldo.error;
                }

                if (errorStockActual) {
                    if (pantallaCarga) pantallaCarga.style.display = "none";
                    alert("❌ No se pudo verificar el stock disponible. Intenta nuevamente.");
                    return;
                }

                const mapaStockReal = {};
                const mapaPrecioReal = {};
                (productosActuales || []).forEach(p => {
                    mapaStockReal[p.id] = parseInt(p.stock_actual);
                    const precioBD = parseFloat(p.precio);
                    if (!isNaN(precioBD)) mapaPrecioReal[p.id] = precioBD;
                });

                const itemsSinStock = itemsCarrito.filter(item => (mapaStockReal[item.id] ?? 0) < item.cantidad);
                if (itemsSinStock.length > 0) {
                    if (pantallaCarga) pantallaCarga.style.display = "none";
                    const detalleFaltante = itemsSinStock
                        .map(item => `• ${item.nombre}: solo quedan ${mapaStockReal[item.id] ?? 0} unidad(es)`)
                        .join("\n");
                    alert("⚠️ Algunos productos ya no tienen suficiente stock:\n\n" + detalleFaltante + "\n\nAjustamos tu carrito, por favor revisa antes de continuar.");

                    /* Ajustamos el carrito a lo que realmente hay disponible */
                    itemsSinStock.forEach(item => establecerCantidadCarrito(item.id, mapaStockReal[item.id] ?? 0));
                    return;
                }

                itemsCarrito.forEach(item => {
                    if (mapaPrecioReal.hasOwnProperty(item.id) && mapaPrecioReal[item.id] !== item.precio) {
                        item.precio = mapaPrecioReal[item.id];
                    }
                });
                const subtotalVerificado = itemsCarrito.reduce((suma, item) => suma + (item.precio * item.cantidad), 0);
                if (Math.abs(subtotalVerificado - subtotalCalculado) > 0.001) {
                    totalFinal = subtotalVerificado + costoDelivery;
                }

                if (textoCarga) textoCarga.textContent = "Procesando pago seguro...";

                /* Guardar el pedido coincidiendo la tabla 'pedidos' en la base de datos */
                const { data: nuevoPedido, error: errorPedido } = await miSupabase
                    .from('pedidos')
                    .insert([{
                        usuario_id: user.id,
                        metodo_pago: metodoPago,
                        modalidad: metodoEntrega,
                        costo_envio: costoDelivery,
                        total_final: totalFinal,
                        estado: "Pendiente",
                        notas: notaParaRestaurante
                    }])
                    .select()
                    .single();

                if (errorPedido) {
                    if (pantallaCarga) pantallaCarga.style.display = "none";
                    alert("❌ No se pudo procesar el pago: " + errorPedido.message);
                    return;
                }

                for (const item of itemsCarrito) {
                    const { error: errorDetalle } = await miSupabase.from('pedido_detalles').insert([{
                        pedido_id: nuevoPedido.id,
                        producto_id: item.id,
                        cantidad: item.cantidad,
                        precio_unitario: item.precio
                    }]);
                    if (errorDetalle) console.error("Error al guardar el detalle del pedido:", errorDetalle);

                    const { data: stockDescontado, error: errorStock } = await miSupabase
                        .rpc('descontar_stock', {
                            p_producto_id: item.id,
                            p_cantidad: item.cantidad
                        });

                    if (errorStock) {
                        console.error(`Error al conectar con la base de datos para descontar stock de ${item.id}:`, errorStock);
                    } else if (!stockDescontado) {
                        console.warn(`No se descontó el stock de ${item.id}. Insuficiente por posible compra simultánea.`);
                    }
                }

                vaciarCarrito();
                sessionStorage.removeItem("metodoSalvaComida");

                if (giroCarga) giroCarga.style.display = "none";
                if (iconoExito) iconoExito.style.display = "block";
                if (textoCarga) textoCarga.textContent = "¡Pago procesado con éxito! Redirigiendo...";

                setTimeout(() => {
                    window.location.href = "pedidos.html";
                }, 2000);

            } catch (errorInesperado) {
                console.error("Error inesperado al procesar el pago:", errorInesperado);
                if (pantallaCarga) pantallaCarga.style.display = "none";
                alert("❌ Ocurrió un error al procesar tu pago. Por favor intenta nuevamente.");
            }
        });
    }
});