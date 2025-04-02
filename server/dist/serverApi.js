"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupServerApi = setupServerApi;
const lib_1 = require("./lib/lib");
const multer_1 = __importDefault(require("@koa/multer"));
const upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
    // destination: './localGraphicsStorage',
    }),
});
function setupServerApi(router, graphicsStore, rendererManager) {
    // Make strong types for the path:
    const serverApiRouter = {
        get: (path, ...middleware) => router.get(path, ...middleware),
        post: (path, ...middleware) => router.post(path, ...middleware),
        put: (path, ...middleware) => router.put(path, ...middleware),
        delete: (path, ...middleware) => router.delete(path, ...middleware),
    };
    // ----- Graphics related endpoints ------------------------------
    serverApiRouter.get(`/serverApi/internal/graphics/list`, handleError(async (ctx) => graphicsStore.listGraphics(ctx)));
    serverApiRouter.delete(`/serverApi/internal/graphics/graphic/:graphicId/:graphicVersion`, handleError(async (ctx) => graphicsStore.deleteGraphic(ctx)));
    serverApiRouter.get(`/serverApi/internal/graphics/graphic/:graphicId/:graphicVersion/manifest`, handleError(async (ctx) => graphicsStore.getGraphicManifest(ctx)));
    // serverApiRouter.get(
    //   `/serverApi/internal/graphics/graphic/:graphicId/:graphicVersion/graphic`,
    //   handleError(async (ctx) => graphicsStore.getGraphicModule(ctx))
    // );
    serverApiRouter.get(`/serverApi/internal/graphics/graphic/:graphicId/:graphicVersion/:localPath*`, handleError(async (ctx) => graphicsStore.getGraphicResource(ctx)));
    serverApiRouter.post(`/serverApi/internal/graphics/graphic`, upload.single("graphic"), handleError(async (ctx) => graphicsStore.uploadGraphic(ctx)));
    // serverApiRouter.get(
    //   `/serverApi/internal/graphics/graphic`,
    //   handleError(async (ctx) => graphicsStore.uploadGraphic(ctx))
    // );
    // ----- Renderer related endpoints --------------------------------
    serverApiRouter.get("/serverApi/internal/renderers/list", handleError(async (ctx) => rendererManager.listRenderers(ctx)));
    serverApiRouter.get("/serverApi/internal/renderers/renderer/:rendererId/manifest", handleError(async (ctx) => rendererManager.getRendererManifest(ctx)));
    serverApiRouter.get("/serverApi/internal/renderers/renderer/:rendererId/status", handleError(async (ctx) => rendererManager.getRendererStatus(ctx)));
    serverApiRouter.get("/serverApi/internal/renderers/renderer/:rendererId/target/:renderTargetId/status", handleError(async (ctx) => rendererManager.getRenderTargetStatus(ctx)));
    serverApiRouter.post("/serverApi/internal/renderers/renderer/:rendererId/invokeAction", handleError(async (ctx) => rendererManager.invokeRendererAction(ctx)));
    serverApiRouter.post("/serverApi/internal/renderers/renderer/:rendererId/target/:renderTargetId/load", handleError(async (ctx) => rendererManager.loadGraphic(ctx)));
    serverApiRouter.post("/serverApi/internal/renderers/renderer/:rendererId/clear", handleError(async (ctx) => rendererManager.clearGraphic(ctx)));
    serverApiRouter.post("/serverApi/internal/renderers/renderer/:rendererId/target/:renderTargetId/updateAction", handleError(async (ctx) => rendererManager.invokeGraphicUpdateAction(ctx)));
    serverApiRouter.post("/serverApi/internal/renderers/renderer/:rendererId/target/:renderTargetId/playAction", handleError(async (ctx) => rendererManager.invokeGraphicPlayAction(ctx)));
    serverApiRouter.post("/serverApi/internal/renderers/renderer/:rendererId/target/:renderTargetId/stopAction", handleError(async (ctx) => rendererManager.invokeGraphicStopAction(ctx)));
    serverApiRouter.post("/serverApi/internal/renderers/renderer/:rendererId/target/:renderTargetId/customAction", handleError(async (ctx) => rendererManager.invokeGraphicCustomAction(ctx)));
}
function handleError(fcn) {
    return async (ctx) => {
        try {
            await fcn(ctx);
        }
        catch (err) {
            console.error(err);
            // Handle internal errors:
            ctx.status = 500;
            const body = (0, lib_1.literal)({
                code: 500,
                message: `Internal Error: ${err}`,
            });
            ctx.body = body;
            if (err && typeof err === "object" && err instanceof Error && err.stack) {
                // Note: This is a security risk, as it exposes the stack trace to the client (don't do this in production)
                body.data = { stack: err.stack };
            }
        }
    };
}
