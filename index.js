const express = require('express');
const app = express();
const path = require("path");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
var nextId = 0;
const multer  = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'posts/'); 
  },
  filename: function (req, file, cb) {
    if(nextId == 0) nextId = Date.now();
    cb(null, `${nextId}-${file.originalname}`); 
  }
});
const upload = multer({ storage: storage });
var serveIndex = require('serve-index');

const port = 1337;
app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use('/posts', express.static(path.join(__dirname, 'posts')));
var serveIndex = require('serve-index');
app.use('/posts', serveIndex(__dirname + '/posts'));

app.get('/', async (req, res) => {
  res.render("index")
})

app.get('/students', async (req, res) => {
  res.render("students")
})

app.get('/student-login', async (req, res) => {
  res.render("student-login")
})

app.get('/teachers', async (req, res) => {
  res.render("teachers")
})

const locationsRouter = require('./routes/locations')

app.use('/locations', locationsRouter)

app.post('/upload-submission', upload.single('file'), async (req, res) => {
  const file = req.file;
  const fileId = nextId + "-" + file.filename;
  nextId = Date.now();
  const userId = req.body.userId;
  console.log("userId: " + userId)

  try {
      // Initialize userIds array if it doesn't exist
      const userIds = await db.get('info.userIds') || [];
      if (!userIds.includes(userId)) {
          await db.push('info.userIds', userId);
      }

      await db.push(userId + 'data.posts', fileId);
      console.log("Successfully received " + file.filename);
      res.json({
          message: 'File uploaded successfully',
          fileName: file.filename,
          userId: userId,
      });
  } catch (error) {
      console.error('Server failed to receive; ', error);
      res.status(500).json({ error: 'Server failed to receive.' });
  }
});


app.get('/get-posts', async (req, res) => {
  try {
      var userIds = await db.get('info.userIds');
      var posts = [];
      console.log(userIds);
      await Promise.all(userIds.map(async (id) => {
          var userPosts = await db.get(id + 'data.posts');
          if (userPosts) {
              posts = posts.concat(userPosts);
          }
      }));

      res.json({
          message: 'Sent posts successfully',
          posts: posts
      });
  } catch (error) {
      console.error('Server failed to send; ', error);
      res.status(500).json({ error: 'Server failed to send.' });
  }
});

app.get('/file/:fileId', (req, res) => {
  const fileId = req.params.fileId; // Extract file ID from URL
  const filePath = path.join(__dirname, 'posts', fileId); // Construct the path to the file

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath); // Send the file to the client
  } else {
    res.status(404).json({ message: 'File not found' });
  }
});


app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
