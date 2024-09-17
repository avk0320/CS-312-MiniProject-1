const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

let posts = [];


app.use((req, res, next) => {
    console.log("Request method: ", req.method);
    next();
});

app.get('/', (req, res) => {
    res.render('index', { posts: posts });
});

app.post('/post', (req, res) => {
    const newPost = {
        id: Date.now(),  
        title: req.body.title,
        content: req.body.content,
        creator: req.body.creator,
        date: new Date()
    };
    posts.push(newPost);  
    res.redirect('/'); 
});


app.get('/edit/:id', (req, res) => {
    const postId = parseInt(req.params.id, 10);
    const post = posts.find(p => p.id === postId);
    if (post) {
        res.render('edit', { post: post });
    } else {
        res.status(404).send('Post not found');
    }
});

app.post('/edit/:id', (req, res) => {
    const postId = parseInt(req.params.id, 10);
    let post = posts.find(p => p.id === postId);
    if (post) {
        post.title = req.body.title;
        post.content = req.body.content;
        post.creator = req.body.creator;
        post.date = new Date(); 
        res.redirect('/');
    } else {
        res.status(404).send('Post not found');
    }
});


app.get('/posts', (req, res) => {
    res.json(posts);  
});

app.post('/delete/:id', (req, res) => {
    const postId = parseInt(req.params.id, 10); 
    posts = posts.filter(post => post.id !== postId); 
    res.redirect('/'); 
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
