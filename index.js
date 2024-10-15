const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'BlogDB',
    password: '1Puba6da7',
    port: 5432,
});

client.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error', err.stack));

app.use((req, res, next) => {
    console.log("Request method: ", req.method);
    next();
});

app.get('/', (req, res) => {
    const { userId, username } = req.query; 
    client.query('SELECT * FROM blogs ORDER BY date_created DESC', (error, results) => {
        if (error) {
            console.error('Error fetching posts:', error);
            return res.status(500).send('Server error');
        }
        res.render('index', { 
            posts: results.rows, 
            username: username || '',  
            userId: userId || null      
        });
    });
});


app.post('/post', (req, res) => {
    const { title, content, creator, creator_user_id } = req.body;
    const insertPostQuery = `
        INSERT INTO blogs (title, body, creator_name, creator_user_id) 
        VALUES ($1, $2, $3, $4)
    `;

    client.query(insertPostQuery, [title, content, creator, creator_user_id], (error) => {
        if (error) {
            console.error('Error inserting post:', error);
            return res.status(500).send('Server error');
        }

        res.redirect(`/?userId=${creator_user_id}&username=${creator}`);
    });
});



app.get('/edit/:id', (req, res) => {
    const postId = parseInt(req.params.id, 10);
    client.query('SELECT * FROM blogs WHERE blog_id = $1', [postId], (error, results) => {
        if (error) {
            console.error('Error fetching post:', error);
            return res.status(500).send('Server error');
        }
        if (results.rows.length > 0) {
            res.render('edit', { post: results.rows[0] });
        } else {
            res.status(404).send('Post not found');
        }
    });
});


app.post('/edit/:id', (req, res) => {
    const postId = parseInt(req.params.id, 10);
    const { title, content } = req.body;
    const updatePostQuery = 'UPDATE blogs SET title = $1, body = $2 WHERE blog_id = $3';
    client.query(updatePostQuery, [title, content, postId], (error) => {
        if (error) {
            console.error('Error updating post:', error);
            return res.status(500).send('Server error');
        }
        res.redirect('/');
    });
});


app.post('/delete/:id', (req, res) => {
    const postId = parseInt(req.params.id, 10);
    const deletePostQuery = 'DELETE FROM blogs WHERE blog_id = $1';
    client.query(deletePostQuery, [postId], (error) => {
        if (error) {
            console.error('Error deleting post:', error);
            return res.status(500).send('Server error');
        }
        res.redirect('/');
    });
});


app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', (req, res) => {
    const { name, password } = req.body; 
    const checkUserQuery = 'SELECT * FROM users WHERE name = $1'; 
    client.query(checkUserQuery, [name], (error, results) => {
        if (error) {
            console.error('Error checking user name:', error);
            return res.status(500).send('Server error');
        }

        if (results.rows.length > 0) {
            return res.send('User name is already taken. Please choose another one.');
        }

        const insertUserQuery = 'INSERT INTO users (name, password) VALUES ($1, $2)';
        client.query(insertUserQuery, [name, password], (insertError) => {
            if (insertError) {
                console.error('Error inserting user:', insertError);
                return res.status(500).send('Server error');
            }
            console.log('User signed up:', { name });
            res.redirect('/signin');
        });
    });
});

app.get('/signin', (req, res) => {
    res.render('signin'); 
});

app.post('/signin', (req, res) => {
    const { name, password } = req.body;

    const checkUserQuery = 'SELECT * FROM users WHERE name = $1 AND password = $2';
    client.query(checkUserQuery, [name, password], (error, results) => {
        if (error) {
            console.error('Error checking user:', error);
            return res.status(500).send('Server error');
        }

        if (results.rows.length > 0) {
            const user = results.rows[0];
            console.log('User signed in:', { name });
            res.redirect(`/?userId=${user.user_id}&username=${user.name}`); 
        } else {
            res.send('Invalid Name or Password');
        }
    });
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
