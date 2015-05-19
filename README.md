# express-versioning-router

express router wrapper for elegant versioning REST style APIs

```js
var express = require('express');
var vrouter = require('express-versioning-router');

var app = express();
var router = vrouter(express);

app.use(vrouter.redirector);
app.use('/foo', router);

router.get(1, '/hello', function(req, res, next) {
    ...
});

router.get(42, '/hello', function(req, res, next) {
    ...
});
```