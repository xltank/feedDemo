/**
 * Created by JasonXu on 2017/3/18.
 */
"use strict";

`
Topic {
    _id: ObjectId(""),
    title: "",
    createAt: ISODate(),
    updatedAt: ISODate()
}
`

let mongo = require('mongoose'),
    config = require('config'),
    Promise = require('bluebird');

mongo.Promise = Promise;

let db = mongo.connect(config.mongoConfig.url);
mongo.set("debug", true);

db.connection.on('connected', function(err){
    console.log("mongodb connected at", config.mongoConfig.url);
});
db.connection.on('error', function(err){
    console.log("mongodb connecting error", err);
});
db.connection.on('disconnected', function(err){
    console.log("mongodb DISconnected at", config.mongoConfig.url);
});

let TopicObj = {
    title: {type: String},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now}
};
let TopicSchema = new mongo.Schema(TopicObj);
let Topic = mongo.model("Topic", TopicSchema);


let UserObj = {
    name: {type: String},
    subscribed: [{type: mongo.Schema.Types.ObjectId, ref: "Topic"}],
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now}
};
let UserSchema = new mongo.Schema(UserObj);
let User = mongo.model("User", UserSchema);


module.exports = {
    db: db,
    Topic: Topic,
    User: User
};