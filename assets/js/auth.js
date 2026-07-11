document.addEventListener("DOMContentLoaded", () => {

    /* REGISTRO (registrar.html) */
    document.getElementById("form-registrar")?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("reg-correo").value;
        const password = document.getElementById("reg-password-ref").value;
        const nombre = document.getElementById("reg-nombre").value;
        const apellido = document.getElementById("reg-apellido").value; // NUEVO: Atrapamos apellido
        const telefono = document.getElementById("reg-telefono").value;
        const direccion = document.getElementById("reg-direccion").value;

        if (password !== document.getElementById("reg-confirm").value) {
            return alert("Las contraseñas no coinciden.");
        }

        // 1. Guardamos en el sistema Auth
        const { data, error } = await miSupabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: nombre,
                    last_name: apellido,
                    phone: telefono,
                    address: direccion
                }
            }
        });

        if (error) return alert("Error: " + error.message);

        // 2. Guardamos en la tabla pública 'usuarios'
        if (data && data.user) {
            const { error: errorBD } = await miSupabase.from('usuarios').insert([{
                id: data.user.id,
                nombre: nombre,
                apellidos: apellido, // NUEVO: Guardamos apellido
                correo: email,
                telefono: telefono,
                direccion: direccion
            }]);

            if (errorBD) console.error("Error al guardar usuario:", errorBD);
        }

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

    /* FALLO CORREGIDO: faltaba el envío del formulario para guardar la nueva
       contraseña (actualizar_password.html); el botón no hacía nada */
    document.getElementById("form-actualizar-password")?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nuevaPassword = document.getElementById("new-password").value;

        const { error } = await miSupabase.auth.updateUser({ password: nuevaPassword });

        if (error) return alert("Error: " + error.message);

        alert("✅ Contraseña actualizada con éxito. Ahora puedes iniciar sesión.");
        window.location.href = "login.html";
    });
});