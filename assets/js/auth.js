document.addEventListener("DOMContentLoaded", () => {
    const formRegistro = document.getElementById('form-registro');
    if (formRegistro) {
        const btnRegistrar = document.getElementById('btn-registrar');
        if (btnRegistrar) {
            btnRegistrar.addEventListener('click', async (e) => {
                e.preventDefault();
                const nombre = document.getElementById('reg-nombre').value.trim();
                const telefono = document.getElementById('reg-telefono').value.trim();
                const correo = document.getElementById('reg-correo').value.trim();
                const direccion = document.getElementById('reg-direccion').value.trim();
                const password = document.getElementById('reg-password').value;
                const confirm = document.getElementById('reg-confirm').value;
                if (!nombre || !telefono || !correo || !direccion) return mostrarError('Por favor completa todos los campos.');
                if (password !== confirm) return mostrarError('Las contraseñas no coinciden.');
                if (password.length < 6) return mostrarError('La contraseña debe tener al menos 6 caracteres.');
                btnRegistrar.textContent = "⏳ Creando cuenta...";
                btnRegistrar.disabled = true;
                try {
                    const { data, error } = await miSupabase.auth.signUp({ email: correo, password: password });
                    if (error) throw new Error(error.message);
                    if (data.user) {
                        await miSupabase.from('usuarios').insert([{ id: data.user.id, nombre_completo: nombre, correo: correo, telefono: telefono, direccion: direccion }]);
                    }
                    const toast = document.getElementById('toast-registro');
                    if (toast) toast.style.display = 'block';
                    setTimeout(() => { window.location.href = "/pages/login.html"; }, 1800);
                } catch (err) {
                    mostrarError('Error al registrar: ' + (err.message || 'Intenta nuevamente.'));
                    btnRegistrar.textContent = "✅ Crear mi cuenta gratis";
                    btnRegistrar.disabled = false;
                }
            });
        }
    }
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            if (!email || !password) return mostrarError('Completa tu correo y contraseña.');
            loginBtn.textContent = "Verificando...";
            loginBtn.disabled = true;
            const { error } = await miSupabase.auth.signInWithPassword({ email: email, password: password });
            if (!error) window.location.href = "/index.html";
            else {
                mostrarError('Correo o contraseña incorrectos.');
                loginBtn.textContent = "🔑 Iniciar Sesión";
                loginBtn.disabled = false;
            }
        });
    }
    const formRecuperar = document.getElementById('form-recuperar');
    if (formRecuperar) {
        const btnRecuperar = formRecuperar.querySelector('button');
        if (btnRecuperar) {
            btnRecuperar.addEventListener('click', async (e) => {
                e.preventDefault();
                const email = document.getElementById('rec-email').value.trim();
                btnRecuperar.textContent = "Enviando...";
                btnRecuperar.disabled = true;
                const urlRedireccion = window.location.href.replace('recuperar.html', 'actualizar_password.html');
                const { error } = await miSupabase.auth.resetPasswordForEmail(email, { redirectTo: urlRedireccion });
                if (error) {
                    mostrarError('Error: ' + error.message);
                    btnRecuperar.textContent = "✉️ Enviar Enlace";
                    btnRecuperar.disabled = false;
                } else {
                    alert("¡Enlace enviado! Revisa tu bandeja de entrada o Spam.");
                    window.location.href = "/pages/login.html";
                }
            });
        }
    }
    const formActualizar = document.getElementById('form-actualizar');
    if (formActualizar) {
        const btnActualizar = formActualizar.querySelector('button');
        if (btnActualizar) {
            btnActualizar.addEventListener('click', async (e) => {
                e.preventDefault();
                const newPassword = document.getElementById('new-password').value;
                btnActualizar.textContent = "Guardando...";
                btnActualizar.disabled = true;
                const { error } = await miSupabase.auth.updateUser({ password: newPassword });
                if (error) {
                    mostrarError('Error: ' + error.message);
                    btnActualizar.textContent = "💾 Guardar";
                    btnActualizar.disabled = false;
                } else {
                    alert("¡Contraseña actualizada correctamente!");
                    window.location.href = "/index.html";
                }
            });
        }
    }
    function mostrarError(mensaje) {
        let errEl = document.getElementById('auth-error-msg');
        if (!errEl) {
            errEl = document.createElement('div');
            errEl.id = 'auth-error-msg';
            errEl.className = 'error-msg mt-1 mb-1 p-1 card text-rojo font-bold text-center';
            errEl.style.background = '#fff0f0';
            const form = document.querySelector('form');
            if (form) form.prepend(errEl);
        }
        errEl.innerHTML = `⚠️ ${mensaje}`;
        errEl.style.display = 'block';
        setTimeout(() => { errEl.style.display = 'none'; }, 4000);
    }
});