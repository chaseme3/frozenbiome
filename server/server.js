var express     = require('express');
var bodyParser = require('body-parser');
var morgan  = require('morgan');
var app = express();
var bodyParser = require('body-parser'); //bodyparser + json + urlencoder
var morgan  = require('morgan'); // logger
var mongo_helpers = require('./db/mongo_helpers.js')
var session = require('express-session');
var marked = require('marked');
var path = require('path');

var photoUploadRouter = express.Router();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(session({
  secret: 'zfnzkwjehgweghw',
  resave: false,
  saveUninitialized: true
}));

app.use(express.static(__dirname + '/../client'));
app.use(express.static(__dirname + '/photo-upload'));


app.use('/api/photo-upload', photoUploadRouter);

//Set up routes
var routes = {};

var port = process.env.PORT || 8000;

app.listen(port);
console.log("Listening on localhost: " + port)

require('./photo-upload/photoUploadRoutes')(photoUploadRouter);
// require('./photo-upload/photoUploadRoutes')(photoRouter);


/********** GET REQUESTS ********/

// get all posts for user
app.get('/users*', function(req, res) {
  //If username is in URL, parse that. If not, get from session
  var username;
  var direct_query_username = req.url.split('/')[2];

  console.log ('USER FROM URL: ',direct_query_username);
  console.log("USER FROM COOKIE: ", req.session.user)

  if (direct_query_username !== undefined) {
    username = direct_query_username;
  } else if (req.session.user) {
    username = req.session.user;
  } 

	mongo_helpers.getAllPosts(username, function(doc, status) {
    if (status) {
      res.status(status).send(doc.posts);
    } else {
      doc.posts.forEach(function(post) {
        //Add a markdown-parsed version to the sent data
        post.markedContent = marked(post.content);
      })
      res.send(doc);
    }
	})
})

app.get('/logout', function(req,res) {
  if (req.session.user) {
      console.log("DESTROYING SESSION FOR ", req.session.user);
      req.session.destroy(function(){});
  } else {
    res.status(400).send('Not logged in!')
  }
})

app.get('/checkSession', function(req,res) {
	if (req.session.user) {
    res.send(JSON.stringify({
      username:  req.session.user, 
      displayName: req.session.displayName
    }))
 	} else {
 		res.status(400).send('Error checking session')
 	}
})

app.get('/allWafflers', function(req,res) {
  mongo_helpers.getAllWafflers(function(doc, status) {
    if (status) {
      console.log('FAIL?', doc)
      res.status(status).send(doc);
    } else {
      var wafflers = [];
      doc.forEach(function(user) {
        wafflers.push({
          username: user.username,
          displayName: user.displayName,
          id: user._id
        })
      })
      res.send(JSON.stringify(wafflers))
    }
  })
})





/********** POST REQUESTS ********/

//sign up new user
app.post('/signup', function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
  var displayName = req.body.displayName;
	mongo_helpers.saveNewUser(username, password, displayName,
		function() { res.status(403).send('Username Taken!')}, 
		function() { 
			req.session.regenerate(function(){
        req.session.user = username;
				req.session.displayName = displayName;
			});
			res.send('Saved!'); 
		})
})

//login with authentication 
app.post('/login', function(req,res) {
  var username = req.body.username;
  var password = req.body.password;
  mongo_helpers.authenticateUser(username, password, 
  	function() { res.status(403).send('User or Password Incorrect')}, 
  	function(user) { 
  		req.session.regenerate(function(){
  			req.session.user = user.username;
        req.session.displayName = user.displayName
  			console.log("CREATED SESSION FOR ", username)
  			console.log(req.session)
  			res.send("It's Waffle Time!");
  		});
  	})
});

//save new post
app.post('/newPost', function(req, res) {
	if (req.session.user) {
    var username = req.session.user;
    var displayName = req.session.displayName;
    console.log("POSTING FOR", username)
    var imageId = req.body.imageId;
		var title = req.body.title;
		var content = req.body.content;
		mongo_helpers.saveNewPost(username, displayName, title, content, imageId,  
			function() { res.status(403).send('Post Failed!')}, 
			function() { res.send('Posted!')})
  } else { 
    res.status(403).send('Post Failed!')
  }
})

app.post('/updatePost', function(req, res) {
	if (req.session.user) {
    var username = req.session.user;
    // var username = req.body.username;
		var title = req.body.title;
		var content = req.body.content;
		var postID = req.body.postID;
		mongo_helpers.updatePost(username, title, content, postID, 
			function() { res.status(403).send('Post Failed!')}, 
			function() { res.send('Posted!')})
  } else { 
    res.status(403).send('Post Failed!')
  }
})

/********** DELETE REQUESTS ********/

app.delete('/deletePost*', function(req,res) {
  var username = req.session.user;
  var postID = req.url.split('/')[2]
  mongo_helpers.deletePost(username, postID,
    function() { res.status(403).send('Post not found!')}, 
    function() { res.send('Post Deleted')}) 
})




// export our app for testing and flexibility, required by index.js
module.exports = app;


