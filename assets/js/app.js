/* CONEXIÓN PRINCIPAL CON LA BASE DE DATOS (SUPABASE) */
const miSupabase = supabase.createClient(
    'https://xuuajupcjxmpglatxmqf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1dWFqdXBjanhtcGdsYXR4bXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTkxMjUsImV4cCI6MjA5NTEzNTEyNX0.PSR8OjJxJXD4a6GPiJPl946MsGR2PifJCMNJta9dvXc'
);

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

const PATRON_SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+(?: [A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+)*$/;
const PATRON_DIRECCION_PERMITIDA = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9,.\-#°\s]+$/;

function validarSoloNombre(texto, etiqueta = "Este campo") {
    const limpio = (texto || "").trim().replace(/\s+/g, " ");

    if (limpio.length === 0) return `${etiqueta} es obligatorio.`;
    if (limpio.length < 2) return `${etiqueta} es demasiado corto.`;
    if (limpio.length > 50) return `${etiqueta} no puede superar los 50 caracteres.`;
    if (/\d/.test(limpio)) return `${etiqueta} no puede contener números.`;
    if (!PATRON_SOLO_LETRAS.test(limpio)) return `${etiqueta} solo puede contener letras.`;
    if (/^(.)\1+$/.test(limpio.replace(/\s/g, ""))) return `Escribe un ${etiqueta.toLowerCase()} real.`;

    return null;
}

function validarTelefono(telefono) {
    const limpio = (telefono || "").trim();

    if (limpio.length === 0) return "El teléfono es obligatorio.";
    if (!/^\d+$/.test(limpio)) return "El teléfono solo puede contener números (sin espacios ni símbolos).";
    if (limpio.length !== 9) return "El teléfono debe tener exactamente 9 dígitos.";
    if (!limpio.startsWith("9")) return "Escribe un celular peruano válido (empieza con 9).";
    if (/^(\d)\1+$/.test(limpio)) return "Ese número de teléfono no parece real.";

    return null;
}

function validarDireccion(direccion) {
    const limpia = (direccion || "").trim().replace(/\s+/g, " ");

    if (limpia.length === 0) return "La dirección es obligatoria.";
    if (limpia.length < 5) return "Escribe una dirección más completa.";
    if (limpia.length > 150) return "La dirección no puede superar los 150 caracteres.";
    if (!PATRON_DIRECCION_PERMITIDA.test(limpia)) {
        return "La dirección solo puede tener letras, números y comas (nada de otros símbolos).";
    }
    if (limpia.startsWith(",") || limpia.endsWith(",")) return "La dirección no puede empezar ni terminar con una coma.";
    if (/,\s*,/.test(limpia)) return "No uses varias comas seguidas en la dirección.";
    if (!/[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]/.test(limpia)) return "La dirección debe incluir texto, no solo números o comas.";
    if (/^(.)\1+$/.test(limpia.replace(/\s/g, ""))) return "Escribe una dirección real.";

    return null;
}

function mostrarErrorCampo(idCampo, mensaje) {
    const campo = document.getElementById(idCampo);
    if (!campo) return;

    let contenedorError = campo.closest(".campo-grupo")?.querySelector(".error-campo");
    if (!contenedorError) {
        contenedorError = document.createElement("p");
        contenedorError.className = "error-campo";
        const referencia = campo.closest(".input-icono") || campo;
        referencia.insertAdjacentElement("afterend", contenedorError);
    }

    if (mensaje) {
        contenedorError.textContent = "⚠️ " + mensaje;
        contenedorError.style.display = "block";
        campo.classList.add("campo-invalido");
    } else {
        contenedorError.textContent = "";
        contenedorError.style.display = "none";
        campo.classList.remove("campo-invalido");
    }
}

function protegerCampoConPatron(idCampo, expresionPermitida) {
    const campo = document.getElementById(idCampo);
    if (!campo) return;
    campo.addEventListener("input", () => {
        const inicioCursor = campo.selectionStart;
        const largoAntes = campo.value.length;
        campo.value = campo.value.replace(expresionPermitida, "");
        const diferencia = largoAntes - campo.value.length;
        if (inicioCursor !== null) {
            const nuevaPosicion = Math.max(0, inicioCursor - diferencia);
            campo.setSelectionRange(nuevaPosicion, nuevaPosicion);
        }
    });
}

/* INTERACCIÓN Y LOGUEO DE LA PÁGINA (AL CARGAR EL DOCUMENTO) */
document.addEventListener("DOMContentLoaded", () => {

    /* 1. Proteger campos de formulario de forma sincrónica e inmediata (evita bloqueos de red) */
    if (document.getElementById("form-pedido")) {
        protegerCampoConPatron("pedido-nombre", /[^A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]/g);
        protegerCampoConPatron("pedido-telefono", /[^0-9]/g);
        protegerCampoConPatron("pedido-direccion", /[^A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9,.\-#°\s]/g);
        const notasField = document.getElementById("pedido-notas");
        if (notasField) {
            notasField.addEventListener("input", () => {
                notasField.value = notasField.value.replace(/[<>]/g, "");
            });
        }
        document.getElementById("pedido-telefono")?.setAttribute("maxlength", "9");
    }

    /* 2. Cargar sesión de Supabase en segundo plano de forma asíncrona */
    if (typeof miSupabase !== "undefined") {
        cargarSesionYCompletarDatos();
    }

    async function cargarSesionYCompletarDatos() {
        try {
            /* Obtener el usuario autenticado actual  */
            const { data: { user } } = await miSupabase.auth.getUser();

            /* MEJORA DE UX: si la página requiere sesión (perfil o pedidos) y no hay
               usuario logueado, antes se quedaba en blanco sin explicación alguna */
            const requiereSesion = document.getElementById("form-perfil") || document.getElementById("lista-pedidos");
            if (!user && requiereSesion) {
                alert("Debes iniciar sesión para ver esta página.");
                window.location.href = "login.html";
                return;
            }

            if (user) {
                /* Buscar al usuario en tu tabla pública 'usuarios' usando su ID único */
                const { data: usuarioBase } = await miSupabase
                    .from('usuarios')
                    .select('nombre, apellidos, telefono, direccion') 
                    .eq('id', user.id)
                    .single();

                /* Si lo encuentra en tu base de datos (con trim por si quedó
                   algún espacio de sobra guardado en un registro anterior) */
                const nombre = (usuarioBase?.nombre || "").trim();
                const apellidos = (usuarioBase?.apellidos || "").trim(); /* NUEVO: Guardamos el apellido */
                const telefono = (usuarioBase?.telefono || "").trim();
                const direccion = (usuarioBase?.direccion || "").trim();

                const boton = document.querySelector(".enlace-destacado");
                if (boton) {
                    const esIndex = window.location.pathname.includes("index.html") || window.location.pathname === "/";
                    boton.href = esIndex ? "pages/perfil.html" : "perfil.html";
                    const nombreCompleto = `${nombre} ${apellidos}`.trim();
                    /* FIX #3 — Escapar nombre/apellidos antes de innerHTML */
                    boton.innerHTML = `👋 Hola, ${escapeHTML(nombreCompleto || "Usuario")}`;
                }

                /* RELLENA LOS IMPUTS AUTOMÁTICAMENTE EN PERFIL.HTML */
                const formPerfil = document.getElementById("form-perfil");
                if (formPerfil) {
                    const cajaNombre = document.getElementById("perf-nombre");
                    if (cajaNombre) cajaNombre.value = nombre;

                    const cajaApellido = document.getElementById("perf-apellido"); /* NUEVO: Llena la nueva cajita */
                    if (cajaApellido) cajaApellido.value = apellidos;

                    const cajaTelefono = document.getElementById("perf-telefono");
                    if (cajaTelefono) cajaTelefono.value = telefono;

                    const cajaDireccion = document.getElementById("perf-direccion");
                    if (cajaDireccion) cajaDireccion.value = direccion;

                    protegerCampoConPatron("perf-nombre", /[^A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]/g);
                    if (cajaApellido) protegerCampoConPatron("perf-apellido", /[^A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]/g);
                    protegerCampoConPatron("perf-telefono", /[^0-9]/g);
                    protegerCampoConPatron("perf-direccion", /[^A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9,.\-#°\s]/g);
                    if (cajaTelefono) cajaTelefono.setAttribute("maxlength", "9");

                    formPerfil.addEventListener("submit", async (e) => {
                        e.preventDefault();

                        const errorNombre = validarSoloNombre(cajaNombre ? cajaNombre.value : nombre, "El nombre");
                        mostrarErrorCampo("perf-nombre", errorNombre);
                        if (errorNombre) { cajaNombre?.focus(); return; }

                        if (cajaApellido) {
                            const errorApellido = validarSoloNombre(cajaApellido.value, "El apellido");
                            mostrarErrorCampo("perf-apellido", errorApellido);
                            if (errorApellido) { cajaApellido.focus(); return; }
                        }

                        const errorTelefono = validarTelefono(cajaTelefono ? cajaTelefono.value : telefono);
                        mostrarErrorCampo("perf-telefono", errorTelefono);
                        if (errorTelefono) { cajaTelefono?.focus(); return; }

                        const errorDireccion = validarDireccion(cajaDireccion ? cajaDireccion.value : direccion);
                        mostrarErrorCampo("perf-direccion", errorDireccion);
                        if (errorDireccion) { cajaDireccion?.focus(); return; }

                        const btnGuardar = formPerfil.querySelector('button[type="submit"]');
                        const textoOriginal = btnGuardar ? btnGuardar.innerHTML : "";
                        if (btnGuardar) {
                            btnGuardar.disabled = true;
                            btnGuardar.innerHTML = "Guardando...";
                        }

                        const datosActualizados = {
                            nombre: (cajaNombre ? cajaNombre.value : nombre).trim().replace(/\s+/g, " "),
                            telefono: (cajaTelefono ? cajaTelefono.value : telefono).trim(),
                            direccion: (cajaDireccion ? cajaDireccion.value : direccion).trim().replace(/\s+/g, " ")
                        };
                        if (cajaApellido) datosActualizados.apellidos = cajaApellido.value.trim().replace(/\s+/g, " ");

                        const { error: errorGuardado } = await miSupabase
                            .from('usuarios')
                            .update(datosActualizados)
                            .eq('id', user.id);

                        if (btnGuardar) {
                            btnGuardar.disabled = false;
                            btnGuardar.innerHTML = textoOriginal;
                        }

                        const avisoGuardado = document.getElementById("aviso-guardado");
                        if (errorGuardado) {
                            alert("No se pudo guardar: " + errorGuardado.message);
                        } else if (avisoGuardado) {
                            avisoGuardado.style.display = "block";
                            setTimeout(() => avisoGuardado.style.display = "none", 2500);
                        } else {
                            alert("✅ Datos actualizados correctamente");
                        }
                    });
                }

                const formPedido = document.getElementById("form-pedido");
                if (formPedido) {
                    const nombreCompleto = `${nombre} ${apellidos}`.trim();
                    /* FIX QA H6 — Solo auto-rellenar si el campo está vacío (evita sobrescribir lo que el usuario ya escribió) */
                    const elNombre = document.getElementById("pedido-nombre");
                    const elTelefono = document.getElementById("pedido-telefono");
                    const elDireccion = document.getElementById("pedido-direccion");
                    if (elNombre && !elNombre.value) elNombre.value = nombreCompleto;
                    if (elTelefono && !elTelefono.value) elTelefono.value = telefono;
                    if (elDireccion && !elDireccion.value) elDireccion.value = direccion;
                }

                /* CARGAR LISTA DE PEDIDOS EN pedidos.html */
                const contenedorPedidos = document.getElementById("lista-pedidos");
                if (contenedorPedidos) {
                    const { data: pedidos, error } = await miSupabase
                        .from('pedidos')
                        .select('*')
                        .eq('usuario_id', user.id)
                        .order('fecha_pedido', { ascending: false });

                    if (error || !pedidos || pedidos.length === 0) {
                        contenedorPedidos.innerHTML = `<p class="carrito-vacio">Aún no has realizado ningún pedido de rescate.</p>`;
                    } else {
                        /* FIX #2 — Escapar TODOS los datos de la BD antes de innerHTML */
                        contenedorPedidos.innerHTML = pedidos.map(pedido => {
                            const fechaFormateada = pedido.fecha_pedido ? new Date(pedido.fecha_pedido).toLocaleDateString() : 'Sin fecha';
                            const totalStr = parseFloat(pedido.total_final);
                            const totalSeguro = isNaN(totalStr) ? '0.00' : totalStr.toFixed(2);

                            return `
                            <div style="background: #fff; padding: 15px; border-radius: 8px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-left: 4px solid #2f8f5b;">
                                <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 6px;">
                                    <span>📦 Pedido #${escapeHTML(String(pedido.id).slice(0, 8))}</span>
                                    <span style="color: #2f8f5b;">S/ ${escapeHTML(totalSeguro)}</span>
                                </div>
                                <div style="font-size: 13px; color: #666;">
                                    <p><strong>Modalidad:</strong> ${escapeHTML(pedido.modalidad)}</p>
                                    <p><strong>Pago:</strong> ${escapeHTML(pedido.metodo_pago)}</p>
                                    <p><strong>Estado:</strong> <span style="background: #fef3c7; color: #d97706; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${escapeHTML(pedido.estado)}</span></p>
                                    <p><strong>Fecha:</strong> ${escapeHTML(fechaFormateada)}</p>
                                </div>
                            </div>
                        `}).join('');
                    }
                }
            }
        } catch (error) {
            console.error("Error al cargar la sesión del usuario:", error);
        }
    }

    /* FUNCIONALIDAD DE CERRAR SESIÓN EN PERFIL.HTML */
    const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", async () => {
            try {
                await miSupabase.auth.signOut();
            } catch (err) {
                console.warn("Error al cerrar sesión:", err);
            }
            window.location.href = "../index.html";
        });
    }
    /* MENÚ HAMBURGUESA (dentro de DOMContentLoaded para seguridad) */
    const botonMenu = document.getElementById('btn-menu');
    const listaMenu = document.getElementById('menu-nav');
    if (botonMenu && listaMenu) {
        botonMenu.addEventListener('click', function () {
            listaMenu.classList.toggle('mostrar');
        });
    }

    /* Cerrar menú al hacer clic en el fondo oscuro */
    const fondoMenu = document.getElementById('fondo-menu');
    if (fondoMenu && listaMenu) {
        fondoMenu.addEventListener('click', function () {
            listaMenu.classList.remove('mostrar');
        });
    }
});