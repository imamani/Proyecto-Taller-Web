const miSupabase = supabase.createClient(
    'https://xuuajupcjxmpglatxmqf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1dWFqdXBjanhtcGdsYXR4bXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTkxMjUsImV4cCI6MjA5NTEzNTEyNX0.PSR8OjJxJXD4a6GPiJPl946MsGR2PifJCMNJta9dvXc'
);
document.addEventListener("DOMContentLoaded", async () => {
    // CERRAR SESIÓN (botón de la sidebar "Mi Cuenta" en perfil.html y pedidos.html)
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async (e) => {
            e.preventDefault();
            await miSupabase.auth.signOut();
            window.location.href = "/index.html";
        });
    }

    // MENÚ HAMBURGUESA PARA MÓVIL
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('nav-menu');
    const overlay = document.getElementById('sidebar-overlay');
    if (hamburgerBtn && navMenu && overlay) {
        const cerrarMenu = () => {
            navMenu.classList.remove('mostrar');
            overlay.classList.remove('mostrar');
        };
        hamburgerBtn.addEventListener('click', () => {
            navMenu.classList.toggle('mostrar');
            overlay.classList.toggle('mostrar');
        });
        overlay.addEventListener('click', cerrarMenu);
        navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', cerrarMenu));
    }

    const { data: { session } } = await miSupabase.auth.getSession();
    if (session) {
        const btnIngresar = document.querySelector('a[href*="login.html"]'); if (btnIngresar) {
            const { data: perfil } = await miSupabase.from('usuarios').select('nombre_completo').eq('id', session.user.id).single();
            if (perfil) {
                const primerNombre = perfil.nombre_completo.split(' ')[0];
                const liPadre = btnIngresar.parentElement;
                liPadre.innerHTML = `
                    <div style="position: relative; display: inline-block;">
                        <a href="#" id="usuario-perfil-btn" class="btn btn-naranja btn-auto" style="padding:.5rem 1rem">👤 Hola, ${primerNombre}</a>
                        <div id="perfil-dropdown" class="dropdown-menu">
                            <a href="/pages/perfil.html">⚙️ Mis Datos</a>
                            <a href="/pages/pedidos.html">📦 Mis Pedidos</a>
                            <a href="#" id="btn-cerrar-sesion" class="text-rojo">Anular Sesión 🚪</a>
                        </div>
                    </div>
                `;
                const btnDropdown = document.getElementById('usuario-perfil-btn');
                const dropdown = document.getElementById('perfil-dropdown');
                if (btnDropdown && dropdown) {
                    btnDropdown.addEventListener('click', (e) => {
                        e.preventDefault();
                        dropdown.classList.toggle("mostrar");
                    });
                }
                document.addEventListener('click', async (e) => {
                    if (e.target.id === 'btn-cerrar-sesion') {
                        e.preventDefault();
                        await miSupabase.auth.signOut();
                        window.location.href = "/index.html";
                    }
                    if (btnDropdown && !btnDropdown.contains(e.target) && dropdown && !dropdown.contains(e.target)) {
                        dropdown.classList.remove("mostrar");
                    }
                });
            }
        }
    }
});