"use strict";
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
    httpRouter.get("/", async (ctx) => {
        ctx.body = `<!DOCTYPE html>
<html><body>
    <h1>NodeJS-based Graphics Server</h1>
    <ul>
        <li><a href="/serverApi/v1/graphics/list">List Graphics</a></li>
        <li><a href="/serverApi/v1/renderers/list">List Renderers</a></li>
    </ul>
    <div>
    <form action="/serverApi/v1/graphics/graphic" method="post" enctype="multipart/form-data">
        Upload Graphic (zip file): <br />
        <input type="file" id="graphic" name="graphic" accept=".zip" />
        <input type="submit" />
    </form>
    </div>
</body>
</html>`;
    });
    filter.http(httpRouter.routes());
    filter.ws(wsRouter.routes());
    app.use(filter.protocols());
    const PORT = 8080;
    app.listen(PORT);
    console.log(`Server running on \x1b[36m http://127.0.0.1:${PORT}/\x1b[0m`);
}
