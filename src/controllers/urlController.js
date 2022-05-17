const express = require('express')
const validUrl = require('valid-url')
const shortid = require('shortid')

const urlModel = require('../models/urlModel')


const createUrl = async function (req, res) {

    try {

        const data = req.body

        const longUrl = data.longUrl

        if(! longUrl)  return res.status(400).send({ status: false, message:"longUrl must be present" })

        const findLongUrl = await urlModel.findOne({ longUrl: longUrl })
        if (findLongUrl) {

            return res.status(200).send({ status: false, message: "url generated", data:{ urlCode: findLongUrl.urlCode, shortUrl: findLongUrl.shortUrl, longUrl: findLongUrl.longUrl }})

        }
        const baseUrl = 'http:localhost:3000'

        const urlCode = shortid.generate()
        // const findUrlCode = await urlModel.findOne({ urlCode: urlCode })

        // if (findUrlCode) {
        //     urlCode = shortid.generate()
        // }


        const shortUrl = baseUrl + '/' + urlCode

        data.shortUrl = shortUrl
        data.urlCode = urlCode

        const urlCreated = await urlModel.create(data)
        return res.status(201).send({ status: true, message: "url generated", data: { urlCode: urlCreated.urlCode, shortUrl: urlCreated.shortUrl, longUrl: urlCreated.longUrl } })
    }

    catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }

}

const getUrl = async function(req, res){

   try { 
       const urlCode = req.params.urlCode

    if(! urlCode) return res.status(400).send({ status: false, message:"urlCode must be present" })

    const findUrlCode = await urlModel.findOne({urlCode:urlCode})

    if(! findUrlCode) return res.status(404).send({ status: false, message:"url does not exist" })

    return res.status(302).send({ status: true, message: "url redirected", data: findUrlCode.longUrl  })
}

catch (err) {
    return res.status(500).send({ status: false, error: err.message })
}


}

module.exports = { createUrl, getUrl }