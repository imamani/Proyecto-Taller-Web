function validarCorreoElectronico(correo) {
    correo = (correo || "").trim();

    if (correo.length === 0) return "El correo electrónico es obligatorio.";
    if (correo.length > 254) return "Ese correo es demasiado largo.";
    if (/\s/.test(correo)) return "El correo no puede contener espacios.";
    if (!correo.includes("@")) return "El correo debe contener el símbolo @ (ej: nombre@correo.com).";
    if ((correo.match(/@/g) || []).length > 1) return "El correo solo puede tener un símbolo @.";

    const [usuario, dominio] = correo.split("@");

    if (!usuario || usuario.length === 0) return "Falta el nombre de usuario antes del @.";
    if (!dominio || dominio.length === 0) return "Falta el dominio después del @ (ej: gmail.com).";
    if (usuario.startsWith(".") || usuario.endsWith(".") || usuario.includes("..")) {
        return "El correo no puede tener puntos seguidos, ni al inicio o al final.";
    }
    if (!dominio.includes(".")) {
        return "El dominio debe incluir una extensión, ej: .com, .pe, .org, .net.";
    }
    if (dominio.startsWith(".") || dominio.endsWith(".") || dominio.startsWith("-") || dominio.endsWith("-")) {
        return "El dominio del correo no es válido.";
    }

    /* Patrón general: usuario válido @ subdominios válidos . extensión de letras */
    const patronCorreo = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!patronCorreo.test(correo)) {
        return "Escribe un correo válido, ejemplo: nombre@correo.com";
    }

    const extension = dominio.split(".").pop();
    if (!/^[a-zA-Z]{2,}$/.test(extension)) {
        return "La extensión del dominio no es válida (ej: .com, .pe, .net, .org).";
    }

    return null; /* correo válido */
}

const CONTRASENAS_COMUNES = [
    "12345678", "123456789", "1234567890", "87654321", "qwerty123",
    "password", "contraseña", "contrasena", "abcdefgh", "11111111",
    "00000000", "asdfghjk", "123123123", "qwertyui", "aaaaaaaa",
    "administrador", "bienvenido", "murcielago", "chocolate",
    /* FIX #6 — Diccionario extendido con variaciones comunes */
    "password1", "password123", "qwerty", "letmein", "welcome",
    "monkey123", "dragon", "master", "pass1234", "abc12345",
    "Aa111111", "Qwerty123", "aaaAAAA1", "Password1", "Admin123"
];

const PASSWORD_MAX_LENGTH = 128; /* FIX #6 — Anti-ReDoS: límite máximo */

function contrasenaEsDebil(password, email = "") {
    if (typeof password !== "string") return true;

    /* FIX #6 — Limitar longitud ANTES de aplicar regex para evitar ReDoS */
    if (password.length > PASSWORD_MAX_LENGTH) return "maxlength";

    const limpia = password.trim();
    if (limpia.length === 0) return true;
    if (limpia !== password) return "espacios";

    /* Evitar contraseñas idénticas al correo del usuario */
    if (email && typeof email === "string" && limpia.toLowerCase() === email.toLowerCase().trim()) {
        return "correo";
    }

    const enMinusculas = limpia.toLowerCase();
    if (CONTRASENAS_COMUNES.includes(enMinusculas)) return true;
    if (/^(.)\1+$/.test(limpia)) return true;
    if (/^0*1234567890$|^12345678$|^123456789$|^0123456789$/.test(limpia)) return true;

    if (!/[a-zA-Z0-9]/.test(limpia)) return true;

    return false;
}

