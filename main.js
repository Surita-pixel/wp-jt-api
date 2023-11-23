const WebSocket = require('ws');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

function defineCliente(id){
    return new Client({
        authStrategy: new LocalAuth({ clientId: id })
    })
}


const server = new WebSocket.Server({ host: "0.0.0.0", port: 8099 });

// Middleware para habilitar CORS
server.on('headers', (headers, req) => {
    headers.push('Access-Control-Allow-Origin: *');
    headers.push('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept');
});


// Load the session data if it has been previously saved




const client = defineCliente(1)
client.on("authenticated", ()=>{
    console.log("autenticado")
})
server.on('connection', (socket) => {
    console.log('Cliente conectado');

    // Envía un mensaje de bienvenida al cliente recién conectado
    socket.send('¡Bienvenido al servidor WebSocket!');

    // Maneja los mensajes recibidos desde el cliente
    socket.on('message', async (message) => {
        let mensaje = JSON.parse(message)
        console.log(`Mensaje recibido: ${JSON.stringify(mensaje)}`);

        const qrListener = (qr) => {
            qrcode.generate(qr, { small: true });
            console.log('Escanea el código QR con tu teléfono para iniciar sesión.');
        };
        if (mensaje.message == '/qr') {
            try {

                client.on('qr', qrListener);
            } catch (error) {
                console.error('Error al procesar el código QR:', error.message);
                socket.send('Error al procesar el código QR. Inténtalo de nuevo.');
            }
        }
        if (mensaje.message == "listarContactos") {
            let contactos = await client.getContacts()
            socket.send(JSON.stringify(contactos))
        }
        if (mensaje.message == "iniciar") {
            let user = new LocalAuth({})
            user
        }
        if (mensaje.message == "enviarMensaje"){
            client.sendMessage(mensaje.recibeID, mensaje.mensajeEnviar);
        }
        client.on('ready', async () => {
            console.log('¡El cliente está listo!');
            client.off('qr', qrListener);
            console.log(client.info)
            socket.send('Cliente listo. Puedes iniciar sesión escaneando el código QR.');
        });
        client.initialize();
    });

    // Maneja el evento de cierre de conexión
    socket.on('close', () => {
        console.log('Cliente desconectado');
    });
});


client.on('message', async (msg) => {
    try {
        if (msg.body === '!ping') {
            let contactos = await client.getContacts();
            console.log(contactos);
            msg.reply('pong');
        }
    } catch (error) {
        console.error('Error al procesar el mensaje:', error.message);
    }
});
