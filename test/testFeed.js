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
 * [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]
 * when index=20, there is no new topic.
 * when index=15, 4 new topics: 16 - 19
 * when index=10, 9 new topics: 11 - 19
 * when index=20, user subscribed topic 18, no new topic, but topic 18 should be removed from result
 * when index=17, user subscribed topics[14, 15, 16], 2 new topics[18, 19], and topics[14, 15, 16] should be removed from result.
 * */
let cases = [
    {index: 20, subscribed: [], resultCount: feedCount, url: "http://localhost:3000/topics/feed?time="+getDate(20).getTime(), results: [19, 18, 17, 16, 15, 14, 13]},
    {index: 15, subscribed: [], resultCount: feedCount, url: "http://localhost:3000/topics/feed?time="+getDate(15).getTime(), results: [19, 18, 17, 16, 15, 14, 13]},
    {index: 10, subscribed: [], resultCount: feedCount, url: "http://localhost:3000/topics/feed?time="+getDate(10).getTime(), results: [19, 18, 17, 16, 15, 14, 13]},
    {index: 20, subscribed: [18], resultCount: feedCount, url: "http://localhost:3000/topics/feed?time="+getDate(20).getTime(), results: [19, 17, 16, 15, 14, 13, 12]},
    {index: 17, subscribed: [16, 15, 14], resultCount: feedCount, url: "http://localhost:3000/topics/feed?time="+getDate(17).getTime(), results: [19, 18, 17, 13, 12, 11, 10]},
];

let topics ;

describe("Test topic feed", function() {
    beforeEach("before(), prepare data ...", (done) => {
        User.deleteMany({}).exec()
        .then(() => {
            return Topic.deleteMany({}).exec();
        })
        .then((r) => {
            return Topic.insertMany(genData(20))
        })
        .then((r) => {
            topics = r;
            done();
            console.log("--- before() done.")
        })
    });

    cases.forEach((c) => {
        it("should get "+c.resultCount+" items", (done) => {
            Promise.resolve(1)
            .then(() => {
                let subs = [];
                for(let s of c.subscribed){
                    console.log(s);
                    subs.push(topics[s]._doc._id);
                }
                console.log(subs);
                return User.create({name: "Jason", subscribed: subs});
            })
            .then(()=>{
                return requestP(url);
            })
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
    });
});

