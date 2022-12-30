
const http = require("http")
const path = require('path')
const needle =  require('needle')
const config = require('dotenv').config()
const express = require("express")
const socketIO = require('socket.io')
const { resolve } = require("path")

const PORT = process.env.PORT || 3000

const app = express()
const server = http.createServer(app)
const io = socketIO(server)

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../', 'client', 'index.html'))
})


const TOKEN = 'AAAAAAAAAAAAAAAAAAAAAPEYkwEAAAAAJB2U86%2BU%2FTJ9qu6eNIxG2BC8%2Fxc%3DvGBTaX8dhPuU1zNh0Lxcbut8IzXi3iaCAUj5AaPX9WHOeYTtxP'

const ruleURL = 'https://api.twitter.com/2/tweets/search/stream/rules'
const streamURL = 'https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics&expansions=author_id'

const rules = [{ value: 'macbook' }]

//get rules
async function getRules(){
     const response = await needle('get', ruleURL, {
        headers: {
            Authorization: `Bearer ${TOKEN}`
        }
     })
     console.log(response.body);
     return response.body
}

//set rules
async function setRules(){

    const data = {
        add: rules
    }

    const response = await needle('post', ruleURL,data, {
       headers: {
            "content-type": "application/json",
           Authorization: `Bearer ${TOKEN}`
       }
    })
    console.log(response.body);
    return response.body
}

//delete rules
async function deleteRules(rules){

    if(!Array.isArray(rules)){
        return null
    }

    const ids = rules.data.map((rule) => rule.id )

    const data = {
        delete:{
            ids:ids
        }
    }


    const response = await needle('post', ruleURL, data, {
       headers: {
            "content-type": "application/json",
           Authorization: `Bearer ${TOKEN}`
       }
    })
    console.log(response.body);
    return response.body
}

//stream 
function streamTweets(socket){

    const stream  = needle.get(streamURL, {
        headers: {
            Authorization: `Bearer ${TOKEN}`
        }
    })
    stream.on('data', (data)=>{
        try {
            const response =JSON.parse(data)
               // console.log(response)
               socket.emit('tweet', response)
        } catch(error){

        }
    })
}

io.on('connection', async()=>{
    console.log('Client Connected')

        let currentRules

    try {

        currentRules= await getRules()
        //console.log(currentRules)

        //delete rules
        await deleteRules(currentRules)

        await setRules()

    }catch(error){
        console.log(error)
        process.exit(1)
    }
    streamTweets(io)

})

server.listen(PORT, ()=>{
    console.log(`listening to the port ${PORT}`);
})