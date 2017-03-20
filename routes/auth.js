/**
 * Created by JasonXu on 2017/3/18.
 */
"use strict";

let User = require("../mongo").User;
let errors = require("../errors");

/**
* auth midware, based on cookie or token in queryString or token in HTTP Header.
*/
module.exports = function(req, res, next){
    let name = "Jason";
    User.findOne({name: "Jason"}).exec()
        .then((r)=>{
            if(r){
                req.user = {id: r._id, name: r.name};
                next();
            }else{
                next(new errors.BadRequest("User not found."))
            }
    });
}
