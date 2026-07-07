document.addEventListener("DOMContentLoaded", () => {

    /* FUNCION PARA PASAR A CADA CATEGORIA DENTRO DE MENU */
    const botones = document.querySelectorAll(".btn-filtro");
    const platos = document.querySelectorAll(".tarjeta-plato");

    botones.forEach(boton => {
        boton.addEventListener("click", () => {
            botones.forEach(b => b.classList.remove("activo"));
            boton.classList.add("activo");

            const categoriaSeleccionada = boton.getAttribute("data-filtro");

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

    /*  LÓGICA DEL CARRITO EN TIEMPO REAL (form_pedido.html) */
    const formPedido = document.getElementById("form-pedido");

    if (formPedido) {
        const filasPlatos = document.querySelectorAll(".fila-plato");
        const selectMetodo = document.getElementById("pedido-metodo-entrega");
        const txtSubtotal = document.getElementById("pedido-subtotal");
        const txtDelivery = document.getElementById("pedido-costo-delivery");
        const txtTotal = document.getElementById("pedido-total");
        const detalleCarrito = document.getElementById("detalle-carrito");

        /* REVISA EL STOCK LEYENDO STOCK_ACTUAL DE LA BASE DE DATOS */
        async function cargarStocksDesdeBaseDatos() {
            const { data: productos } = await miSupabase
                .from('productos')
                .select('id, stock_actual');

            if (productos) {
                productos.forEach(prod => {
                    const fila = document.querySelector(`.fila-plato[data-id="${prod.id}"]`);
                    if (fila) {
                        fila.setAttribute("data-stock-maximo", parseInt(prod.stock_actual));
                    }
                });
            }
        }

        /* CALCULA TODOS LOS PRECIOS Y SE ACTUALIZA RAPIDAMENTE EN LA PANTALLA DEL FORMULARIO DE PEDIDOS */
        function calcularTotales() {
            let subtotal = 0;
            let productosHtml = "";

            filasPlatos.forEach(fila => {
                const cantidad = parseInt(fila.querySelector(".cantidad-plato").textContent);

                if (cantidad > 0) {
                    const nombre = fila.querySelector(".nombre-fila-plato").textContent;
                    const precioTexto = fila.querySelector(".precio-fila-plato").textContent;
                    const precio = parseFloat(precioTexto.replace("S/", "").trim());

                    subtotal += (precio * cantidad);
                    productosHtml += `<p style="font-size:14px; margin:4px 0; color:#555;">${cantidad}x ${nombre} (S/ ${(precio * cantidad).toFixed(2)})</p>`;
                }
            });

            const costoDelivery = selectMetodo.value === "delivery" ? 3.00 : 0.00;
            const totalFinal = subtotal + costoDelivery;

            detalleCarrito.innerHTML = productosHtml || `<p class="carrito-vacio">Carrito vacío.</p>`;
            txtSubtotal.textContent = `S/ ${subtotal.toFixed(2)}`;
            txtDelivery.textContent = `S/ ${costoDelivery.toFixed(2)}`;
            txtTotal.textContent = `S/ ${totalFinal.toFixed(2)}`;
        }

        /* FUNCIONALIDAD PARA AUMENTAR O DISMINUIR CANTIDAD DE COMPRA DE LOS PRODUCTOS "+" O "-" */
        filasPlatos.forEach(fila => {
            const btnRestar = fila.querySelector(".btn-restar");
            const btnSumar = fila.querySelector(".btn-sumar");
            const contador = fila.querySelector(".cantidad-plato");

            btnSumar.addEventListener("click", (e) => {
                e.preventDefault();
                let cant = parseInt(contador.textContent);
                const stockMaximo = parseInt(fila.getAttribute("data-stock-maximo")) || 99;

                if (cant < stockMaximo) {
                    contador.textContent = cant + 1;
                    calcularTotales();
                } else {
                    alert("Lo sentimos, solo quedan ${stockMaximo} unidades disponibles de este plato.");
                }
            });

            btnRestar.addEventListener("click", (e) => {
                e.preventDefault();
                let cant = parseInt(contador.textContent);
                if (cant > 0) {
                    contador.textContent = cant - 1;
                    calcularTotales();
                }
            });
        });

        selectMetodo.addEventListener("change", calcularTotales);

        /* SELECCIONA AUTOMATICAMENTE EL PLATO "PEDIR YA" */
        const parametrosURL = new URLSearchParams(window.location.search);
        const platoID = parametrosURL.get("plato");

        if (platoID) {
            const filaSeleccionada = document.querySelector(`.fila-plato[data-id="${platoID}"]`);
            if (filaSeleccionada) {
                filaSeleccionada.querySelector(".cantidad-plato").textContent = "1";
            }
        }

        cargarStocksDesdeBaseDatos().then(() => {
            calcularTotales();
        });

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
            const metodoPago = formPedido.querySelector('input[name="metodo_pago"]:checked').value;
            const totalTexto = txtTotal.textContent;
            const totalFinal = parseFloat(totalTexto.replace("S/", "").trim());

            const costoDelivery = metodoEntrega === "delivery" ? 3.00 : 0.00;

            const cajaNotas = document.querySelector("textarea");
            const notasAdicionales = cajaNotas && cajaNotas.value.trim() !== "" ? cajaNotas.value : "EMPTY";

            if (totalFinal <= 0 || (metodoEntrega === "delivery" && totalFinal <= 3.00)) {
                alert("Tu carrito está vacío. Agrega mínimo un producto.");
                return;
            }

            const pantallaCarga = document.getElementById("pantalla-pago");
            if (pantallaCarga) pantallaCarga.style.display = "flex";

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
                    notas: notasAdicionales
                }])
                .select()
                .single();

            if (errorPedido) {
                if (pantallaCarga) pantallaCarga.style.display = "none";
                alert("Error al procesar el pedido: " + errorPedido.message);
                return;
            }

            for (const fila of filasPlatos) {
                const cantidadComprada = parseInt(fila.querySelector(".cantidad-plato").textContent);

                if (cantidadComprada > 0) {
                    const productoID = fila.getAttribute("data-id");
                    const precioTexto = fila.querySelector(".precio-fila-plato").textContent;
                    const precioUnidad = parseFloat(precioTexto.replace("S/", "").trim());

                    await miSupabase.from('pedido_detalles').insert([{
                        pedido_id: nuevoPedido.id,
                        producto_id: productoID,
                        cantidad: cantidadComprada,
                        precio_unitario: precioUnidad
                    }]);

                    const { data: prod } = await miSupabase
                        .from('productos')
                        .select('stock_actual')
                        .eq('id', productoID)
                        .single();

                    if (prod) {
                        let nuevoStock = prod.stock_actual - cantidadComprada;
                        if (nuevoStock < 0) nuevoStock = 0;

                        await miSupabase
                            .from('productos')
                            .update({ stock_actual: nuevoStock })
                            .eq('id', productoID);
                    }
                }
            }

            document.getElementById("giro-carga").style.display = "none";
            document.getElementById("icono-exito").style.display = "block";
            document.querySelector(".texto-carga").textContent = "¡Pago procesado con éxito! Redirigiendo...";

            setTimeout(() => {
                window.location.href = "pedidos.html";
            }, 2000);
        });
    }
});