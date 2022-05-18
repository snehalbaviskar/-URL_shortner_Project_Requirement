const express = require('express')
const validUrl = require('valid-url')
const shortid = require('shortid')

const urlModel = require('../models/urlModel')


const redis = require("redis");

const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
    10705
    ,
    "redis-10705.c264.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("tReI1amcKK0ikMdjitLlZP3JZf6x8mE0", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});



const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);



const isValidUrl = function(value) {
    let regexForUrl =
        /(:?^((https|http|HTTP|HTTPS){1}:\/\/)(([w]{3})[\.]{1})?([a-zA-Z0-9]{1,}[\.])[\w]((\/){1}([\w@?^=%&amp;~+#-_.]+)))$/;
    return regexForUrl.test(value);
};


const createUrl = async function (req, res) {

    try {

        const data = req.body

        // The API base Url endpoint
        const baseUrl = 'http:localhost:3000'

        //check if longUrl not present in requestBody
        const longUrl = data.longUrl
        if (!longUrl) return res.status(400).send({ status: false, message: "longUrl must be present" })

        if(!isValidUrl(longUrl)) return res.status(400).send({ status: false, message: "Url not valid" })

        //Ensuring the same response is returned for an original url everytime

        // const findLongUrl = await urlModel.findOne({ longUrl: longUrl })
        // if (findLongUrl) {
        //     return res.status(200).send({ status: true, message: "url already exist", data: { urlCode: findLongUrl.urlCode, shortUrl: findLongUrl.shortUrl, longUrl: findLongUrl.longUrl } })
        // }

        //const fetchLongUrl = async function (req, res) {
        let cahcedLongUrl = await GET_ASYNC(`${longUrl}`)
        if (cahcedLongUrl) { return res.send(cahcedLongUrl) }
        else {
            let url = await urlModel.findOne({ longUrl: longUrl }).select({urlCode:1, shortUrl:1, longUrl:1, _id:0})
            if (url) {
                await SET_ASYNC(`${longUrl}`, JSON.stringify(url))
                return res.send({ data: url });
            }
        }

        // if longUrl valid, we create the url code
        const urlCode = shortid.generate()

        // join the generated short code the the base url
        const shortUrl = baseUrl + '/' + urlCode

        //create key-value pair in object data
        data.shortUrl = shortUrl
        data.urlCode = urlCode

        const urlCreated = await urlModel.create(data)
        return res.status(201).send({ status: true, message: "url generated", data: { urlCode: urlCreated.urlCode, shortUrl: urlCreated.shortUrl, longUrl: urlCreated.longUrl } })
    }

    catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }

}


//****************************************************************************************************************************************************************************************************************

const getUrl = async function (req, res) {

    try {
        const urlCode = req.params.urlCode
        //check if no urlCode is present in path params
        if (!urlCode) return res.status(400).send({ status: false, message: "urlCode must be present" })

        const findUrlCode = await urlModel.findOne({ urlCode: urlCode })
        //check if the urlCode is present in path params does not matches with one in db
        if (!findUrlCode) return res.status(404).send({ status: false, message: "Unable to find URL to redirect to" })

        return res.status(302).send({ status: true, message: "url redirected", data: findUrlCode.longUrl })
    }

    catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}

module.exports = { createUrl, getUrl }
