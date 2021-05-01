const express = require('express');
const util = require('util');
// const bodyParser = require("body-parser");
const axios = require('axios');
const socketIo = require('socket.io');
const fs = require('fs');
const http = require('http');
const qs = require('qs');
const { response } = require('express');

//to jest konieczne bo http przejmuje kontrole nad serwerem kiedy uzywamy express razem z socketem

const app = express();
// let port = process.env.PORT || 7777;
let port = 7777;

var server = http.createServer(app);
var io = socketIo(server); // nie .listen(server)!
server.timeout = 30000;
// Nie wiem co to robi
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// Rest of configuration
app.use(express.static('public'));
// const BEARER_TOKEN ="AAAAAAAAAAAAAAAAAAAAANI8JgEAAAAAclMj%2BR3L0zqk%2B3Tv%2BTEfAC6fTac%3DlMXA4W6eXBpBjhuNCM6ZtLzmqmjV526TVhMBSmqHW53B2yVaGO";
const BEARER_TOKEN = process.env.BEARER_TOKEN;

const rulesURL = "https://api.twitter.com/2/tweets/search/stream/rules";
// const streamURL = "https://api.twitter.com/2/tweets/search/stream?tweet.fields=author_id,created_at&user.fields=author_id,created_at,attachments&expansions=author_id,attachments.media_keys";
const streamURL = "https://api.twitter.com/2/tweets/search/stream?tweet.fields=author_id,created_at,context_annotations&user.fields=name,username&expansions=author_id,attachments.media_keys"
const errorMessage = {
  title: "Please Wait",
  detail: "Waiting for new Tweets to be posted...",
};
const authMessage = {
  title: "Could not authenticate",
  details: [
    `Please make sure your bearer token is correct.`,
  ],
  type: "https://developer.twitter.com/en/docs/authentication",
};

const sleep = async (delay) => {
  return new Promise((resolve) => setTimeout(() => resolve(true), delay));
};


// API Endpoints my definitions
// Pobierz wszystkie obecne zasady jakie działają w streamie
// zamiast requesta będziemy uzywać AXIOS

app.get("/api/rules", async (req,odpowiedz) => {
    if (!BEARER_TOKEN) 
    {
        odpowiedz.status(400).send(authMessage);
    }
    else { // Token istnieje
    const token = BEARER_TOKEN;
    const headers = {
        'Authorization':"Bearer "+BEARER_TOKEN,
        'Content-Type': 'application/json',
        }
    
    try {
        axios.get("https://api.twitter.com/2/tweets/search/stream/rules",{headers:headers,timeout:31000}).then( response => {
                // console.log(response.data);
                console.log(response.status);
                // console.log(response.statusText);
                // console.log(response.headers);
                // console.log(response.config);

                    if (response.status !== 200) {
                        if (response.status === 403) {
                        odpowiedz.status(403).send(response.body);
                        } else {
                            console.log("Coś tu nie gra. Status odpowiedzi"+response.status);
                            throw new Error(response.body.errorMessage);
                        }
                    }

                if (response.status == 200) {
                    console.log(response.data);
                    fs.appendFileSync("log.txt","Code 200");        
                    odpowiedz.send(response.data);
                    } 
        

        }).catch(error => {
                    if (error.response) {
                        // The request was made and the server responded with a status code
                        // that falls out of the range of 2xx
                        console.log(error.response.data);
                        console.log(error.response.status);
                        console.log(error.response.headers);
                        } else if (error.request) {
                        // The request was made but no response was received
                        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                        // http.ClientRequest in node.js
                        console.log(error.request);
                        } else {
                        // Something happened in setting up the request that triggered an Error
                        console.log('Error', error.message);
                        }
                        console.log(error.config);
                    
});
                                

    } catch (error) {
        console.log("Bubu");
        if (error.response) {
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
        }
        fs.appendFileSync("log.txt","Error "+error+"\n"); 
        res.send(error);    
    }

    } //koniec else jeśli bearer token istnieje
}); // koniec /api/rules
// Uaktualnij zasady filtrujące stream
app.post("/api/rules", async (req,odpowiedz)=>{
        if (!BEARER_TOKEN) {
            res.status(400).send(authMessage);
        }
    const token = BEARER_TOKEN;
    const headers = {
        'Authorization':"Bearer "+BEARER_TOKEN,
        'Content-Type': 'application/json',
    }   
    const options = {
        timeout:30000,
        method:'POST',   
        url:rulesURL,
        headers:headers,
        data:req.body,
    }; 
    
    try {
        axios(options).then(response => {
                console.log(response.status);
                if (response.status !== 200) {
                        if (response.status === 403) {
                        odpowiedz.status(403).send(response.body);
                        } else {
                            console.log("Coś tu nie gra. Status odpowiedzi"+response.status);
                            throw new Error(response.body.errorMessage);
                        }
                    }

                if (response.status == 200) {
                    console.log(response.data);
                    fs.appendFileSync("log.txt","coś");        
                    odpowiedz.send(response.data);
                    } 
        }).catch(error => {
            if (error.response) {
                        // The request was made and the server responded with a status code
                        // that falls out of the range of 2xx
                        console.log(error.response.data);
                        console.log(error.response.status);
                        console.log(error.response.headers);
                        } else if (error.request) {
                        // The request was made but no response was received
                        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                        // http.ClientRequest in node.js
                        console.log(error.request);
                        } else {
                        // Something happened in setting up the request that triggered an Error
                        console.log('Error', error.message);
                        }
                        console.log(error.config);
        });
        
        

    } catch (error) {
        if (error.response) {
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
        }
        fs.appendFileSync("log.txt","Error "+error+"\n"); 
        odpowiedz.send(error);
    }
});

