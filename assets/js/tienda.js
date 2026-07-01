/* CATÁLOGO, CARRITO, STOCK Y HISTORIAL */
const CATALOGO = {
    "lomo_pasta": { nombre: "Lomo Saltado con Pasta", precio: 16.00 },
    "ensalada_cesar": { nombre: "Ensalada César Especial", precio: 12.00 },
    "pollo_brasa": { nombre: "Pollo a la Brasa", precio: 20.00 },
    "menu_dia": { nombre: "Menú del Día Completo", precio: 13.00 },
    "tiramisu": { nombre: "Tiramisú Artesanal", precio: 9.00 },
    "smoothie": { nombre: "Smoothie Verde Detox", precio: 7.00 },
    "tallarines_verdes": { nombre: "Tallarines Verdes", precio: 18.00 },
    "rocoto_relleno": { nombre: "Rocoto Relleno", precio: 22.00 },
    "alitas_bbq": { nombre: "Alitas BBQ (6 pz)", precio: 15.00 },
    "crema_volteada": { nombre: "Crema Volteada", precio: 8.00 },
    "chicha_morada": { nombre: "Chicha Morada (1L)", precio: 6.00 },
    "ensalada_quinua": { nombre: "Ensalada Quinua", precio: 10.00 },
    "ceviche_mixto": { nombre: "Ceviche Mixto", precio: 30.00 },
    "aji_gallina": { nombre: "Ají de Gallina", precio: 18.00 },
    "arroz_chaufa": { nombre: "Arroz Chaufa", precio: 20.00 },
    "causa_limena": { nombre: "Causa Limeña", precio: 12.00 },
    "tequenos": { nombre: "Tequeños", precio: 10.00 },
    "jugo_maracuya": { nombre: "Jugo de Maracuyá", precio: 7.00 },
    "pizza_hawaiana": { nombre: "Pizza Hawaiana", precio: 25.00 },
    "lasagna_carne": { nombre: "Lasagna de Carne", precio: 22.00 },
    "picarones": { nombre: "Picarones", precio: 10.00 },
    "helado_artesanal": { nombre: "Helado Artesanal", precio: 8.00 }
};

