"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeServer = initializeServer;
const koa_1 = __importDefault(require("koa"));
const router_1 = __importDefault(require("@koa/router"));
const cors_1 = __importDefault(require("@koa/cors"));
const koa_bodyparser_1 = __importDefault(require("koa-bodyparser"));
const serverApi_1 = require("./serverApi");
const rendererApi_1 = require("./rendererApi");
const koa_ws_filter_1 = require("@zimtsui/koa-ws-filter");
const GraphicsStore_1 = require("./managers/GraphicsStore");
const RendererManager_1 = require("./managers/RendererManager");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
async function initializeServer() {
    const app = new koa_1.default();
    app.on("error", (err) => {
        console.error(err);
    });
    app.use((0, koa_bodyparser_1.default)());
    app.use((0, cors_1.default)());
    // app.use(())
    const httpRouter = new router_1.default();
    const wsRouter = new router_1.default();
    const filter = new koa_ws_filter_1.KoaWsFilter();
    // Initialize internal business logic
    const graphicsStore = new GraphicsStore_1.GraphicsStore();
    const rendererManager = new RendererManager_1.RendererManager();
    // Setup APIs:
    (0, serverApi_1.setupServerApi)(httpRouter, graphicsStore, rendererManager); // HTTP API (ServerAPI)
    (0, rendererApi_1.setupRendererApi)(wsRouter, rendererManager); // WebSocket API (RendererAPI)
    // Set up static file serving:
    httpRouter.get("/", async (ctx) => {
        await serveFile(ctx, path.resolve("./public/index.html"));
    });
    httpRouter.get(/\/public\/.*/, async (ctx) => {
        await serveFromPath(ctx, path.resolve("./public"), ctx.path.trim().replace(/^\/public\//, ""));
    });
    httpRouter.get(/\/renderer\/using-layers\/.*/, async (ctx) => {
        await serveFromPath(ctx, path.resolve("../renderer/using-layers"), ctx.path.trim().replace(/^\/renderer\/using-layers\//, ""));
    });
    // httpRouter.get("/controller", async (ctx) => {
    //   await serveFile(ctx, path.resolve("../controller/dist/index.html"));
    // });
    httpRouter.get(/\/controller\/.*/, async (ctx) => {
        await serveFromPath(ctx, path.resolve("../controller/dist"), ctx.path.trim().replace(/^\/controller\//, ""));
    });
    // httpRouter.get("/renderer/*", async (ctx) => {
    //   // ctx.body = await fs.readFile("./public/index.html", "utf8");
    // });
    filter.http(httpRouter.routes());
    filter.ws(wsRouter.routes());
    app.use(filter.protocols());
    const PORT = 8080;
    app.listen(PORT);
    console.log(`Server running on \x1b[36m http://127.0.0.1:${PORT}/\x1b[0m`);
}
async function serveFromPath(ctx, folderPath, url) {
    const filePath = path.resolve(folderPath, url);
    // ensure that the resulting path is in public:
    if (!filePath.startsWith(folderPath))
        throw new Error("Invalid path");
    await serveFile(ctx, filePath);
}
async function serveFile(ctx, filePath) {
    // set header to the correct mime type
    const ext = path.extname(filePath);
    let contentType = "application/octet-stream"; // unknown
    if (ext === ".js")
        contentType = "text/javascript";
    else if (ext === ".css")
        contentType = "text/css";
    else if (ext === ".html")
        contentType = "text/html";
    else if (ext === ".png")
        contentType = "image/png";
    else if (ext === ".svg")
        contentType = "image/svg+xml";
    else if (ext === ".map")
        contentType = "application/json";
    else {
        console.error(`Unknown file type: ${ext} (${filePath})`);
    }
    try {
        ctx.set("Content-Type", contentType);
        if (contentType.startsWith("text/")) {
            ctx.set("charset", "utf-8");
            ctx.body = await fs.readFile(filePath, "utf8");
        }
        else {
            ctx.body = await fs.readFile(filePath);
        }
    }
    catch (e) {
        if (e.code === "ENOENT") {
            ctx.status = 404;
            ctx.body = "File not found";
            console.log("File not found:", filePath);
        }
        else {
            ctx.status = 500;
            ctx.body = "Internal server error";
            throw e;
        }
    }
}