// Connection to stream of tweets

const streamTweets = async (socket,token) => {
    let stream;
    
    const headers = {
        'Authorization':"Bearer "+BEARER_TOKEN,
    }
    const options = {
        method:"GET",
        url:streamURL,
        headers:headers,
        timeout:31000,
        stream:true,
        responseType:"stream"
    };

    try {
        console.log("Uruchamiam funkcję streamTweets");
        // const stream = await axios(options);
        axios(options).then(respobj => {
            const stream = respobj.data;
            console.log(respobj);
            console.log("Połączenie ze streamem nawiązane");
            stream
            .on("data", (data) => {
                console.log("cos sie pojawilo");
                    try {
                        const json = JSON.parse(data);
                        if (json.connection_issue) {
                            socket.emit("error",json);
                            reconnect(stream,socket,token);
    
                        } else {
                            if (json.data) {
                                socket.emit("tweet",json);
                                fs.appendFileSync("log.txt",json);
                            }
                            else {
                                console.log("Jakis dziwny error auth");
                                fs.appendFileSync("/home/sebastian/bg_nwn/public/breakingnews.txt","Weird error happened on server -",data);
                                socket.emit("authError",json);
                            }
                        }
                    } catch (error) {
                        socket.emit("heartbeat");
                    }
            })
            .on("error",(error)=>{
                //connection timed out
                socket.emit("error",errorMessage);
                reconnect(stream,socket,token);
            });

        }).catch(error=>{
            if (error.response) {
                        // The request was made and the server responded with a status code
                        // that falls out of the range of 2xx
                        // console.log(error.response.data);
                        console.log(error.response.status);
                        // console.log(error.response.headers);
                        } else if (error.request) {
                        // The request was made but no response was received
                        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                        // http.ClientRequest in node.js
                        console.log(error.request);
                        } else {
                        // Something happened in setting up the request that triggered an Error
                        console.log('Error', error.message);
                        }
                        console.log(error.config);

        });
       
  
    } catch (e) {
        console.log("Po prostu error na starcie streamTweets:"+e);        
    }
};

const reconnect = async (stream,socket,token) => {
        console.log("Trying to reconnect");
        timeout++;
        stream.abort();
        await sleep(2 ** timeout * 1000);
        streamTweets(socket,token);
    }

io.on("connection", async socket=>{
    try {
        console.log("Startin on 'connection' event");
        const token = BEARER_TOKEN;
        const stream = streamTweets(socket,token);
        
    } catch (error) {
        
        socket.emit("AuthError",authMessage);
    }
});

// io.on("startstream", async socket=>{
//     console.log("Connecting to the stream");
//     socket.emit("heartbeat");
//      const token = BEARER_TOKEN;
//      const stream = streamTweets(socket,token);
// });






// Server is listening
server.listen(port, () => console.log(`Server is listening on port ${port}`));
