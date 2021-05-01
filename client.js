const io = require('socket.io-client');
let socket = io('http://localhost:7777',{
'reconnection':true,
    'reconnectionDelay':500,
    'reconnectionAttempts':10
}
);
// let socket = io('http://sebastianszwarc.pl:7777');
const fs = require('fs');
const { default: Axios } = require('axios');
let base64 = require('base-64');
// Reserved words for method names, they should not be used
// connect
// connect_error
// disconnect
// disconnecting
// newListener
// removeListener

var beats=0;
let tweetsInSingular = [];
let tweetsInWaiting = [];



socket.on("connect",  () => {
     console.log("Socket zareagował na połączenie sieciowe");
     fs.appendFileSync("/home/sebastian/bg_nwn/breakingnews.txt","Loggin started\n");

 });
 socket.on("heartbeat", (data) => {
     beats++;
     console.log("heartbeat ",beats);



});
 socket.on("tweet", (json) => {
      if (json.data) {


      }

    });


socket.on("AuthError",() => {
console.log("Error on Twitter backend");
 fs.appendFileSync("/home/sebastian/bg_nwn/breakingnews.txt","ERROR =Some serious thing happened on Twitter Backend\n");
 // experimental

});

// socket.on("error",() => {
//     console.log("trying to reconnect");
// })
socket.on('disconnect', function(){
    console.log("Socket was disconnected from client");
     });
