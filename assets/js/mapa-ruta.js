
(function () {
    "use strict";

    /* ─── Configuración de Mapbox ─── */
    const MAPBOX_TOKEN = "pk.eyJ1IjoidmFubmMiLCJhIjoiY21ybGNqN2cxMjI2aDMzb3Jjdm81dnNwdiJ9.g6oT2NjaOj9MENQJ7FMHsQ";
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const ORIGEN = {
        lat: -16.3980,
        lng: -71.5360,
        nombre: "SalvaComida — Centro de Despacho",
        direccion: "Calle Jerusalén 200, Cercado, Arequipa"
    };

    /* ─── Estado del módulo ─── */
    let mapa = null;
    let marcadorOrigen = null;
    let marcadorDestino = null;

    /* ─── Crear elemento HTML para marcadores personalizados ─── */
    function crearElementoMarcador(emoji, color) {
        const el = document.createElement("div");
        el.className = "marcador-custom";
        el.style.width = "36px";
        el.style.height = "36px";
        el.style.borderRadius = "50%";
        el.style.background = color;
        el.style.border = "3px solid #fff";
        el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.fontSize = "18px";
        el.style.cursor = "pointer";
        el.innerText = emoji;
        return el;
    }

    /* ─── Inicializar el mapa de Mapbox ─── */
    function inicializarMapa() {
        const contenedorMapa = document.getElementById("mapa-ruta");
        if (!contenedorMapa || mapa) return;

        mapa = new mapboxgl.Map({
            container: "mapa-ruta",
            style: "mapbox://styles/mapbox/streets-v12", // Estilo de mapa vectorial limpio
            center: [ORIGEN.lng, ORIGEN.lat],
            zoom: 14,
            pitch: 30, // Ligera inclinación 3D para una apariencia premium
            antialias: true
        });

        // Controles de zoom
        mapa.addControl(new mapboxgl.NavigationControl(), "top-right");

        // Añadir marcador de origen
        const elOrigen = crearElementoMarcador("🏪", "#2f8f5b");
        marcadorOrigen = new mapboxgl.Marker(elOrigen)
            .setLngLat([ORIGEN.lng, ORIGEN.lat])
            .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                    .setHTML(`<strong>${ORIGEN.nombre}</strong><br>${ORIGEN.direccion}`)
            )
            .addTo(mapa);

        actualizarPanelInfo("Ingresa tu dirección de entrega para ver la ruta y el tiempo estimado.", "info");
    }

    /* ─── Geocodificación directa (de dirección escrita a coordenadas) ─── */
    async function geocodificarDireccion(direccion) {
        const query = `${direccion}, Arequipa, Peru`;
        // Usamos proximidad al centro de despacho para priorizar resultados locales en Arequipa
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=pe&proximity=${ORIGEN.lng},${ORIGEN.lat}&limit=1&language=es`;

        const respuesta = await fetch(url);
        if (!respuesta.ok) throw new Error("Error en geocodificación");

        const datos = await respuesta.json();
        if (!datos.features || datos.features.length === 0) throw new Error("Dirección no encontrada");

        const feature = datos.features[0];
        const [lng, lat] = feature.center;
        return {
            lat,
            lng,
            nombre: feature.place_name
        };
    }

    /* ─── Geocodificación inversa (de coordenadas GPS a dirección legible) ─── */
    async function obtenerDireccionDesdeCoordenadas(lat, lng) {
        // Quitamos la restricción de types=address,poi para que devuelva barrios o urbanizaciones si no hay calle numerada exacta
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=es&limit=1`;
        try {
            const respuesta = await fetch(url);
            if (!respuesta.ok) throw new Error("Error en geocodificación inversa");

            const datos = await respuesta.json();
            if (!datos.features || datos.features.length === 0) return "Avenida Ejército 200, Yanahuara";

            const nombreLugar = datos.features[0].place_name.split(", Peru")[0];
            // Si el nombre devuelto es demasiado genérico, usamos el fallback transitable
            if (nombreLugar.toLowerCase() === "arequipa" || nombreLugar.toLowerCase().includes("arequipa, cercado")) {
                return "Avenida Ejército 200, Yanahuara";
            }
            return nombreLugar;
        } catch (e) {
            console.warn("No se pudo obtener dirección inversa, usando fallback");
            return "Avenida Ejército 200, Yanahuara";
        }
    }

    /* ─── Obtener ruta óptima de Mapbox Directions API ─── */
    async function obtenerRuta(latDestino, lngDestino, profile = "driving") {
        const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${ORIGEN.lng},${ORIGEN.lat};${lngDestino},${latDestino}?access_token=${MAPBOX_TOKEN}&geometries=geojson&overview=full&language=es`;

        const respuesta = await fetch(url);
        if (!respuesta.ok) throw new Error(`Error al calcular ruta con perfil ${profile}`);

        const datos = await respuesta.json();
        if (!datos.routes || datos.routes.length === 0) throw new Error("No hay rutas disponibles");

        return datos.routes[0];
    }

    /* ─── Formatear tiempo (incluyendo preparación) ─── */
    function formatearTiempo(segundos) {
        const tiempoPreparacion = 8 * 60; // 8 min preparación
        const totalMinutos = Math.ceil((segundos + tiempoPreparacion) / 60);

        if (totalMinutos < 60) return `${totalMinutos} min`;
        const horas = Math.floor(totalMinutos / 60);
        const mins = totalMinutos % 60;
        return `${horas}h ${mins}min`;
    }

    /* ─── Formatear distancia ─── */
    function formatearDistancia(metros) {
        if (metros < 1000) return `${Math.round(metros)} m`;
        return `${(metros / 1000).toFixed(1)} km`;
    }

    /* ─── Actualizar panel de información de entrega ─── */
    function actualizarPanelInfo(mensaje, tipo) {
        const panel = document.getElementById("info-ruta");
        if (!panel) return;

        const iconos = {
            info: "ℹ️",
            exito: "✅",
            error: "⚠️",
            cargando: "⏳"
        };

        const colores = {
            info: "#3498db",
            exito: "#2f8f5b",
            error: "#e74c3c",
            cargando: "#f39c12"
        };

        panel.innerHTML = `
            <div class="info-ruta-contenido" style="border-left: 4px solid ${colores[tipo]};">
                <span class="info-ruta-icono">${iconos[tipo]}</span>
                <span class="info-ruta-texto">${mensaje}</span>
            </div>
        `;
    }

    /* ─── Mostrar los detalles de la ruta calculada ─── */
    function mostrarDetallesRuta(distancia, duracion) {
        const panel = document.getElementById("info-ruta");
        if (!panel) return;

        const tiempoFormateado = formatearTiempo(duracion);
        const distanciaFormateada = formatearDistancia(distancia);

        const minMinutos = Math.ceil((duracion + 5 * 60) / 60);
        const maxMinutos = Math.ceil((duracion + 15 * 60) / 60);

        panel.innerHTML = `
            <div class="detalles-ruta">
                <div class="detalle-ruta-item detalle-principal">
                    <span class="detalle-icono">🕐</span>
                    <div>
                        <span class="detalle-etiqueta">Tiempo estimado de entrega</span>
                        <span class="detalle-valor">${tiempoFormateado}</span>
                        <span class="detalle-rango">${minMinutos} – ${maxMinutos} min aprox.</span>
                    </div>
                </div>
                <div class="detalle-ruta-item">
                    <span class="detalle-icono">📏</span>
                    <div>
                        <span class="detalle-etiqueta">Distancia</span>
                        <span class="detalle-valor">${distanciaFormateada}</span>
                    </div>
                </div>
                <div class="detalle-ruta-item">
                    <span class="detalle-icono">🏪</span>
                    <div>
                        <span class="detalle-etiqueta">Sale desde</span>
                        <span class="detalle-valor detalle-valor-sm">${ORIGEN.direccion}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /* ─── Dibujar la línea de ruta en Mapbox GL JS ─── */
    function dibujarRuta(geojson) {
        if (!mapa) return;

        const sourceId = "route-source";
        const layerId = "route-layer";

        // Si ya existe la fuente, actualizamos sus datos
        if (mapa.getSource(sourceId)) {
            mapa.getSource(sourceId).setData(geojson);
        } else {
            // Si no existe, agregamos la fuente y la capa de línea
            mapa.addSource(sourceId, {
                type: "geojson",
                data: geojson
            });

            mapa.addLayer({
                id: layerId,
                type: "line",
                source: sourceId,
                layout: {
                    "line-join": "round",
                    "line-cap": "round"
                },
                paint: {
                    "line-color": "#2f8f5b",
                    "line-width": 5,
                    "line-opacity": 0.85
                }
            });
        }

        // Ajustar la cámara para englobar toda la ruta de forma fluida (fitBounds)
        const coordinates = geojson.coordinates;
        const bounds = new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]);
        coordinates.forEach(coord => bounds.extend(coord));

        mapa.fitBounds(bounds, {
            padding: 50,
            maxZoom: 16
        });
    }

    /* ─── Función principal: calcular la ruta completa ─── */
    async function calcularRuta() {
        const inputDireccion = document.getElementById("pedido-direccion");
        const selectMetodo = document.getElementById("pedido-metodo-entrega");
        const seccionMapa = document.getElementById("seccion-mapa-ruta");

        if (!inputDireccion || !seccionMapa) return;

        if (selectMetodo && selectMetodo.value !== "delivery") {
            seccionMapa.style.display = "none";
            return;
        }

        const direccion = inputDireccion.value.trim();
        if (direccion.length < 5) {
            actualizarPanelInfo("Ingresa tu dirección de entrega para calcular la ruta.", "info");
            return;
        }

        seccionMapa.style.display = "block";
        inicializarMapa();

        actualizarPanelInfo("Buscando tu ubicación y trazando la ruta óptima...", "cargando");

        let destino;
        try {
            // 1. Obtener coordenadas del destino
            destino = await geocodificarDireccion(direccion);
        } catch (errGeocod) {
            console.warn("Geocodificación falló:", errGeocod);
            actualizarPanelInfo(
                `No pudimos encontrar "${direccion}" en el mapa. Intenta agregar el distrito (ej: "Santa Clara 905, Paucarpata").`,
                "error"
            );
            return;
        }

        // 2. Colocar marcador en el destino
        if (marcadorDestino) marcadorDestino.remove();

        const elDestino = crearElementoMarcador("📍", "#e74c3c");
        marcadorDestino = new mapboxgl.Marker(elDestino)
            .setLngLat([destino.lng, destino.lat])
            .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                    .setHTML(`<strong>Tu dirección</strong><br>${typeof escapeHTML === 'function' ? escapeHTML(direccion) : direccion}`)
            )
            .addTo(mapa);

        // 3. Obtener la ruta
        let datosRuta = null;
        try {
            // Intentar primero con conducción para autos
            datosRuta = await obtenerRuta(destino.lat, destino.lng, "driving");
        } catch (errDriving) {
            console.warn("Ruta para autos falló (posibles restricciones peatonales o de sentido). Intentando ruta a pie...", errDriving);
            try {
                // Fallback a ruta a pie (caminando) para asegurar el trazado del camino
                datosRuta = await obtenerRuta(destino.lat, destino.lng, "walking");
            } catch (errWalking) {
                console.error("Ruta a pie también falló:", errWalking);
                actualizarPanelInfo(
                    "No pudimos trazar un camino viable en el mapa. Asegúrate de ingresar una calle transitable cercana.",
                    "error"
                );
                return;
            }
        }

        // 4. Asegurarnos que el mapa está cargado antes de agregar capas y renderizar
        if (datosRuta) {
            const geojsonGeometry = datosRuta.geometry;
            const distancia = datosRuta.distance;
            const duracion = datosRuta.duration;

            if (!mapa.loaded()) {
                mapa.once("load", () => {
                    dibujarRuta(geojsonGeometry);
                    mostrarDetallesRuta(distancia, duracion);
                });
            } else {
                dibujarRuta(geojsonGeometry);
                mostrarDetallesRuta(distancia, duracion);
            }
        }
    }

    /* ─── Inicialización al cargar el DOM ─── */
    document.addEventListener("DOMContentLoaded", () => {
        const inputDireccion = document.getElementById("pedido-direccion");
        const selectMetodo = document.getElementById("pedido-metodo-entrega");
        const btnCalcular = document.getElementById("btn-calcular-ruta");
        const btnUbicacion = document.getElementById("btn-mi-ubicacion");
        const seccionMapa = document.getElementById("seccion-mapa-ruta");

        if (!inputDireccion || !seccionMapa) return;

        /* Botón de calcular ruta */
        if (btnCalcular) {
            btnCalcular.addEventListener("click", (e) => {
                e.preventDefault();
                calcularRuta();
            });
        }

        /* Botón de ubicación actual */
        if (btnUbicacion) {
            btnUbicacion.addEventListener("click", (e) => {
                e.preventDefault();
                if (!navigator.geolocation) {
                    alert("Tu navegador o dispositivo no permite buscar tu ubicación. Por favor escribe tu dirección en la casilla.");
                    return;
                }

                btnUbicacion.textContent = "⏳ Buscando...";
                btnUbicacion.disabled = true;

                const opcionesPrecision = {
                    enableHighAccuracy: true,
                    timeout: 8000,
                    maximumAge: 10000
                };

                const alExito = async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    try {
                        const latArequipa = -16.409047;
                        const lngArequipa = -71.537451;
                        const estaEnArequipa = Math.abs(lat - latArequipa) < 0.25 && Math.abs(lng - lngArequipa) < 0.25;

                        let direccion = "";
                        if (estaEnArequipa) {
                            direccion = await obtenerDireccionDesdeCoordenadas(lat, lng);
                        } else {
                            direccion = "Avenida Ejército 200, Yanahuara";
                            alert("📍 Para facilitar tu prueba local, hemos rellenado una dirección de prueba en Yanahuara, Arequipa.");
                        }

                        inputDireccion.value = direccion;
                        btnUbicacion.textContent = "📍 Mi ubicación";
                        btnUbicacion.disabled = false;

                        // Calcular ruta automáticamente
                        calcularRuta();
                    } catch (err) {
                        inputDireccion.value = "Avenida Ejército 200, Yanahuara";
                        btnUbicacion.textContent = "📍 Mi ubicación";
                        btnUbicacion.disabled = false;
                        calcularRuta();
                    }
                };

                const alError = (error) => {
                    if (opcionesPrecision.enableHighAccuracy) {
                        console.warn("Fallo GPS de alta precisión, intentando precisión estándar por red/IP...");
                        /* FIX QA H10 — Crear opciones frescas para no mutar el objeto original */
                        const opcionesRed = { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 };
                        navigator.geolocation.getCurrentPosition(alExito, alErrorFinal, opcionesRed);
                    } else {
                        alErrorFinal(error);
                    }
                };

                const alErrorFinal = (error) => {
                    console.warn("Geolocalización no disponible o denegada, usando dirección de prueba:", error.message);
                    inputDireccion.value = "Avenida Ejército 200, Yanahuara";
                    btnUbicacion.textContent = "📍 Mi ubicación";
                    btnUbicacion.disabled = false;
                    calcularRuta();
                };

                // Iniciar la geolocalización híbrida
                navigator.geolocation.getCurrentPosition(alExito, alError, opcionesPrecision);
            });
        }

        /* También calcular al presionar Enter en el campo de dirección */
        inputDireccion.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                calcularRuta();
            }
        });

        /* Ocultar/mostrar la sección de mapa según la modalidad */
        if (selectMetodo) {
            const seccionDireccion = document.getElementById("seccion-direccion-cliente");
            const infoRecojo = document.getElementById("info-recojo-tienda");

            const manejarCambioModalidad = () => {
                if (selectMetodo.value === "recojo") {
                    // 1. Mostrar panel informativo de recojo y ocultar dirección del cliente
                    if (infoRecojo) infoRecojo.classList.remove("hidden");
                    if (seccionDireccion) seccionDireccion.classList.add("hidden");
                    
                    // 2. Rellenar input dirección y quitar required
                    inputDireccion.value = "Recojo en tienda: Calle Jerusalén 200, Cercado";
                    inputDireccion.removeAttribute("required");

                    // 3. Mostrar sección de mapa y centrar sobre el local (Origen) con buen zoom
                    seccionMapa.style.display = "block";
                    inicializarMapa();

                    // Ocultar marcadores de ruta y destino si existían
                    if (marcadorDestino) {
                        marcadorDestino.remove();
                        marcadorDestino = null;
                    }
                    if (mapa) {
                        const sourceId = "route-source";
                        if (mapa.getSource(sourceId)) {
                            // Limpiar la línea de la ruta
                            mapa.getSource(sourceId).setData({
                                type: "FeatureCollection",
                                features: []
                            });
                        }
                        // Centrar mapa de forma fluida en la tienda
                        mapa.flyTo({
                            center: [ORIGEN.lng, ORIGEN.lat],
                            zoom: 16,
                            pitch: 45,
                            essential: true
                        });
                    }

                    // Actualizar panel informativo
                    actualizarPanelInfo("🏃 Recoge tu pedido en nuestro local principal. No aplica costo de delivery.", "exito");

                } else {
                    // Modalidad: Delivery
                    // 1. Ocultar panel informativo de recojo y mostrar dirección del cliente
                    if (infoRecojo) infoRecojo.classList.add("hidden");
                    if (seccionDireccion) seccionDireccion.classList.remove("hidden");

                    // 2. Restaurar required e input
                    inputDireccion.setAttribute("required", "");
                    if (inputDireccion.value.startsWith("Recojo en tienda")) {
                        inputDireccion.value = "";
                        seccionMapa.style.display = "none";
                        actualizarPanelInfo("Ingresa tu dirección de entrega para ver la ruta y el tiempo estimado.", "info");
                    } else if (inputDireccion.value.trim().length >= 5) {
                        calcularRuta();
                    } else {
                        seccionMapa.style.display = "none";
                    }
                }
            };

            selectMetodo.addEventListener("change", manejarCambioModalidad);
            
            // Ejecutar al iniciar por si viene pre-seleccionado
            setTimeout(manejarCambioModalidad, 200);
        }
    });
})();
