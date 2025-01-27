require('dotenv').config();
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
app.use(express.json());
const cors = require('cors');
app.use(cors());

const post = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Se97DeXnaSdNlTwI

// microjobs




//const uri = "mongodb+srv://microjobs:Se97DeXnaSdNlTwI@cluster0.ntkoo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ntkoo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const userTable = client.db('microJobs').collection('users');
const taskTable = client.db('microJobs').collection('tasks');
const orderTable = client.db('microJobs').collection('ordered');
const paymentTable = client.db('microJobs').collection('payments');
const withdrawalTable = client.db('microJobs').collection('withdrawals');

async function run() {
  try {
   
    // await client.connect();


    const verifyToken = (req, res,next)=>{
      console.log('Inside verify token', req.headers?.authorization);

      if(!req.headers.authorization){
        console.log('caught khaici');
         res.status(401).send({message:'unauthorized access'});
      }
      else{

        const token= req.headers.authorization.split(' ')[1];

        jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded)=>{
            if(err){
              console.log('Next caught khaici');
             return  res.status(403).send({message:'Forbidden access'})
            }

            console.log('Par hoyeci');
           
              req.decoded = decoded;
              next();
            
        })

       

      }

    }



    const verifyAdmin = async(req,res,next)=>{
      const email = req.decoded.email;
      const user = await userTable.findOne({email:email})
      if(user.role && user?.role==='admin'){
       
        next();
      }
      else{
        return res.status(403).send({message:"You don't have permission"})
      }
    }

    const verifyBuyer = async(req,res,next)=>{
      const email = req.decoded.email;
      const user = await userTable.findOne({email:email})
      if(user.role && user?.role==='buyer'){
       
        next();
      }
      else{
        return res.status(403).send({message:"You don't have permission"})
      }
    }
    const verifyWorker = async(req,res,next)=>{
      const email = req.decoded.email;
      const user = await userTable.findOne({email:email})
      if(user.role && user?.role==='worker'){
       
        next();
      }
      else{
        return res.status(403).send({message:"You don't have permission"})
      }
    }



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

    app.get('/users', async(req,res)=>{
      const users = await userTable.find().toArray();
      res.send(users)
    })

    app.post('/tasks', verifyToken,verifyBuyer, async(req,res)=>{
      const task = req.body;
      const result = await taskTable.insertOne(task);
 
      res.send(result)
    })
    
    app.get('/tasks/:email',verifyToken,verifyBuyer, async(req,res)=>{
      const email = req.params.email;
      const tasks = await taskTable.find({addedBy:email}).toArray();
   
      res.send(tasks);

    })

    app.delete('/tasks/:id', async(req,res)=>{
      const id =  req.params.id;
      const result = await taskTable.deleteOne({_id: new ObjectId(id)});
      res.send(result);

    })

    app.patch('/users/:email', async(req, res)=>{
      const email = req.params.email;
      const amountDoc =req.body;
      console.log(amountDoc);
      const user =await userTable.findOne({email:email});
      const newCoin = parseInt(user.coin)+parseInt(amountDoc.amount);
      
      const updatedUser ={
        $set:{
          coin:newCoin,

        }
      }
      const result = await userTable.updateOne({email:email}, updatedUser )
      res.send(result);

    })

    app.patch('/users', async(req,res)=>{
      const user = req.body;
      const filter = {email:user.email};
    
      const updatedUser = {
        $set:{
          coin:user.coin,
          
        }
      }
      const result = await userTable.updateOne(filter, updatedUser)
      res.send(result)
    })

    app.post('/ordered', async(req,res)=>{
      const orderedTask =  req.body;
      const result = await orderTable.insertOne(orderedTask);
      res.send(result);

    })

    app.patch('/ordered/:id', async(req,res)=>{
      const id = req.params.id;
      const job = req.body;
      const filter = {
        _id:new ObjectId(id)
      }

      const taskId= job.taskId;
     
      const filterTask={
        _id: new ObjectId(taskId)
      }
      console.log(taskId);
      const task = await taskTable.findOne(filterTask)
      const existingWorker = parseInt(task.worker)
      const newWorker = existingWorker+1;
      const updatedJob = {
        $set:{
          status:job.status,
          worker:job.worker
        }
      }

      const updatedTask = {
         $set:{
            worker:newWorker
         }
      }

      const resultTask = await taskTable.updateOne(filterTask, updatedTask );
      if(resultTask){
        console.log(resultTask);
        const result = await orderTable.updateOne(filter, updatedJob);
        res.send(result);
      }

      
    })

    app.patch('/addCoin/:email',verifyToken,verifyBuyer, async(req,res)=>{
      const email = req.params.email;
      const addedCoin= req.body;
      const user = await userTable.findOne({email:email})
      const newCoin = parseInt(user.coin)+ parseInt(addedCoin.coin);
      const filter = {
        email:email
      }
      const updatedUser = {
        $set:{
          coin:newCoin
        }
      }
      const result = await userTable.updateOne(filter, updatedUser)
      res.send(result)
    } )

    app.post('/paymentHistory',verifyToken,verifyBuyer, async(req,res)=>{
      const payment = req.body;
      const result = await paymentTable.insertOne(payment);
      res.send(result);
    })
    app.get('/payments/:email', async(req,res)=>{
      const email = req.params.email;
     const filter = {
      email: email
     }
      const result = await paymentTable.find(filter).toArray();
      res.send(result);
    })

    app.post('/withdrawals', verifyToken, verifyWorker, async(req,res)=>{
      const withdrawals = req.body;
      const result = await withdrawalTable.insertOne(withdrawals)
      res.send(result)
    })

    app.get('/withdrawals/:email', async(req,res)=>{
      const email = req.params.email;
      const filter = {
        email:email
      }

      const result = await withdrawalTable.find(filter).toArray();
      res.send(result)
    })

    app.patch('/reduceUserCoin/:email',verifyToken,verifyAdmin, async(req,res)=>{
      const email = req.params.email;
      const amountDoc = req.body;
      const filter = {
        email:email
      }

      console.log(amountDoc);
      const user = await userTable.findOne(filter);

      const newCoin = parseInt(user.coin)- parseInt(amountDoc.coin);
      const updatedUser = {
        $set:{
          coin:newCoin,
          
        }
      }

      const filterTask = {
        _id: new ObjectId(amountDoc.id),
      }

      const updatedTask = {
        $set:{
          status:amountDoc.status
        }
      }





      const resultTask = await withdrawalTable.updateOne(filterTask, updatedTask)

      console.log(resultTask);

      if(resultTask.modifiedCount>0){

        
        const result = await userTable.updateOne(filter, updatedUser);
        
        res.send(result)

      }

      
      
     
    })

    app.get('/myOrders/:email',verifyToken, verifyWorker, async(req,res)=>{
      const email  = req.params.email;
      const orders = await orderTable.find({worker_email:email}).toArray();
      res.send(orders)

    })


    app.get('/requests',async(req,res)=>{
        const requests = await withdrawalTable.find({status:'pending'}).toArray();
        res.send(requests)
    })

    app.get('/users/:email', async(req,res)=>{
        const user= await userTable.findOne({email:req.params.email})
        res.send(user)
    })

    app.delete('/users/:email', async(req,res)=>{
      const email = req.params.email;
      const result = await userTable.deleteOne({email:email});
      res.send(result);
    })

    app.patch('/user/admin/:email',verifyToken,verifyAdmin, async(req,res)=>{
      const email = req.params.email;
      const filter = {email:email};
      const roleObject = req.body;

      const updatedUser= {
        $set:{
          role:roleObject.role
        }
      }
      const result = await userTable.updateOne(filter, updatedUser)
      res.send(result);
    })

    app.get('/pendingJobs/:email', async(req,res)=>{
      const email = req.params.email;
      const tasks = await orderTable.find({buyerEmail:email , status:'panding'}).toArray();
      
      res.send(tasks)
    })

    app.get('/task/:id',async(req,res)=>{
      const id = req.params.id;
     
      const task = await taskTable.findOne({_id:new ObjectId(id)})
      res.send(task);
    })

    app.get('/workers',async(req,res)=>{
      
      const workers = await userTable.find({role:'worker'}).sort({coin:-1}).limit(6).toArray();
     
      res.send(workers)
    })

    app.get('/jobs',verifyToken, async(req,res)=>{
      const filter = {
        $expr: { $gt: [{ $toInt: "$worker" }, 0] }
      };
      const tasks = await taskTable.find(filter).toArray();
      res.send(tasks);
    })

    app.get('/allJobs',verifyToken,verifyAdmin,async(req,res)=>{
      const tasks = await taskTable.find().toArray();
      res.send(tasks)
    })

    app.delete('/deleteJob/:id',verifyToken, verifyAdmin, async(req,res)=>{
        const id = req.params.id;
        const result = await taskTable.deleteOne({_id:new ObjectId(id)});
        res.send(result)
    })


    app.post('/users/google', async(req,res)=>{
      const user = req.body;
      const result = await userTable.findOne({email:user.email});
      console.log(result);
      if(!result){
        const resultTask = await userTable.insertOne(user);
        res.send(resultTask);
      }
      res.send({message:'user already existed'})
    })

    app.patch('/workerChange/:id', async(req, res)=>{
      const id = req.params.id;
      const workerList = req.body; 
      const updatedWorker = workerList.worker-1;
      const filter = {
        _id:new ObjectId(id)
      }
      const updatedJob = {
        $set:{
          worker:updatedWorker
        }
      }
      const result = await taskTable.updateOne(filter, updatedJob)
      res.send(result)
    })

    app.patch('/worker/:email', async(req,res)=>{
    
      const job =  req.body;
      console.log('line 233',req.body);
      const user = await userTable.findOne({email:job.worker_email});
      const coin = user.coin;
     console.log(user);
      const filter = {
        email:job.worker_email
      }

      const newCoin = parseInt(job.amount)
      const updatedCoin = newCoin+coin;
      console.log('Updated coin', updatedCoin);
      const updatedUser = {
          $set:{
            coin:updatedCoin,
            
          }
      }
      const result = await userTable.updateOne(filter, updatedUser)
      console.log(result);
      res.send(result);
    })

    app.patch('/orderAccept/:id',async(req,res)=>{
      const id = req.params.id;
      const job = req.body;
      const filter = {
        _id:new ObjectId(id)
      }
      const updatedJob = {
        $set:{
          status:job.status
        }
      }
      const result = await orderTable.updateOne(filter, updatedJob);
      res.send(result);
    })

    // //
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
   
  }
}
run().catch(console.dir);


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});