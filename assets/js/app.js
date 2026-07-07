/* CONEXIÓN PRINCIPAL CON LA BASE DE DATOS (SUPABASE) */
const miSupabase = supabase.createClient(
    'https://xuuajupcjxmpglatxmqf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1dWFqdXBjanhtcGdsYXR4bXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTkxMjUsImV4cCI6MjA5NTEzNTEyNX0.PSR8OjJxJXD4a6GPiJPl946MsGR2PifJCMNJta9dvXc'
);

/* INTERACCIÓN Y LOGUEO DE LA PÁGINA (AL CARGAR EL DOCUMENTO) */
document.addEventListener("DOMContentLoaded", async () => {

    // 1. Obtener el usuario autenticado actual
    const { data: { user } } = await miSupabase.auth.getUser();

    if (user) {
        // Buscar al usuario en tu tabla pública 'usuarios' usando su ID único
        const { data: usuarioBase } = await miSupabase
            .from('usuarios')
            .select('nombre_completo, telefono, direccion')
            .eq('id', user.id)
            .single();

        // Si lo encuentra en tu base de datos, usamos esos datos; si no, el correo cortado
        const nombre = usuarioBase?.nombre_completo || user.email.split('@')[0];
        const telefono = usuarioBase?.telefono || "";
        const direccion = usuarioBase?.direccion || "";

        /* CUANDO INGRESAMOS CAMBIA DE INGRESAR A HOLA, "USUARIO" */
        const boton = document.querySelector(".enlace-destacado");
        if (boton) {
            const esIndex = window.location.pathname.includes("index.html") || window.location.pathname === "/";
            boton.href = esIndex ? "pages/perfil.html" : "perfil.html";
            boton.innerHTML = `👤 Hola, ${nombre}`;
        }

        /* RELLENA LOS IMPUTS DE AUTOMATICAMENTE PERFIL.HTML */
        const formPerfil = document.getElementById("form-perfil");
        if (formPerfil) {
            document.getElementById("perf-nombre").value = nombre;
            document.getElementById("perf-telefono").value = telefono;
            document.getElementById("perf-direccion").value = direccion;
        }

        /* RELLENA EL APARTADO DEL FORMULARIO_PEDIDO (form_pedido.html) */
        const formPedido = document.getElementById("form-pedido");
        if (formPedido) {
            document.getElementById("pedido-nombre").value = nombre;
            document.getElementById("pedido-telefono").value = telefono;
            document.getElementById("pedido-direccion").value = direccion;
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
                contenedorPedidos.innerHTML = pedidos.map(pedido => {
                    const fechaFormateada = new Date(pedido.fecha_pedido).toLocaleDateString();

                    return `
                    <div style="background: #fff; padding: 15px; border-radius: 8px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-left: 4px solid #2f8f5b;">
                        <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 6px;">
                            <span>📦 Pedido #${pedido.id.slice(0, 8)}</span>
                            <span style="color: #2f8f5b;">S/ ${parseFloat(pedido.total_final).toFixed(2)}</span>
                        </div>
                        <div style="font-size: 13px; color: #666;">
                            <p><strong>Modalidad:</strong> ${pedido.modalidad}</p>
                            <p><strong>Pago:</strong> ${pedido.metodo_pago}</p>
                            <p><strong>Estado:</strong> <span style="background: #fef3c7; color: #d97706; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${pedido.estado}</span></p>
                            <p><strong>Fecha:</strong> ${fechaFormateada}</p>
                        </div>
                    </div>
                `}).join('');
            }
        }
    }

    /* FUNCIONALIDAD DE CERRAR SESIÓN EN PERFIL.HTML */
    const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", async () => {
            await miSupabase.auth.signOut();
            const esIndex = window.location.pathname.includes("index.html") || window.location.pathname === "/";
            window.location.href = esIndex ? "index.html" : "../index.html";
        });
    }
});

/* MENÚ HAMBURGUESA */

const botonMenu = document.getElementById('btn-menu');
const listaMenu = document.getElementById('menu-nav');

if (botonMenu && listaMenu) {
    botonMenu.addEventListener('click', function () {
        listaMenu.classList.toggle('mostrar');
    });
}