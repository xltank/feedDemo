/**
 * Created by JasonXu on 2017/3/18.
 */
"use strict";

let router = require('express').Router(),
    errors = require('../errors'),
    feedCount = require('config').feedCount,
    apiUrl = require('config').apiUrl,
    Topic = require("../mongo").Topic,
    Promise = require('bluebird');

let feedUrlPattern = apiUrl + "/topics/feed?lastTime={lastTime}";

/**
 * /topics/feed?lastTime=1489826541409&count=5
 */
router.get('/feed', getFeed);

function getFeed(req, res, next){
    let count = req.query.count ? req.query.count : feedCount;
    let lastTime = req.query.lastTime;
    lastTime = lastTime && lastTime.length == 13 ? new Date(parseInt(lastTime)) : Date.now(); // quietly use Date.now() when lastTime is invalid/illegal.
    return Topic.find({updatedAt: {$gt: lastTime}}).limit(count).sort({updatedAt: -1}).exec()
        .then(function(latest){
            let gap = Math.max(count - latest.length, 0);
            if(gap > 0){
                return Topic.find({}).skip(latest.length+count).limit(gap).sort({updatedAt: -1}).exec()
                    .then(function(old){
                        return latest.concat(old);
                    })
            }
            return latest;
        })
        .then(function(r){
            let data = {
                data: r,
                refreshUrl: feedUrlPattern.replace('{lastTime}', ''+Date.now())
            };
            next(data);
        })
}


module.exports = router;