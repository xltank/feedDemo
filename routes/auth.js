/**
 * Created by JasonXu on 2017/3/18.
 */
"use strict";

/**
* auth midware, based on cookie or token in queryString or token in HTTP Header.
*/
module.exports = function(req, res, next){
    req.user = {id: "", name: "", preference: ["tag1", "tag2"]};
    next();
}
