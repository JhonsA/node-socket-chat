const { Socket } = require('socket.io'); // Borrar en produccion
const { comprobarJWT } = require('../helpers');
const { ChatMensajes } = require('../models');

// Instancia de chat mensajes
const chatMensajes = new ChatMensajes();

// io corresponde a todo el servidor de sockets
const socketController = async( socket = new Socket(), io ) => {

    const usuario = await comprobarJWT( socket.handshake.headers['x-token'] );
    
    if ( !usuario ) {
        return socket.disconnect();
    }

    // Emitir a todo el mundo que se conecto un usuario y al usuario que se conecta
    // Agregar el usuario conectado
    chatMensajes.conectarUsuario( usuario );
    io.emit('usuarios-activos', chatMensajes.usuariosArr);
    socket.emit('recibir-mensajes', chatMensajes.ultimos10);

    // Conectarlo a una sala especial
    socket.join( usuario.id ); // global, socket.id, usuario.id

    // Limpiar cuando alguien se desconecta
    socket.on('disconnect', () => {
        // Saco al usuario de mi arreglo
        chatMensajes.desconectarUsuario( usuario.id );
        // Emito la lista de usuarios conectados actualizada
        io.emit('usuarios-activos', chatMensajes.usuariosArr);
    });

    socket.on('enviar-mensaje', ({ uid, mensaje }) => {

        if ( uid ) {
            // Mensaje Privado
            socket.to( uid ).emit( 'mensaje-privado', { de: usuario.nombre, mensaje } );
        } else {
            chatMensajes.enviarMensaje( usuario.id, usuario.nombre, mensaje );
            io.emit('recibir-mensajes', chatMensajes.ultimos10);
        }
        
    });


}

module.exports = {
    socketController
}