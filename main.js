const WebSocket = require('ws');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

function defineCliente(id){
    return new Client({
        authStrategy: new LocalAuth({ clientId: id }),
	puppeteer: {headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']}
    })
}
const server = new WebSocket.Server({ host: "158.220.116.166", port: 8099 });

// Middleware para habilitar CORS
server.on('headers', (headers, req) => {
    headers.push('Access-Control-Allow-Origin: *');
    headers.push('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept');
});

const client = defineCliente(1)
client.on("authenticated", ()=>{
    console.log("autenticado")
})
server.on('connection', (socket) => {
    console.log('Cliente conectado');

    // Envía un mensaje de bienvenida al cliente recién conectado
    socket.send(JSON.stringify({ 'mensaje': '¡Bienvenido al servidor WebSocket!' }));

    // Maneja los mensajes recibidos desde el cliente
    socket.on('message', async (message) => {
        let mensaje = JSON.parse(message)
        console.log(`Mensaje recibido: ${JSON.stringify(mensaje)}`);

        const qrListener = (qr) => {
            try {
                socket.send(JSON.stringify({ "estado": "ready" }))
                let jsonEnviar = JSON.stringify({ "qr": qr })
                socket.send(jsonEnviar)
                console.log('Escanea el código QR con tu teléfono para iniciar sesión.');
            } catch (e) {
                console.log(`error => ${e}`)
            }
        };
        if (mensaje.message == 'qr') {
            try {
                let respuestaEspera = { "estado": "waiting" }

                socket.send(JSON.stringify(respuestaEspera))
                client.on('qr', qrListener);
            } catch (error) {
                console.error('Error al procesar el código QR:', error.message);
                socket.send('Error al procesar el código QR. Inténtalo de nuevo.');
            }
        }
        if (mensaje.message == "obtenerContactos") {
            let contactos = await client.getContacts()
            const limite = mensaje.message.limit || contactos.length;

            // Devuelve los primeros 'limite' contactos
            const contactosEnLimite = contactos.slice(0, limite);
            socket.send(JSON.stringify(contactosEnLimite))
        }
        if (mensaje.message == "iniciar") {
            let user = new LocalAuth({})
            user
        }

        if (mensaje.message == "enviarMensaje") {
            client.sendMessage(mensaje.recibeID, mensaje.mensajeEnviar);
        }
        client.on('ready', async () => {
            console.log('¡El cliente está listo!');
            client.off('qr', qrListener);
            socket.send(JSON.stringify( client.info))
            socket.send(JSON.stringify({"mensaje":"cliente listo"}));
        });
        client.initialize();
    });

    // Maneja el evento de cierre de conexión
    socket.on('close', () => {
        console.log('Cliente desconectado');
    });
});

//////////////////////////////INTEGRACION CW////////////////////////////////////////////////////

const stringify = (payload = {}) => JSON.stringify(payload);
const pubSubToken = "SqEQGC96eBooMiH9RMdMpdJh";
const accountId = "1";
const userId = "1";
const connection = new WebSocket("wss://cwoot.full-sms.uno/cable");

// Manejar la apertura de la conexión WebSocket
connection.onopen = () => {
  // Enviar mensaje de suscripción
  connection.send(
    stringify({
      command: "subscribe",
      identifier: stringify({
        channel: "RoomChannel",
        pubsub_token: pubSubToken,
        account_id: accountId,
        user_id: userId,
      }),
    })
  );

  // Enviar mensaje de actualización de presencia de usuario
  const userPayload = stringify({
    command: "message",
    identifier: stringify({
      channel: "RoomChannel",
      pubsub_token: pubSubToken,
      account_id: accountId,
      user_id: userId,
    }),
    data: stringify({ action: "update_presence" }),
  });

  connection.send(userPayload);

  // Enviar mensaje de actualización de presencia de contacto
  const agentPayload = stringify({
    command: "message",
    identifier: stringify({
      channel: "RoomChannel",
      pubsub_token: pubSubToken,
    }),
    data: stringify({ action: "update_presence" }),
  });

  connection.send(agentPayload);
};

// Manejar errores en la conexión WebSocket
connection.onerror = (error) => {
  console.error(`WebSocket Error: ${error}`);
};

// Manejar el cierre de la conexión WebSocket
connection.onclose = (event) => {
  console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
};

// Manejar mensajes recibidos
connection.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Manejar los datos recibidos de Chatwoot.
};
