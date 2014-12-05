var db = require('./mongo_database.js')
var bcrypt = require('bcrypt-nodejs');

var saveNewUser = exports.saveNewUser = function(username, password, errCallback, successCallback) {
	var newUser = new db.userModel({
	  username: username,
	  password: password
	});

	newUser.save(function(err, doc) {
	  if (err) { errCallback(); }
	  else { successCallback(); }
	})
}


var saveNewPost = exports.saveNewPost = function(username, title, content, errCallback, successCallback, isPublished) {
	var post = new db.postModel({
		title: title,
		// is_published: isPublished,
		content: content
	})

  //Won't write if user not found, but won't throw error either
	db.userModel.findOneAndUpdate({username: username}, {$push: {posts: post}, new: true}, function(err, doc){
		if (err) { errCallback(); }
		else { successCallback(); }
	})
}


var getAllPosts = exports.getAllPosts = function(username, callback) {
  db.userModel.findOne({username: username})
    .exec(
      function(err,doc) {
        if (err) { throw err; }
        if (doc) {
          callback(doc.posts);
        } else {
          callback("User not found", 403)
        }
      }
    ) 
};


var authenticateUser = exports.authenticateUser = function(username, password, errCallback, successCallback) {
	db.userModel.findOne({username: username}, function(err,doc) {
		if (err) { errCallback(); }
	    else {
	      bcrypt.compare(password, doc.password, function(err, result){
	        if(!err && result){
	          // req.session.regenerate(function(){
	             // req.session.user = username;
	             successCallback();
	          // });
			} else {
				errCallback();
			}
	      });
	    }
	});
}

