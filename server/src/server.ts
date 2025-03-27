import Koa from "koa";
import Router from "@koa/router";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import { setupServerApi } from "./serverApi";
import { setupRendererApi } from "./rendererApi";
import { KoaWsFilter } from "@zimtsui/koa-ws-filter";
import { GraphicsStore } from "./managers/GraphicsStore";
import { RendererManager } from "./managers/RendererManager";
import * as fs from "fs/promises";
import * as path from "path";

export async function initializeServer() {
  const app = new Koa();

  app.on("error", (err: unknown) => {
    console.error(err);
  });
  app.use(bodyParser());

  app.use(cors());
  // app.use(())

  const httpRouter = new Router();
  const wsRouter = new Router();
  const filter = new KoaWsFilter();

  // Initialize internal business logic
  const graphicsStore = new GraphicsStore();
  const rendererManager = new RendererManager();

  // Setup APIs:
  setupServerApi(httpRouter, graphicsStore, rendererManager); // HTTP API (ServerAPI)
  setupRendererApi(wsRouter, rendererManager); // WebSocket API (RendererAPI)

  // Set up static file serving:
  httpRouter.get("/", async (ctx) => {
    ctx.body = await fs.readFile("./public/index.html", "utf8");
  });
  httpRouter.get(/\/public\/.*/, async (ctx) => {
    console.log(ctx.path);
    const publicPath = path.resolve("./public");
    const filePath = path.resolve(
      publicPath,
      ctx.path.trim().replace(/^\/public\//, "")
    );

    // ensure that the resulting path is in public:
    if (!filePath.startsWith(publicPath)) throw new Error("Invalid path");
    console.log("filePath", filePath);

    ctx.body = await fs.readFile(filePath, "utf8");
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
