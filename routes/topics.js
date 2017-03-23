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
            console.log(subscribed);
            let subedIds = [];
            for(let i=0; i<subscribed.length; i++){
                subedIds.push(subscribed[i]._id);
            }
            if(subedIds && subedIds.length > 0)
                return Topic.find({_id: {$nin: subedIds}}).limit(count).sort({updatedAt: -1}).exec();
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


let feedUrlPattern = apiUrl + "/topics/feed2?lastTime={lastTime}&subCount={subCount}";

/**
 * /topics/feed?lastTime=*
 * Get top[count] topics, excludes those user subscribed.
 * @lastTime last request time.
 * @return {status: "OK", data: [{Topic}, ...]}; Topics to
 */
router.get('/feed2', getFeed2);

function getFeed2(req, res, next){
    let lastTime = req.query.lastTime;
    let now = new Date();
    console.log('-----', lastTime, new Date(parseInt(lastTime)));
    lastTime = lastTime && lastTime.length == 13 ? new Date(parseInt(lastTime)) : now;

    let subscribed,
        latestSub,
        latestSubCount;

    User.findOne({_id: req.user.id})
        .then((user) => {
            subscribed = user.subscribed;
            latestSub = subscribed.filter((s)=>{
                return s.updatedAt.getTime() > lastTime; // no need to >= because of several latencies.
            });
            latestSubCount = latestSub.length;
            return Topic.find({updatedAt: {$gt: lastTime}}).limit(feedCount).sort({updatedAt: -1}).exec();
        })
        .then(function(r){
            if(latestSubCount > 0 && r.length < latestSubCount){ // replacement mode; new topics are not enough for user subscribed this time.
                return Topic.find({updatedAt: {$lte: lastTime}, _id: {$nin: subscribed}}).skip(feedCount-latestSubCount)
                    .limit(latestSubCount-r.length).sort({updatedAt: -1}).exec()
                .then((old)=>{
                    return r.concat(old);
                })
            }
            // refresh mode; return new topics directly.
            return r;
        })
        .then((result)=>{
            let data = {
                data: result,
                refreshUrl: feedUrlPattern.replace('{lastTime', ''+now.getTime())
            };
            next(data);
        })
}



module.exports = router;