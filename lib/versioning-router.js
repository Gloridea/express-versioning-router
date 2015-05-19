var methods = require('methods');
var pathToRegexp = require('path-to-regexp');

module.exports = function vrouter(express) {

    function vrouter_(req, res, next) {
        var isMatchedPathExist = false;
        var versions = [];

        var map = requestMap[req.method.toLowerCase()];

        for (var path in map) {
            versions = map[path];

            if (versions.regexp.exec(req.url)) {
                isMatchedPathExist = true;
                break;
            }
        }

        if (!isMatchedPathExist) {
            return next();
        }

        var reqVersion = req.__version__;

        var version = -1;

        for (var i = 0; i < versions.length; i++) {
            if (versions[i] <= reqVersion) {
                version = versions[i];
                break;
            }
        }

        if (version == -1) {
            return res.status(404).send("Not found");
        }

        var router = routers[version];

        router.handle(req, res, next);
    }

    var requestMap = {};
    var routers = [];


    methods.concat('all').forEach(function(method) {
        vrouter_[method] = function(ver, path, callback) {
            if (!(method in requestMap)) {
                requestMap[method] = {};
            }

            var map = requestMap[method];

            if (!(path in map)) {
                map[path] = [];
                map[path].regexp = pathToRegexp(path, []);
            }

            var versions = map[path];

            if (versions.indexOf(ver) < 0) {
                versions.push(ver);
                versions.sort(function(a, b) { return b - a; });
            }

            var router = routers[ver];

            if (!router) {
                router = express.Router();
                router.ver = ver;
                routers[ver] = router;
            }

            return router[method].apply(router, [].slice.call(arguments, 1));
        }
    });

    return vrouter_;
}

module.exports.redirector = function redirector(req, res, next) {
    var match = /\/v(\d+)\//.exec(req.url);
    var version = (match && match[1]) || 1;
    req.__version__ = version;
    req.url = req.url.substring(3);

    next();
}