import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

let posts = [];

if (fs.existsSync('posts.json')) {
  posts = JSON.parse(fs.readFileSync('posts.json'));
}

app.get('/', (req, res) => {
  res.render('home', { posts });
});

app.get('/admin', (req, res) => {
  res.render('admin', { posts });
});

app.get('/create-post', (req, res) => {
  res.render('create-post');
});

app.post('/create-post', upload.single('image'), (req, res) => {
  const { title, content } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : '';

  const now = new Date();
  const createdAt = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

  const newPost = { 
    id: Date.now().toString(), 
    title, 
    content, 
    image, 
    createdAt 
  };
  posts.push(newPost);
  fs.writeFileSync('posts.json', JSON.stringify(posts, null, 2));

  res.redirect('/');
});

app.get('/posts/:id', (req, res) => {
  const postId = req.params.id;
  const post = posts.find(post => post.id === postId);

  if (!post) {
    return res.status(404).send('Post not found');
  }

  res.render('post', { post });
});

app.get('/edit/:id', (req, res) => {
  const postId = req.params.id;
  const post = posts.find(post => post.id === postId);

  if (!post) {
    return res.status(404).send('Post not found');
  }

  res.render('edit', { post });
});

app.post('/update/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : '';

  const postIndex = posts.findIndex(post => post.id === id);
  if (postIndex === -1) {
    return res.status(404).send('Post not found');
  }

  const post = posts[postIndex]; 

  post.title = title || post.title;
  post.content = content || post.content;
  if (image) {
    post.image = image;
  }

  posts[postIndex] = post;
  fs.writeFileSync('posts.json', JSON.stringify(posts, null, 2));

  res.redirect('/admin');

});

app.post('/delete-post/:id', (req, res) => {
  const postId = req.params.id;
  posts = posts.filter(post => post.id !== postId);
  fs.writeFileSync('posts.json', JSON.stringify(posts, null, 2));
  res.redirect('/admin');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
