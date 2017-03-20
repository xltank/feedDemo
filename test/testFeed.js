/**
 * Created by JasonXu on 2017/3/18.
 */
"use strict";

let should = require('should'),
    mongo = require("../mongo"),
    Topic = mongo.Topic,
    User = mongo.User,
    Promise = require('bluebird'),
    requestP = Promise.promisify(require('request'));

let feedCount = require('config').feedCount;
let baseTime = Date.now();
let recordNum = 0;

/**
 * Get Date delayed by pointer * 1000ms, based on the time when this test runs.
 *  @timeIndex integer, how many seconds the date should be delayed.
 * */
let getDate = (timeIndex=0) =>{
    return new Date(baseTime + timeIndex * 1000);
};

/**
 * Generate num records, time gap is 1000ms based on the time this test runs at.
 * */
let genData = (num) => {
    let data = [];
    for(let i=0; i<num; i++){
        data.push({title: "Topic "+i, createdAt: getDate(recordNum), updatedAt: getDate(recordNum)});
        recordNum ++ ;
    }
    return data;
};

let url = "http://localhost:3000/topics/feed";

/**
 * It's basically a top-n problem, so we generate a [0 - 19] list, and use the index to generate request url to simulate
 * requests at different time point.
 * */
let cases = [
    {index: 20, resultCount: feedCount, url: "http://localhost:3000/topics/feed?time="+getDate(20).getTime(), results: [19, 18, 17, 16, 15, 14, 13]},
    {index: 15, resultCount: feedCount, url: "http://localhost:3000/topics/feed?time="+getDate(15).getTime(), results: [19, 18, 17, 16, 15, 14, 13]},
    {index: 10, resultCount: feedCount, url: "http://localhost:3000/topics/feed?time="+getDate(10).getTime(), results: [19, 18, 17, 16, 15, 14, 13]},
    {index: 20, subscribed: ["Topic 18"], resultCount: feedCount, url: "http://localhost:3000/topics/feed?time="+getDate(20).getTime(), results: [19, 17, 16, 15, 14, 13, 12]},
    {index: 17, subscribed: ["Topic 16", "Topic 15", "Topic 14"], resultCount: feedCount, url: "http://localhost:3000/topics/feed?time="+getDate(17).getTime(), results: [19, 18, 17, 13, 12, 11, 10]},
];

describe("Test topic feed", function() {
    let topics ;

    before((done) => {
        Topic.deleteMany({}).exec()
            .then((r) => {
                return Topic.insertMany(genData(20))
            })
            .then((r) => {
                topics = r;
                console.log("subscribed: ", topics[18]._doc._id);
                return User.create({name: "Jason", subscribed: [topics[18]._doc._id]})
            })
            .then((r) => {
                done();
            })
    });

    // cases.forEach((c) => {
    let c = cases[3];
    describe("Test topic feed", function() {
            it("should get "+c.resultCount+" items", (done) => {
                requestP(url)
                .then((result) => {
                    let data = JSON.parse(result.body).data;
                    console.log(data);
                    console.log('----------\n');
                    should(data.length).be.exactly(c.resultCount);
                    for(let i=0; i< data.length; i++){
                        should(data[i].title).be.exactly("Topic "+c.results[i]);
                    }
                    done();
                })
                .catch((err) =>{
                    done(err);
                })
            });
    })
});