document.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll('.input-icono input[type="password"]').forEach(campo => {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "btn-mostrar-clave";
        boton.setAttribute("aria-label", "Mostrar contraseña");
        boton.textContent = "👁️";

        campo.insertAdjacentElement("afterend", boton);

        boton.addEventListener("click", () => {
            const seVaAMostrar = campo.type === "password";
            campo.type = seVaAMostrar ? "text" : "password";
            boton.textContent = seVaAMostrar ? "🙈" : "👁️";
            boton.setAttribute("aria-label", seVaAMostrar ? "Ocultar contraseña" : "Mostrar contraseña");
        });
    });

    protegerCampoConPatron("reg-nombre", /[^A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]/g);
    protegerCampoConPatron("reg-apellido", /[^A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s]/g);
    protegerCampoConPatron("reg-telefono", /[^0-9]/g);
    protegerCampoConPatron("reg-direccion", /[^A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9,.\-#°\s]/g);
    document.getElementById("reg-telefono")?.setAttribute("maxlength", "9");

    /* REGISTRO (registrar.html) */
    const formRegistrar = document.getElementById("form-registrar");
    formRegistrar?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("reg-correo").value;
        const password = document.getElementById("reg-password-ref").value;
        const confirmarPassword = document.getElementById("reg-confirm").value;
        const nombre = document.getElementById("reg-nombre").value.trim().replace(/\s+/g, " ");
        const apellido = document.getElementById("reg-apellido").value.trim().replace(/\s+/g, " ");
        const telefono = document.getElementById("reg-telefono").value.trim();
        const direccion = document.getElementById("reg-direccion").value.trim().replace(/\s+/g, " ");

        /* 1. Validar el correo con el verificador robusto */
        const errorCorreo = validarCorreoElectronico(email);
        mostrarErrorCampo("reg-correo", errorCorreo);
        if (errorCorreo) {
            document.getElementById("reg-correo").focus();
            return;
        }

        const errorNombre = validarSoloNombre(nombre, "El nombre");
        mostrarErrorCampo("reg-nombre", errorNombre);
        if (errorNombre) {
            document.getElementById("reg-nombre").focus();
            return;
        }
        mostrarErrorCampo("reg-nombre", null);

        const errorApellido = validarSoloNombre(apellido, "El apellido");
        mostrarErrorCampo("reg-apellido", errorApellido);
        if (errorApellido) {
            document.getElementById("reg-apellido").focus();
            return;
        }
        mostrarErrorCampo("reg-apellido", null);

        const errorTelefono = validarTelefono(telefono);
        mostrarErrorCampo("reg-telefono", errorTelefono);
        if (errorTelefono) {
            document.getElementById("reg-telefono").focus();
            return;
        }
        mostrarErrorCampo("reg-telefono", null);

        const errorDireccion = validarDireccion(direccion);
        mostrarErrorCampo("reg-direccion", errorDireccion);
        if (errorDireccion) {
            document.getElementById("reg-direccion").focus();
            return;
        }
        mostrarErrorCampo("reg-direccion", null);

        /* 2. Validar contraseña — FIX #6 maxlength + diccionario */
        if (password.length < 8) {
            mostrarErrorCampo("reg-password-ref", "La contraseña debe tener mínimo 8 caracteres.");
            document.getElementById("reg-password-ref").focus();
            return;
        }
        const resultadoDebilidad = contrasenaEsDebil(password, email);
        if (resultadoDebilidad === "maxlength") {
            mostrarErrorCampo("reg-password-ref", `La contraseña no puede superar los ${PASSWORD_MAX_LENGTH} caracteres.`);
            document.getElementById("reg-password-ref").focus();
            return;
        }
        if (resultadoDebilidad === "espacios") {
            mostrarErrorCampo("reg-password-ref", "La contraseña no puede empezar ni terminar con espacios.");
            document.getElementById("reg-password-ref").focus();
            return;
        }
        if (resultadoDebilidad === "correo") {
            mostrarErrorCampo("reg-password-ref", "La contraseña no puede ser idéntica a tu dirección de correo electrónico.");
            document.getElementById("reg-password-ref").focus();
            return;
        }
        if (resultadoDebilidad === true) {
            mostrarErrorCampo("reg-password-ref", "Esa contraseña es muy fácil de adivinar. Prueba combinando letras, números y símbolos.");
            document.getElementById("reg-password-ref").focus();
            return;
        }
        mostrarErrorCampo("reg-password-ref", null);

        /* 3. Confirmar contraseña */
        if (password !== confirmarPassword) {
            mostrarErrorCampo("reg-confirm", "Las contraseñas no coinciden.");
            document.getElementById("reg-confirm").focus();
            return;
        }
        mostrarErrorCampo("reg-confirm", null);

        /* FIX #13 — Usar el id correcto 'btn-registrar', no el duplicado 'btn-login' */
        const botonCrear = document.getElementById("btn-registrar");
        const textoOriginalBoton = botonCrear ? botonCrear.innerHTML : "";
        if (botonCrear) {
            botonCrear.disabled = true;
            botonCrear.innerHTML = "Creando cuenta...";
        }

        /* 1. Guardamos en el sistema Auth */
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

        if (error) {
            if (botonCrear) {
                botonCrear.disabled = false;
                botonCrear.innerHTML = textoOriginalBoton;
            }
            return alert("Error: " + error.message);
        }

        /* 2. Guardamos en la tabla pública 'usuarios' */
        if (data && data.user) {
            const { error: errorBD } = await miSupabase.from('usuarios').insert([{
                id: data.user.id,
                nombre: nombre,
                apellidos: apellido,
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
    const formLogin = document.getElementById("form-login");
    formLogin?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        const errorCorreo = validarCorreoElectronico(email);
        mostrarErrorCampo("login-email", errorCorreo);
        if (errorCorreo) {
            document.getElementById("login-email").focus();
            return;
        }
        mostrarErrorCampo("login-email", null);

        const botonIngresar = document.getElementById("btn-login");
        const textoOriginalBoton = botonIngresar ? botonIngresar.innerHTML : "";
        if (botonIngresar) {
            botonIngresar.disabled = true;
            botonIngresar.innerHTML = "Ingresando...";
        }

        const { error } = await miSupabase.auth.signInWithPassword({ email, password });

        if (botonIngresar) {
            botonIngresar.disabled = false;
            botonIngresar.innerHTML = textoOriginalBoton;
        }

        if (error) return alert("Credenciales incorrectas: " + error.message);
        window.location.href = "menu.html";
    });

    /* RECUPERAR CONTRASEÑA (recuperar.html) — FIX #12: rate-limit básico */
    let ultimoEnvioRecuperacion = 0;
    const COOLDOWN_RECUPERACION_MS = 60000; /* 1 minuto entre envíos */

    const formRecuperar = document.getElementById("form-recuperar");
    formRecuperar?.addEventListener("submit", async (e) => {
        e.preventDefault();

        /* FIX #12 — Anti-spam: limitar frecuencia de envío */
        const ahora = Date.now();
        const tiempoRestante = Math.ceil((COOLDOWN_RECUPERACION_MS - (ahora - ultimoEnvioRecuperacion)) / 1000);
        if (ultimoEnvioRecuperacion > 0 && tiempoRestante > 0) {
            alert(`Espera ${tiempoRestante} segundos antes de solicitar otro enlace.`);
            return;
        }

        const email = document.getElementById("rec-email").value;
        const errorCorreo = validarCorreoElectronico(email);
        mostrarErrorCampo("rec-email", errorCorreo);
        if (errorCorreo) {
            document.getElementById("rec-email").focus();
            return;
        }
        mostrarErrorCampo("rec-email", null);

        /* FIX QA M8 — Estado de carga en el botón */
        const btnRecuperar = document.getElementById("btn-recuperar");
        if (btnRecuperar) {
            btnRecuperar.disabled = true;
            btnRecuperar.innerHTML = "Enviando...";
        }

        /* Redirección dinámica basada en el origen del navegador para soportar Live Server local */
        const redirectUrl = `${window.location.origin}/pages/actualizar_password.html`;

        const { error } = await miSupabase.auth.resetPasswordForEmail(
            email,
            { redirectTo: redirectUrl }
        );

        if (btnRecuperar) {
            btnRecuperar.disabled = false;
            btnRecuperar.innerHTML = "✉️ Enviar Enlace";
        }

        if (!error) ultimoEnvioRecuperacion = Date.now();
        alert(error ? "Error: " + error.message : "Se ha enviado un enlace de recuperación a tu correo.");
    });

    /* ACTUALIZAR CONTRASEÑA (actualizar_password.html) — FIX #6 maxlength */
    const formActualizarPassword = document.getElementById("form-actualizar-password");
    formActualizarPassword?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nuevaPassword = document.getElementById("new-password").value;
        const confirmarPassword = document.getElementById("confirm-password").value;

        if (nuevaPassword.length < 8) {
            mostrarErrorCampo("new-password", "La contraseña debe tener mínimo 8 caracteres.");
            return;
        }
        const resultadoDebilidad = contrasenaEsDebil(nuevaPassword);
        if (resultadoDebilidad === "maxlength") {
            mostrarErrorCampo("new-password", `La contraseña no puede superar los ${PASSWORD_MAX_LENGTH} caracteres.`);
            return;
        }
        if (resultadoDebilidad === "espacios") {
            mostrarErrorCampo("new-password", "La contraseña no puede empezar ni terminar con espacios.");
            return;
        }
        if (resultadoDebilidad === true) {
            mostrarErrorCampo("new-password", "Esa contraseña es muy fácil de adivinar. Prueba combinando letras, números y símbolos.");
            return;
        }
        mostrarErrorCampo("new-password", null);

        if (nuevaPassword !== confirmarPassword) {
            mostrarErrorCampo("confirm-password", "Las contraseñas no coinciden.");
            return;
        }
        mostrarErrorCampo("confirm-password", null);

        const { error } = await miSupabase.auth.updateUser({ password: nuevaPassword });

        if (error) return alert("Error: " + error.message);

        alert("✅ Contraseña actualizada con éxito. Ahora puedes iniciar sesión.");
        window.location.href = "login.html";
    });
});