document.addEventListener('DOMContentLoaded', async () => {

    // FILTROS DE TODAS LAS CATEGORIAS "MENU.HTML"
    const botonesFiltro = document.querySelectorAll('.filtro-btn');
    if (botonesFiltro.length > 0) {
        const tarjetasMenu = document.querySelectorAll('.menu-card');
        botonesFiltro.forEach(btn => {
            btn.addEventListener('click', () => {
                botonesFiltro.forEach(b => b.classList.remove('activo'));
                btn.classList.add('activo');
                const cat = btn.dataset.filtro;
                tarjetasMenu.forEach(t => t.style.display = (cat === 'todos' || t.dataset.categoria === cat) ? 'flex' : 'none');
            });
        });
    }

    // COMPRAS Y PASAR POR CAJA "FORMPEDIDOS.HTML"
    const formCompras = document.getElementById('form-compras');
    if (formCompras) {
        const { data: { session } } = await miSupabase.auth.getSession();
        if (!session) { alert("Debes iniciar sesión para comprar."); window.location.href = "/pages/login.html"; return; }

        // Obtenemos el stock de la BD SOLO cuando el usuario está en la pantalla de compras
        let mapaStock = {};
        const { data: inv } = await miSupabase.from('productos').select('id, stock_actual');
        if (inv) inv.forEach(p => mapaStock[p.id] = p.stock_actual);

        const { data: perfil } = await miSupabase.from('usuarios').select('*').eq('id', session.user.id).single();
        if (perfil) {
            document.getElementById('nombre_cliente').value = perfil.nombre_completo || '';
            document.getElementById('direccion').value = perfil.direccion || '';
            document.getElementById('telefono').value = perfil.telefono || '';
        }

        let carrito = {}; Object.keys(CATALOGO).forEach(id => carrito[id] = 0);
        const metodoEntrega = document.getElementById('metodo');
        
        const recalculada = () => {
            let subt = 0, h = "";
            Object.entries(carrito).forEach(([id, cant]) => {
                if (cant > 0) {
                    subt += cant * CATALOGO[id].precio;
                    h += `<div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:6px;"><span><strong>${cant}x</strong> ${CATALOGO[id].nombre}</span><span>S/ ${(cant * CATALOGO[id].precio).toFixed(2)}</span></div>`;
                }
            });
            document.getElementById('resumen-lista-platos').innerHTML = h || `<p class="resumen-vacio">Tu carrito está vacío.</p>`;
            const envio = metodoEntrega.value === 'delivery' ? 3.00 : 0.00;
            document.getElementById('resumen-texto-entrega').textContent = metodoEntrega.value === 'delivery' ? "Delivery a domicilio" : "Recojo en tienda";
            document.getElementById('resumen-subtotal').textContent = `S/ ${subt.toFixed(2)}`;
            document.getElementById('resumen-delivery').textContent = `S/ ${envio.toFixed(2)}`;
            document.getElementById('resumen-total-final').textContent = `S/ ${(subt + envio).toFixed(2)}`;
        };

        document.querySelectorAll('.plato-card-content').forEach(card => {
            const id = card.dataset.id; const stockMax = mapaStock[id] !== undefined ? mapaStock[id] : 999;
            if (stockMax <= 0) { card.style.opacity = "0.5"; card.querySelector('.precio-check').textContent = "Agotado"; }
            card.querySelector('.btn-mas').addEventListener('click', (e) => {
                e.preventDefault();
                if (carrito[id] >= stockMax) return alert(`Stock máximo alcanzado (${stockMax} u).`);
                carrito[id]++; card.querySelector('.cant-numero').textContent = carrito[id]; card.classList.add('activo'); recalculada();
            });
            card.querySelector('.btn-menos').addEventListener('click', (e) => {
                e.preventDefault();
                if (carrito[id] > 0) {
                    carrito[id]--; card.querySelector('.cant-numero').textContent = carrito[id];
                    if (carrito[id] === 0) card.classList.remove('activo'); recalculada();
                }
            });
        });

        metodoEntrega.addEventListener('change', recalculada);

        const platoURL = new URLSearchParams(window.location.search).get('plato');
        if (platoURL && carrito[platoURL] !== undefined && (mapaStock[platoURL] !== undefined ? mapaStock[platoURL] : 999) > 0) {
            carrito[platoURL] = 1; document.querySelector(`.plato-card-content[data-id="${platoURL}"]`).classList.add('activo');
            document.querySelector(`.plato-card-content[data-id="${platoURL}"] .cant-numero`).textContent = "1"; recalculada();
        }

        document.querySelectorAll('input[name="metodo_pago"]').forEach(r => {
            r.addEventListener('change', (e) => {
                const req = e.target.value === 'Tarjeta';
                document.getElementById('formulario-tarjeta').style.display = req ? 'block' : 'none';
            });
        });

        formCompras.querySelector('button[type="submit"]').addEventListener('click', async (e) => {
            e.preventDefault();
            let sel = []; let subt = 0;
            Object.entries(carrito).forEach(([id, cant]) => { if (cant > 0) { sel.push({ id, cant, precio: CATALOGO[id].precio }); subt += cant * CATALOGO[id].precio; } });
            if (sel.length === 0) return alert("Por favor, selecciona al menos un plato de la lista.");

            formCompras.querySelector('button[type="submit"]').disabled = true;
            const envio = metodoEntrega.value === 'delivery' ? 3.0 : 0;
            const modal = metodoEntrega.value === 'delivery' ? 'Delivery' : 'Recojo en tienda';
            const pago = document.querySelector('input[name="metodo_pago"]:checked').value;
            const notas = document.getElementById('notas').value;

            document.getElementById('pantalla-carga').style.display = 'flex';

            setTimeout(async () => {
                document.getElementById('spinner-carga').style.display = 'none';
                document.getElementById('icono-exito').style.display = 'block';

                const { data: pedBD, error: errPed } = await miSupabase.from('pedidos').insert([{ usuario_id: session.user.id, metodo_pago: pago, modalidad: modal, costo_envio: envio, total_final: subt + envio, estado: 'Pendiente', notas: notas }]).select().single();
                
                if (errPed) { alert("Error al procesar la cabecera."); return; }

                const dets = sel.map(p => ({ pedido_id: pedBD.id, producto_id: p.id, cantidad: p.cant, precio_unitario: p.precio }));
                const { error: errDet } = await miSupabase.from('pedido_detalles').insert(dets);
                
                if (!errDet) window.location.href = "/pages/pedidos.html";
            }, 2000);
        });
    }

    // DATOS DEL PERFIL "PERFIL.HTML"
    const formPerfil = document.getElementById('form-perfil');
    if (formPerfil) {
        const { data: { session } } = await miSupabase.auth.getSession();
        if (!session) { alert("Debes iniciar sesión para ver tu perfil."); window.location.href = "/pages/login.html"; return; }

        // Precargamos los datos actuales del usuario para no perderlos al guardar
        const { data: perfil } = await miSupabase.from('usuarios').select('*').eq('id', session.user.id).single();
        if (perfil) {
            document.getElementById('perf-nombre').value = perfil.nombre_completo || '';
            document.getElementById('perf-telefono').value = perfil.telefono || '';
            document.getElementById('perf-direccion').value = perfil.direccion || '';
        }

        formPerfil.querySelector('button[type="submit"]').addEventListener('click', async (e) => {
            e.preventDefault();
            const { error } = await miSupabase.from('usuarios').upsert({ 
                id: session.user.id, 
                nombre_completo: document.getElementById('perf-nombre').value, 
                telefono: document.getElementById('perf-telefono').value, 
                direccion: document.getElementById('perf-direccion').value 
            });
            alert(error ? "Error: " + error.message : "¡Cambios guardados con éxito!");
        });
    }

    // HISTORIAL DE COMPRAS DE "PEDIDOS.HTML"
    const divHistorial = document.getElementById('contenedor-historial');
    if (divHistorial) {
        const { data: { session } } = await miSupabase.auth.getSession();
        if (!session) { alert("Debes iniciar sesión para ver tus pedidos."); window.location.href = "/pages/login.html"; return; }

        const { data: pedidos, error: errHistorial } = await miSupabase.from('pedidos').select(`id, fecha_pedido, total_final, estado, modalidad, metodo_pago, pedido_detalles(cantidad, precio_unitario, producto_id)`).eq('usuario_id', session.user.id).order('fecha_pedido', { ascending: false });

        if (errHistorial) {
            console.error('Error al cargar el historial de pedidos:', errHistorial);
            divHistorial.innerHTML = `<p class="resumen-vacio" style="color:var(--rojo)">⚠️ No se pudo cargar tu historial: ${errHistorial.message}</p>`;
            return;
        }

        if (!pedidos || pedidos.length === 0) divHistorial.innerHTML = `<p class="resumen-vacio" style="text-align:center; padding:40px;">No has realizado órdenes de rescate todavía.</p>`;
        else {
            let html = "";
            pedidos.forEach(p => {
                const fecha = new Date(p.fecha_pedido).toLocaleDateString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
                let dets = "";
                p.pedido_detalles.forEach(d => { dets += `• <strong>${d.cantidad}x</strong> ${CATALOGO[d.producto_id]?.nombre || d.producto_id} (S/ ${d.precio_unitario.toFixed(2)})<br>`; });
                html += `
                <div class="pedido-item">
                    <div class="pedido-header-row"><div><span class="pedido-id">🆔 Orden #${p.id.substring(0, 8)}...</span><div class="pedido-fecha">📅 ${fecha}</div></div></div>
                    <div class="pedido-detalles-lista">${dets}<div class="pedido-detalles-info">🛵 ${p.modalidad} | 💳 ${p.metodo_pago}</div></div>
                    <div class="pedido-footer-row"><span>Total Pagado:</span><span class="txt-verde-oscuro">S/ ${p.total_final.toFixed(2)}</span></div>
                </div>`;
            });
            divHistorial.innerHTML = html;
        }
    }
});