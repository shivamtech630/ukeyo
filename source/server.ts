import http from 'http';
import bodyParser from 'body-parser';
import express from 'express';
import logging from './config/logging';
import config from './config/config';
import sampleRoutes from './routes/sample';
const { default: Shopify, ApiVersion } = require('@shopify/shopify-api');
import dotenv from 'dotenv';

dotenv.config();

const NAMESPACE = 'Server';
const router = express();

const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET_KEY, SHOPIFY_API_SCOPES, SHOPIFY_API_SHOP, SHOPIFY_API_HOST } = process.env;
// console.log('SHOPIFY_API_HOST', SHOPIFY_API_SCOPES);
// const sc= SHOPIFY_API_SCOPES.split(',')
console.log('SHOPIFY_API_HOST', SHOPIFY_API_SCOPES);
Shopify.Context.initialize({
  API_KEY: SHOPIFY_API_KEY,
  API_SECRET_KEY: SHOPIFY_API_SECRET_KEY,
  SCOPES: SHOPIFY_API_SCOPES,
  HOST_NAME: SHOPIFY_API_HOST,
  API_VERSION: ApiVersion.April22,
  IS_EMBEDDED_APP: true,
  SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
});

const ACTIVE_SHOPIFY_SHOPS = {};

// Shopify.Context.initialize({
//     API_KEY:  process.env.TZ?,
//     API_SECRET: SHOPIFY_API_SECRET_KEY,
//     SCOPES: SHOPIFY_API_SCOPES,
//     HOST_NAME: SHOPIFY_API_HOST.replace(/https?:\/\//, ''),
//     HOST_SCHEME: SHOPIFY_API_HOST.split('://')[0],
//     IS_EMBEDDED_APP: true,
//     API_VERSION: ApiVersion.April22 // all supported versions are available, as well as "unstable" and "unversioned"
// });

/** Log the request */
router.use((req, res, next) => {
    /** Log the req */
    logging.info(NAMESPACE, `METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}]`);

    res.on('finish', () => {
        /** Log the res */
        logging.info(NAMESPACE, `METHOD: [${req.method}] - URL: [${req.url}] - STATUS: [${res.statusCode}] - IP: [${req.socket.remoteAddress}]`);
    });

    next();
});

/** Parse the body of the request */
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

/** Rules of our API */
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.method == 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }

    next();
});

/** Routes go here */
router.use('/sample', sampleRoutes);

/** Error handling */
router.use((req, res, next) => {
    const error = new Error('Not found');

    res.status(404).json({
        message: error.message
    });
});

const httpServer = http.createServer(router);

httpServer.listen(config.server.port, () => logging.info(NAMESPACE, `Server is running ${config.server.hostname}:${config.server.port}`));
