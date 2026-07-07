document.addEventListener("DOMContentLoaded", () => {
    
    /* REGISTRO (registrar.html) */
    document.getElementById("form-registrar")?.addEventListener("submit", async (e) => {
        e.preventDefault(); /*Evita que la página se recargue sola*/
        
        const email = document.getElementById("reg-correo").value;
        const password = document.getElementById("reg-password-ref").value;

        if (password !== document.getElementById("reg-confirm").value) {
            return alert("Las contraseñas no coinciden.");
        }

        const { error } = await miSupabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: document.getElementById("reg-nombre").value,
                    phone: document.getElementById("reg-telefono").value,
                    address: document.getElementById("reg-direccion").value
                }
            }
        });

        if (error) return alert("Error: " + error.message);
        
        // Muestra el aviso nativo de tu HTML y redirige
        document.getElementById("aviso-cuenta-creada").style.display = "block";
        setTimeout(() => window.location.href = "login.html", 2000);
    });

    /* INICIO DE SESIÓN (login.html) */
    document.getElementById("form-login")?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const { error } = await miSupabase.auth.signInWithPassword({
            email: document.getElementById("login-email").value,
            password: document.getElementById("login-password").value
        });

        if (error) return alert("Credenciales incorrectas: " + error.message);
        window.location.href = "menu.html";
    });

    /* RECUPERAR CONTRASEÑA (recuperar.html) */
    document.getElementById("form-recuperar")?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const { error } = await miSupabase.auth.resetPasswordForEmail(
            document.getElementById("rec-email").value, 
            { redirectTo: window.location.origin + '/pages/actualizar_password.html' }
        );

        alert(error ? "Error: " + error.message : "Se ha enviado un enlace de recuperación a tu correo.");
    });
});