const express = require('express');
const multer = require('multer');
const Material = require('../models/Material');
const router = express.Router();
const path = require('path');

const { v4: uuidv4 } = require('uuid');
const bucketId = "gs://node-image-upload-api.appspot.com";

// import firebase-admin package
const admin = require('firebase-admin');

// import service account file (helps to know the firebase project details)
const serviceAccount = require("../service_account_keys.json");

// Intialize the firebase-admin project/account
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: bucketId,
});

var bucket = admin.storage().bucket();

//this function return image url uploaded in firebase, just give this file like -- 


const saveImage = async (file) => {

    const uid = uuidv4();

    // Create file metadata including the content type
    const metadata = {
        metadata: {
            // This line is very important. It's to create a download token.
            firebaseStorageDownloadTokens: uid
        },
        contentType: file.mimetype,
        cacheControl: 'public, max-age=31536000',
    };

    // Uploads a local file to the bucket
    const uploadResp = await bucket.upload(file.path, {
        // Support for HTTP requests made with `Accept-Encoding: gzip`
        gzip: true,
        metadata: metadata,
    });

    return `https://firebasestorage.googleapis.com/v0/b/${uploadResp[0].metadata.bucket}/o/${uploadResp[0].name}?alt=media&token=${uploadResp[1].metadata.firebaseStorageDownloadTokens}`;
}

// Set up multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// GET /materials
router.get('/', async (req, res) => {
    try {
        const materials = await Material.find({}, { imageUrl: 0 });
        res.json(materials);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /materials/:id
router.get('/:id', async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        if (!material) return res.status(404).json({ message: 'Material not found' });
        res.json(material);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /materials
router.post('/', upload.single('image'), async (req, res) => {
    const { name, technology, colors, pricePerGram, applicationTypes } = req.body;
    const imageUrl = await saveImage(req.file);


    const material = new Material({
        name,
        technology,
        colors: colors.split(','),
        pricePerGram,
        applicationTypes: applicationTypes.split(','),
        imageUrl
    });

    try {
        const newMaterial = await material.save();
        res.status(201).json(newMaterial);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /materials/:id
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        if (!material) return res.status(404).json({ message: 'Material not found' });

        const { name, technology, colors, pricePerGram, applicationTypes } = req.body;
        if (name) material.name = name;
        if (technology) material.technology = technology;
        if (colors) material.colors = colors.split(',');
        if (pricePerGram) material.pricePerGram = pricePerGram;
        if (applicationTypes) material.applicationTypes = applicationTypes.split(',');
        if (req.file) material.imageUrl = await saveImage(req.file);

        const updatedMaterial = await material.save();
        res.json(updatedMaterial);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /materials/:id
router.delete('/:id', async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        if (!material) return res.status(404).json({ message: 'Material not found' });

        await material.remove();
        res.json({ message: 'Material deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
