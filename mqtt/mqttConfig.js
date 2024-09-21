require('dotenv').config();
const mqtt = require('mqtt');

// MQTT over TLS with authentication
const options = {
    host: process.env.MQTT_HOST,
    port: 8883, // For MQTT over TLS
    protocol: 'mqtts', // MQTT over SSL/TLS
    clientId: process.env.MQTT_CLIENTID, // Replace with a unique client ID
    username: process.env.MQTT_USERNAME, // Replace with your HiveMQ username
    password: process.env.MQTT_PASSWORD, // Replace with your HiveMQ password
};

const client = mqtt.connect(options);

client.on('connect', () => {
  console.log("")
  console.log("<<<<<<====== mqtt config ======>>>>>>")
  console.log(`Connected to HiveMQ with Client ID: ${options.username}`);
  client.subscribe('location', (err, data) => {
    if (err) {
      console.error('Subscription error:', err);
    } else {
      [{topic}] = data
      console.log(`Subscribed to ${topic}`);
    }
  });
  client.subscribe('departure', (err, data) => {
    
    if (err) {
      console.error('Subscription error:', err);
    } else {
      [{topic}] = data
      console.log(`Subscribed to ${topic}`);
    }
  });
  client.subscribe('destination', (err, data) => {
    if (err) {
      console.error('Subscription error:', err);
    } else {
      [{topic}] = data
      console.log(`Subscribed to ${topic}`);
    }
  });
  
});


client.on('error', (err) => {
  console.error('MQTT Client Error:', err);
});

module.exports = client;