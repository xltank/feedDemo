/**
 * Created by JasonXu on 2017/3/18.
 */
"use strict";

let router = require('express').Router(),
    errors = require('../errors'),
    feedCount = require('config').feedCount,
    apiUrl = require('config').apiUrl,
    mongo = require('../mongo'),
    Topic = mongo.Topic,
    User = mongo.User,
    Promise = require('bluebird');

let feedUrlPattern = apiUrl + "/topics/feed?lastTime={lastTime}";


/**
 * Just return top-n, exclude subscribed ones, NOT replacing them in place.
 * /topics/feed?time=*&count=7
 * Get top[count] topics, excludes those user subscribed.
 * @time to override/simulate request time.
 * @count pagination count.
 */

router.get('/feed', getFeed);


function getFeed(req, res, next){
    let count = req.query.count ? req.query.count : feedCount;
    let time = req.query.time || Date.now();
    time = time && time.length == 13 ? new Date(parseInt(time)) : new Date();

    User.findOne({_id: req.user.id})
        .then((user) => {
            let subscribed = user.subscribed;
            if(subscribed && subscribed.length > 0)
                return Topic.find({_id: {$nin: subscribed}}).limit(count).sort({updatedAt: -1}).exec();
            else
                return Topic.find({}).limit(count).sort({updatedAt: -1}).exec();
        })
        .then(function(r){
            let data = {
                data: r
            };
            next(data);
        })
}


/**
 * /topics/feed?lastTime=*&subCount=3
 * Get top[count] topics, excludes those user subscribed.
 * @lastTime last request time.
 * @subCount topic count user subscribed this period.
 * @return {status: "OK", data: [{Topic}, ...]; Topics to
 */
router.get('/feed2', getFeed2);

function getFeed2(req, res, next){
    let subCount = req.query.subCount || 0;
    let lastTime = req.query.lastTime;
    lastTime = lastTime && lastTime.length == 13 ? new Date(parseInt(lastTime)) : new Date();

    let subscribed;

    User.findOne({_id: req.user.id})
        .then((user) => {
            subscribed = user.subscribed;
            return Topic.find({updatedAt: {$gt: lastTime}}).limit(feedCount).sort({updatedAt: -1}).exec();
        })
        .then(function(r){
            if(subCount > 0 && r.length < subCount){ // replacement mode; new topics are not enough for user subscribed this time.
                return Topic.find({updatedAt: {$lt: lastTime}, _id: {$nin: subscribed}}).skip(feedCount-subCount)
                    .limit(subCount-r.length).sort({updatedAt: -1}).exec()
                .then((old)=>{
                    return r.concat(old);
                })
            }
            // refresh mode; return new topics directly.
            return r;
        })
        .then((result)=>{
            let data = {
                data: result
            };
            next(data);
        })
}



module.exports = router;