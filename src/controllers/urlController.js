const express = require('express')
const validUrl = require('valid-url')
const shortid = require('shortid')

const urlModel = require('../models/urlModel')


const createUrl = async function (req, res) {

    try {

        const data = req.body

        // The API base Url endpoint
        const baseUrl = 'http:localhost:3000'

        //check if longUrl not present in requestBody
        const longUrl = data.longUrl
        if (!longUrl) return res.status(400).send({ status: false, message: "longUrl must be present" })

        //Ensuring the same response is returned for an original url everytime
        const findLongUrl = await urlModel.findOne({ longUrl: longUrl })
        if (findLongUrl) {
            return res.status(200).send({ status: false, message: "url already exist", data: { urlCode: findLongUrl.urlCode, shortUrl: findLongUrl.shortUrl, longUrl: findLongUrl.longUrl } })
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