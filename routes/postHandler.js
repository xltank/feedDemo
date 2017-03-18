/**
 * Created by JasonXu on 2017/3/18.
 */
"use strict";

/**
* handle result after all router handler, organize/format result into JSON
*/
module.exports = function(data, req, res, next){
    if(data instanceof Error){
        next(data);
        return;
    }

    if(data === null || data === undefined){
        data = {};
    }

    data.status = "OK";
    res.send(data);
};
