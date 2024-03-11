//home.js
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;


mongoose.connect('mongodb://localhost:27017/organ', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;
app.use(express.static(path.join(__dirname)));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

const PatientSchema = new mongoose.Schema({
    name: {
        type: String, required: true
    },
    age: {
        type: Number, required: true
    },
    contact: {
        type: String, required: true
    },
    gender: {
        type: String, enum: ['Male', 'Female', 'Other'
        ], required: true
    },
    organ: {
        type: String, enum: ['Heart', 'Lungs', 'Liver', 'Kidney'
        ], required: true
    },
    hospital: {
        type: String, required: true
    },
    blood_group: {
        type: String, required: true
    },
    status: { 
        type: String, default: 'Pending'
    },
});

const Patient = mongoose.model('Patient', PatientSchema, 'patient');

const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
});
const User = mongoose.model('User', UserSchema, 'doclogin');

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('MongoDB connected successfully!');

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '/home.html'));
    });

    // app.post('/doclogin', ...) in home.js
    app.post('/doclogin', async (req, res) => {
        try {
            const { username, password } = req.body;

            console.log('Received username:', username);
            console.log('Received password:', password);

            const user = await User.findOne({ username }).exec();
            console.log('User found:', user);

            if (user) {
                if (user.password === password) { // Compare plain text passwords
                    console.log('Password match: true');
                    res.redirect('/patdisp');
                } else {
                    console.log('Password match: false');
                    res.status(401).send('Invalid username or password');
                }
            } else {
                console.log('User not found');
                res.status(401).send('Invalid username or password');
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    });



    app.post('/submit', express.urlencoded({
        extended: true
    }), (req, res) => {
        const newPatient = new Patient({
            name: req.body.name,
            age: req.body.age,
            contact: req.body.contact,
            gender: req.body.gender,
            organ: req.body.organ,
            hospital: req.body.hospital,
            blood_group: req.body.blood_group,
            status: req.body.status,
        });

        newPatient.save()
            .then(() => {
                res.redirect('/patdisp?msg=Patient details saved successfully!');
            })
            .catch(() => {
                res.status(400).send('Unable to save Patient details');
            });
    });
    app.get('/doclogin', (req, res) => {
        res.sendFile(__dirname + '/login.html');
    });

    app.get('/addpatient', (req, res) => {
        res.sendFile(__dirname + '/patients.html');
    });

    app.get('/logout', (req, res) => {
        res.sendFile(__dirname + '/logout.html');
    });

    app.get('/patients', (req, res) => {
        Patient.find({})
            .then(patients => {
                res.json(patients);
            })
            .catch(() => {
                res.status(500).send('Internal Server Error');
            });
    });


    app.get('/patdisp', (req, res) => {
        res.sendFile(__dirname + '/patdisp.html');
    });

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT
            }`);
    });
});
