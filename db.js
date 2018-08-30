var mongoose = require('mongoose');var express = require('express'),
	app =  express(),
	server =  require('http').createServer(app),
	io = require('socket.io').listen(server),
	mongoose = require('mongoose')
	users = {};

mongoose.connect('mongodb://localhost/chat',function(err){

	if(err){
		console.log(err);
	}else{
		console.log('Mongodb Connected....');
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
	Msg_from:String,
	msg_to:String,
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
