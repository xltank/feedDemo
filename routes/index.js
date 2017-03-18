"use strict";

let express = require('express');
let router = express.Router();

let errors = require('../errors');

/* GET home page. */
router.get('/', function(req, res, next) {
    throw new errors.ForbiddenError();
});

module.exports = router;
