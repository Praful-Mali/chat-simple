
var express = require('express'),
	app =  express(),
	server =  require('http').createServer(app),
	io = require('socket.io').listen(server),
	mongoose = require('mongoose')
	users = {};


	server.listen(3000);

	app.get('/', function(req , res){
			res.sendfile(__dirname + '/index.html');
	});  


	mongoose.connect('mongodb://localhost/chat',function(err){
		if(err){
			console.log(err);
		}else
		{
			console.log('Connected.....');
		}
	});

	

			var userSchema = mongoose.Schema({
				user_id:Number,
				username:String,
				Name:String,
				created_date:{type:Date, default:Date.now}
			});

			var User =  mongoose.model('User',userSchema);


			var MessageSchema = mongoose.Schema({
				massege_id:Number,
				Msg_from:Number,
				msg_to:Number,
				msg:String,
				read:{type:Boolean , default:false},
				created_date:{type:Date, default:Date.now}
			});

			var Message = mongoose.model('Message',MessageSchema);

			var GroupSchema = mongoose.Schema({

				group_id:Number,
				group_name:String,
				group_admin:String,
				created_date:{type:Date,default:Date.now}
			});

			var Group = mongoose.model('Group',GroupSchema);


			var Group_MemberSchema = mongoose.Schema({

				group_Member_id:Number,
				group_id:Number,
				user_id:Number,
				added_date:{type:Date,default:Date.now}
			})

			var GroupMember =  mongoose.model('GroupMember',Group_MemberSchema);

			var chatSchema = mongoose.Schema({
				nick: String,
				msg: String,
				crated:{type:Date,default:Date.now}
			});

			var Chat = mongoose.model('Chat',chatSchema);


	
	
	

	io.sockets.on('connection',function(socket){
		Chat.find({},function(err,docs){
			if(err) throw err;
			socket.emit('load_msg',docs)
		});

		socket.on('new user',function(data,callback){

			if(data.username in users){
				callback(false);
			}else{
				var id=data.id;
				var username = data.username;
				var name = data.username.substr(0,data.username.indexOf('@'));
				var insertUser= new User({user_id:id,username:username,Name:name}) 
				insertUser.save(function(err){
					if(err) throw err;
				})
				callback(true);
				socket.username = username;
				users[socket.username] = socket;
				updateNickname();
			}
		});

		
		

		   function updateNickname(){
		     	io.sockets.emit('username',Object.keys(users))
		   }



			socket.on('send message',function(data,callback){
				
				console.log(data);
				// var msg_from1=data.substr(0,data.indexOf(" "));	
				// var msg_to1 = socket.nickname;	
				// var msg1 = data.substr(data.indexOf(" ")+1);
				// console.log(msg1);
				// var newMsg = new Message({
				// 	massege_id:1,
				// 	Msg_from:msg_from1,
				// 	msg_to:msg_to1,
				// 	msg:msg1,
				// 	read: false
				// });
				// console.log(newMsg);
				// newMsg.save(function(err){
				// 	if(err) throw err;
				// 		io.sockets.emit('new message',{msg : msg , nick:socket.nickname});				
				// })
			});


			// socket.on('disconnect',function(data){
			// 	if(!socket.nickname) return;
			// 	delete users['socket.nickname']; 
			// 	updateNickname();
			// });
	});