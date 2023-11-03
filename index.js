const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require('cors');
const cookieParser = require('cookie-parser');
let jwt = require('jsonwebtoken');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());

app.use(cookieParser())


console.log(process.env.CAR_USER)



// const uri = `mongodb+srv://${process.env.CAR_USER}:${process.env.CAR_PASS}@cluster0.rarr4yf.mongodb.net/?retryWrites=true&w=majority`;

// middlewares
const verifyToken = async (req, res, next)=>{
    const token = req.cookies.token;
    console.log(token)

    if(!token){
        return res.status(401).send({message: 'unauthorized token'})
    }

    jwt.verify(token,process.env.TOKEN_SECRET,(err,decoded)=>{
        if(err){
            console.log(err)
            return res.status(401).send({message: 'unauthorized token'})
        }
        console.log('decodeddd',decoded)
        req.user = decoded;
        next()
    })

}


const uri = `mongodb+srv://${process.env.CAR_USER}:${process.env.CAR_PASS}@cluster0.rarr4yf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const servicesCollection = client.db('carDoctor').collection('services');
        const bookingsCollection = client.db('carDoctor').collection('bookings');


        app.post('/jwt', async (req, res) => {
            const user = req.body;
            // console.log(user)
            const token = jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '1h' });
            res.cookie('token', token, {
                httpOnly: true,
                // secure: false,
                // sameSite : 'none'
            })
                .send({ success: true })
        })

        // Service related api
        app.get('/services', async (req, res) => {
            const cursor = servicesCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const options = {
                projection: { title: 1, price: 1, img: 1, service_id: 1 },
            };
            const result = await servicesCollection.findOne(query, options)
            res.send(result)
        })

        // Booking Related api

        app.get('/bookings', verifyToken, async (req, res) => {
            // console.log(req.cookies)
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookingsCollection.find(query).toArray();
            res.send(result)
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            // console.log(booking);
            const result = await bookingsCollection.insertOne(booking);
            res.send(result)
        })

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bookingsCollection.deleteOne(query)
            res.send(result)
        })

        // Booking update related backend

        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const bookingUpdate = req.body;
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    status: bookingUpdate.status
                },
            };
            const result = await bookingsCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Car Doctors')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})



