const url = ( window.location.hostname.includes('localhost') )
    ? 'http://localhost:8080/api/auth/'
    : 'https://restserver-curso-fher.herokuapp.com/api/auth/';

// Info del usuario autenticado
let usuario = null;
// Info del socket
let socket = null;

// Referencias HTML
const txtUid = document.querySelector('#txtUid');
const txtMensaje = document.querySelector('#txtMensaje');
const ulUsuarios = document.querySelector('#ulUsuarios');
const ulMensajes = document.querySelector('#ulMensajes');
const btnSalir = document.querySelector('#btnSalir');

// Validar el token del localStorage
const validarJWT = async() => {

    const token = localStorage.getItem('token') || '';

    if ( token.length <= 10 ) {
        window.location = 'index.html';
        throw new Error('No hay token en el servidor');
    }

    try {

        const resp = await fetch( url, {
            headers: { 'x-token': token }
        });
    
        const { usuario: userDB, token: tokenDB } = await resp.json();
        // Renovamos el token
        localStorage.setItem( 'token', tokenDB );
        usuario = userDB;
        document.title = usuario.nombre;
    
        await conectarSocket();

    } catch (error) {

        console.error(error);
        window.location = 'index.html';
        
    }
    
}

const conectarSocket = async() => {

    socket = io({
        'extraHeaders': {
            'x-token': localStorage.getItem('token')
        }
    });

    socket.on('connect', () => {
        console.log('Sockets online');
    });

    socket.on('disconnect', () => {
        console.log('Sockets offline');
    });

    socket.on('recibir-mensajes', mostrarMensajes);

    // Recibo el usuariosArr,     enviamos la referencia de mostrar usuarios porque solo toma el payload
    socket.on('usuarios-activos', mostrarUsuarios); // o (payload) = { mostrarUsuarios(payload)}

    socket.on('mensaje-privado', (payload) => {
        console.log('Privado: ', payload);
    });

}

const mostrarUsuarios = ( usuarios = [] ) => {

    let usersHtml = '';
    usuarios.forEach( ({ nombre, uid }) => {

        usersHtml += `
            <li>
                <p>
                    <h5 class="text-success"> ${ nombre } </h5>
                    <span class="fs-6 text-muted">${ uid }</span>
                </p>
            </li>
        `;

    });

    ulUsuarios.innerHTML = usersHtml;

}

const mostrarMensajes = ( mensajes = [] ) => {

    let mensajesHtml = '';
    mensajes.forEach( ({ mensaje, nombre }) => {

        mensajesHtml += `
            <li>
                <p>
                    <span class="text-primary"> ${ nombre }: </span>
                    <span>${ mensaje }</span>
                </p>
            </li>
        `;

    });

    ulMensajes.innerHTML = mensajesHtml;

}

txtMensaje.addEventListener('keyup', ({ keyCode }) => {

    const mensaje = txtMensaje.value;
    const uid = txtUid.value;

    if ( keyCode !== 13 ) { return; }
    if ( mensaje.legth === 0 ) { return; }

    socket.emit('enviar-mensaje', { mensaje, uid } );

    txtMensaje.value = '';

});

btnSalir.addEventListener('click', ()=> {

    // Borramos el token
    localStorage.removeItem('token');

    const auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then( () => {
        console.log('User signed out.');
        window.location = 'index.html';
    });
});

const main = async() => {
    // Validar JWT
    await validarJWT();
}

(()=>{
    gapi.load('auth2', () => {
        gapi.auth2.init();
        main();
    });
})();

main();