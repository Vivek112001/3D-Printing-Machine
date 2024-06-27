const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const materialRoutes = require('./routes/materials');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/materials', materialRoutes);

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}).catch(err => console.log(err));
