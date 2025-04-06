const express = require('express')
const app = express() // express library
const { MongoClient, ObjectId } = require('mongodb') //MongoDB 연결하기
const methodOverride = require('method-override') //method override

app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs') // ejs can put data in html
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(methodOverride('_method'))

let db
const url = 'mongodb+srv://admin:password*@test.mjxts8v.mongodb.net/?retryWrites=true&w=majority&appName=test'
new MongoClient(url).connect().then((client)=>{
  console.log('DB연결성공')
  db = client.db('forum')
  app.listen(8080, () => { // server
    console.log('http://localhost:8080 에서 서버 실행중')
})
}).catch((err)=>{
  console.log(err)
})

app.get('/', function(요청, 응답) {
    응답.sendFile(__dirname + '/index.html')
})
app.get('/news', (요청, 응답) => { // server 기능
    db.collection('post').insertOne({title : '어쩌고'})
    // 응답.send('Rainy Day')
}) 

app.get('/shop', (요청, 응답) => { // server 기능
    응답.send('Shopping Page')
})

app.get('/list', async (요청, 응답) => {
    let result = await db.collection('post').find().toArray() //await => 처리 오래 걸리는 애들 기다리도록 하는 코드 .then 써도 됨 => 써도 됨. 
    응답.render('list.ejs', {posts : result}) // 응답은 하나만 가능
})

app.get('/time', (request, response) =>{
    response.render('time.ejs', {time : new Date()})
})

app.get('/write', (req, res)=>{
    res.render('write.ejs')
})

//Add Post
app.post('/add', async (req, res)=> {
    try { // exceptions
        if (req.body.title == '') {
            res.send("Empty Title")
        } else if(req.body.content == ''){
            res.send('Empty Content')
        } else{
            await db.collection('post').insertOne({title : req.body.title, content : req.body.content})
            res.redirect('/list')
        }
    } catch(e) {
        console.log(e) // print error message
        req.status(500).send('Server Error')
    }
})

//Details page
app.get('/detail/:postId', async (req, res) => { // url parameter
    try{
        let result = await db.collection('post').findOne({_id : new ObjectId(req.params.postId)})
        if (result == null) {
            res.status(400).send("No Post!!!")
        }else{
            res.render('detail.ejs', {post : result})
        }
    }catch(e){
        res.send("Invalid PostId!!!")
    }
})

//Edit post
app.get('/edit/:postId', async (req, res) =>{
    try{
        let result = await db.collection('post').findOne({_id : new ObjectId(req.params.postId)})
        if (result == null){
            res.status(400).send("No Post!!!")
        }else { 
            res.render("edit.ejs", {post : result})
        }
    }catch(e){
        res.send("Invalid PostId!!!")
    }
}) 

//Edit Post
app.put('/edit', async (req, res) => {
    try{
        if (req.body.title == '') {
            res.send('Empty Title')
        }else if (req.body.content == '') {
            res.send('Empty Content')
        }else{
            await db.collection('post').updateOne({_id  : new ObjectId(req.body.id)}, {$set : {title : req.body.title, content : req.body.content}})
            res.redirect('/list')
        }
    }catch(e){
        res.send("Invalid Request!!!")
    }
})


//Delete Post
app.delete('/delete', async (req, res) =>{
    let result = await db.collection('post').deleteOne({_id : new ObjectId(req.query.postId)})
    res.send('삭제완료') // ajax로 서버에 요청하는 경우는 render, redirect 사용 안 하는 게 좋음. ajax는 새로고침 안 하는 게 장점이라서.
})


//Pagenation
app.get('/list/:listId', async (req, res) => {
    let result = await db.collection('post').find()
    .skip(5 * (req.params.listId - 1)).limit(5).toArray() //skip => 성능 안 좋음. 
    res.render('list.ejs', {posts : result})
})

app.get('/list/next/:postId', async (req, res) => {
    let result = await db.collection('post')
    .find({_id : {$gt : new ObjectId(req.params.postId)}}) 
    .limit(5).toArray() //성능 걱정 없이 구현할 수 있음. 
    res.render('list.ejs', {posts : result})
})