const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
app.use(express.json());
const cors = require('cors');
app.use(cors());
require('dotenv').config();
const post = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion } = require('mongodb');

// Se97DeXnaSdNlTwI

// microjobs




//const uri = "mongodb+srv://microjobs:Se97DeXnaSdNlTwI@cluster0.ntkoo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ntkoo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const userTable = client.db('microJobs').collection('users');

async function run() {
  try {
   
    await client.connect();

    app.get('/',async(req,res)=>{
        res.send("Running well");
    })

    app.post('/jwt', async(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {expiresIn:'1h'})
      res.send({token})
    })


    app.post('/users', async(req,res)=>{
      const user= req.body;
      const result = await userTable.insertOne(user)
      res.send(result)
    })

    //
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
   
  }
}
run().catch(console.dir);


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});