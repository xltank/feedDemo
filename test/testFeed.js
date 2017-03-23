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
 *  @index integer, sequence in top-n list.
 * */
let getDate = (index=0) =>{
    return new Date(baseTime - index * 1000);
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

let baseUrl = "http://localhost:3000/topics/feed?time=";

/**
 * It's basically a top-n problem, so we generate a [0 - 19] list, and use the index to generate request url to simulate
 * requests at different time point.
 * [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]
 * when index=0, there is no new topic.
 * when index=5, 5 new topics: 0 - 4
 * when index=10, 10 new topics: 0 - 9, result=[0-6]
 * when index=0, user subscribed topic 2, no new topic, but topic 18 should be removed from result
 * when index=3, user subscribed topics[14, 15, 16], 2 new topics[18, 19], and topics[14, 15, 16] should be removed from result.
 * */
let cases = [
    {index: 0, subscribed: [], resultCount: feedCount, url: baseUrl+getDate(0).getTime(), results: [0, 1, 2, 3, 4, 5, 6]},
    {index: 5, subscribed: [], resultCount: feedCount, url: baseUrl+getDate(5).getTime(), results: [0, 1, 2, 3, 4, 5, 6]},
    {index: 10, subscribed: [], resultCount: feedCount, url: baseUrl+getDate(10).getTime(), results: [0, 1, 2, 3, 4, 5, 6]},
    {index: 0, subscribed: [2], resultCount: feedCount, url: baseUrl+getDate(0).getTime(), results: [0, 1, 3, 4, 5, 6, 7]},
    {index: 0, subscribed: [0, 1, 2, 3, 4, 5, 6], resultCount: feedCount, url: baseUrl+getDate(0).getTime(), results: [7,8,9,10,11,12,13]},
    {index: 3, subscribed: [4,5,6], resultCount: feedCount, url: baseUrl+getDate(3).getTime(), results: [0, 1, 2, 3, 7, 8, 9]},
];



let topics ;

// !!! skiped
describe.skip("Test topic feed", function() {
    before("before(), prepare data ...", (done) => {
        baseTime = Date.now();

        Topic.deleteMany({}).exec()
        .then((r) => {
            return Topic.insertMany(genData(20))
        })
        .then((r) => {
            topics = r;
            done();
        })
    });

    cases.forEach((c) => {
        it("should get "+c.resultCount+" items", (done) => {
            User.deleteMany({}).exec()
            .then(() => {
                let subs = [];
                for(let s of c.subscribed){
                    subs.push({_id: topics[s]._doc._id, updatedAt: new Date()});
                }
                return User.create({name: "Jason", subscribed: subs});
            })
            .then(()=>{
                return requestP(c.url);
            })
            .then((result) => {
                let data = JSON.parse(result.body).data;
                console.log(data);
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
    });
});



let baseUrl2 = "http://localhost:3000/topics/feed2?lastTime={lastTime}&subCount={subCount}";
/**
 *
 * */
let cases2 = [
    {index: 0, subscribed: [], resultCount: 0, results: []},
    {index: 5, subscribed: [], resultCount: 5, results: [0, 1, 2, 3, 4]},
    {index: 10, subscribed: [], resultCount: feedCount, results: [0, 1, 2, 3, 4, 5, 6]},
    {index: 0, subscribed: [2], resultCount: 1, results: [7]},
    {index: 0, subscribed: [0, 1, 2, 3, 4, 5, 6], resultCount: feedCount, results: [7,8,9,10,11,12,13]},
    {index: 3, subscribed: [], resultCount: 3, results: [0, 1, 2]},
    {index: 3, subscribed: [3,5,7,8], resultCount: 4, results: [0, 1, 2, 10]},
];


describe("Test topic feed2", function() {
    before("before(), prepare data ...", (done) => {
        baseTime = Date.now();

        Topic.deleteMany({}).exec()
            .then((r) => {
                return Topic.insertMany(genData(20))
            })
            .then((r) => {
                topics = r;
                done();
            })
    });

    cases2.forEach((c) => {
        it("should get "+c.resultCount+" items", (done) => {
            User.deleteMany({}).exec()
                .then(() => {
                    let subs = [];
                    for(let s of c.subscribed){
                        subs.push({_id: topics[s]._doc._id, updatedAt: new Date()});
                    }
                    return User.create({name: "Jason", subscribed: subs});
                })
                .then(()=>{
                    let url = baseUrl2.replace("{lastTime}", ''+getDate(c.index).getTime()).replace("{subCount}", ''+c.subscribed.length);
                    return requestP(url);
                })
                .then((result) => {
                    let data = JSON.parse(result.body).data;
                    console.log(data);
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
    });
});

