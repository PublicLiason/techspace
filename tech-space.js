const { ETwitterStreamEvent, TweetStream, TwitterApi, ETwitterApiError, UserFollowersV2Paginator } = require("twitter-api-v2")
require('dotenv').config()
const {EventEmitter} = require('events')
const {stream_1} = require('./add-file-test')
const {client, createUser} = require('./database')
 
// const data = require('./test-file.json')

const api_key = process.env.API_Key
const api_key_secret = process.env.API_Key_Secret
const bearer = process.env.Bearer_Token
const access_token = process.env.Access_Token
const access_token_secret = process.env.Access_Token_Secret

const customEvent = new EventEmitter()
customEvent.on('dm_Error', (error, ids, text, curr_id) => {
    console.log(`there was an error with ID: ${curr_id}`)
    ids.shift()
    sendDM(ids, text)
})

customEvent.on('dm_Success', (message) => {
    console.log(message)
})

customEvent.on('dm_End', (message) => {
    console.log(message)
})

customEvent.on('f_error', (id, next_token) => {
    get_followers(id, next_token)  
})

const user = new TwitterApi({
    appKey: api_key,
    appSecret: api_key_secret,
    accessToken: access_token,
    accessSecret: access_token_secret
})

const app = new TwitterApi(bearer)
const rwUser = user.readWrite

async function getUserByUserName(username) {
    try {
        let {data} = await rwUser.v2.userByUsername(username)
        console.log(data)
    } catch (error) {
        console.log(error)
    }
}

async function sendDM(ids_arr, text) {
    const current_id = ids_arr[0]
    if (ids_arr.length > 0) {
        try {
            const dmSent = await user.v1.sendDm({
                // Mandatory
                recipient_id: current_id,
                // Other parameters are collapsed into {message_data} of payload
                text,
            })
            customEvent.emit('dm_Success', dmSent)
        } catch (error) {
            customEvent.emit('dm_Error', error, ids_arr, text, current_id)
        }  
    } 
    return
}

// getUserByUserName('melindagates')

// sendDM(data.id, 'yo ... its me')

async function get_followers(id, pag_token) {
    let followers_pagin = await app.v2.followers(id, {asPaginator: true, max_results: 1000, pagination_token: pag_token})
    let next_token
    let count = 0
    
    try {
        for (const stuff in followers_pagin.data) {
            if (stuff === 'data' ) {
                let {data} = followers_pagin.data
                createUser({
                    client,
                    db: 'twitter-people',
                    collection: 'users',
                    newDoc: {
                        peopleArr: data,
                        count_id: count++
                    }
                })
            }
        }
        
        setInterval(async () => {
            followers_pagin = await followers_pagin.next()
            for (const stuff in followers_pagin.data) {
                if (stuff === 'data' ) {
                    let {data} = followers_pagin.data
                    createUser({
                        client,
                        db: 'twitter-people',
                        collection: 'users',
                        newDoc: {
                            peopleArr: data,
                            count_id: count++
                        }
                    })
                }
            }
            
            next_token = followers_pagin.data.meta.next_token
        }, 120000)
    } catch (error) {
        customEvent.emit('f_error', id, next_token)
    }
}

get_followers('161801527', undefined)

// console.trace({api_key, api_key_secret, bearer, access_token, access_token_secret})
