var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
online_users = {};

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
app.io = require('socket.io')();
var io = require('socket.io')();
var autoIncrement = require('mongoose-auto-increment');

var connection = mongoose.connect('mongodb://localhost/chat', function(err){
  if(err){
    console.log(err);
  } else{
    console.log('Connected to mongodb!');
  }
});
var Schema = mongoose.Schema;
var all_users = {};
var users_id = {};

autoIncrement.initialize(connection);
var newuserSchema = Schema({
  user_id : Number,
  user_name: String,
  time: {type: Date, default: Date.now}
});
//newuserSchema.plugin(autoIncrement.plugin, 'NEWUSER');
var newUser = mongoose.model('User', newuserSchema);

var messagesSchema = Schema({
  message_id : {type:Number, unique:true},
  msg_from : {type: Schema.Types.ObjectId, ref: 'User'},
  msg_to : {type: Schema.Types.ObjectId, ref: 'User'},
  msg : String,
  read : {type:Boolean, default: false},
  created: {type: Date, default: Date.now}
});
var Msg = mongoose.model('Message', messagesSchema);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'devel opment') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
// start listen with socket.io
app.io.on('connection', function(socket){

  function load_old_messages(id) {
    var query = Msg.find({$or: [{'msg_from': id}, {'msg_to': id}]}).populate('msg_from');
    query.sort('-created').limit(10).exec(function (err, docs) {
      if (err) throw err;
      socket.emit('load old msgs', docs);
    });
  }

  socket.on('new user by id', function(data, callback){

    if (data in all_users){
      callback(false);
    } else{
      var query = newUser.find({});
      query.and([{ user_id : data }]).exec(function(err, docs) {
        if (err) throw err;

        socket.userid = docs[0].toObject()._id;
        socket.nickname = docs[0].toObject().user_name;
        all_users[socket.nickname] = socket;
        users_id[socket.userid] = socket;
        updateNicknames();
        load_old_messages(socket.userid);
        callback(docs[0].toObject().user_name);
      });
    }
  });

  socket.on('new user', function(data, callback){

    if (data in all_users){
      callback(false);
    } else{
      newuserSchema.plugin(autoIncrement.plugin, { model: 'newUser', field: 'user_id' });
      var newUsr = new newUser({user_name: data});
      newUsr.save(function(err) {
        if (err) throw err;
        var query = newUser.find({});
        query.sort('-user_id').limit(8).exec(function(err, docs) {
          if (err) throw err;
          offline_users(docs);
          socket.uid = docs[0].toObject()._id;
          socket.nickname = docs[0].toObject().user_name;
          //console.log(socket.nickname);
          users_id[socket.uid] = docs[0];
          all_users[socket.uid] = socket;
          updateNicknames();
          callback(socket.uid);
        });
      });
    }
  });

  function offline_users(docs){
    socket.emit('offline_users', docs);
  }

  function updateNicknames(){
    socket.emit('usernames', Object(users_id));
  }

  socket.on('send message', function(data, callback){
    var msg = data.trim();
    var ind = msg.indexOf('-*&');
    var name = msg.substring(0, ind);
    var msg = msg.substring(ind + 3);
    if(msg !== -1){
      if(name in all_users){
        messagesSchema.plugin(autoIncrement.plugin, { model: 'Msg', field: 'message_id' });
        var newMsg = new Msg({msg_from: socket.uid, msg_to: name, msg: msg, read: false});
        newMsg.save(function(err) {
          if (err) throw err;
          all_users[name].emit('whisper', {msg_to: socket.uid, msg: msg, name: socket.nickname});
        });
      } else{
        callback('Error!  Enter a valid user.');
      }
    } else{
      callback('Error!  Please enter a message for your whisper.');
    }
  });

  socket.on('oppSocket',function(data,callback){
    //console.log(socket.nickname);
    var msg = data.trim();
    var ind = msg.indexOf('-*&');
    var name = msg.substring(0, ind);
    var msg = msg.substring(ind + 3);
    //console.log(typeof msg);
    //console.log(msg.length);
    all_users[name].emit('typing',{msg : msg, oppid : socket.uid});
  });

  socket.on('disconnect', function(data){
    if(!socket.uid) return;
    delete users_id[socket.uid];
    updateNicknames();
  });
});

