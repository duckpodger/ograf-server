"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RendererManager = void 0;
const lib_1 = require("../lib/lib");
class RendererManager {
    constructor() {
        this.rendererInstances = new Set();
        this.registeredRenderers = new Map();
    }
    addRenderer(jsonRpcConnection) {
        // const id = RendererInstance.ID()
        const rendererInstance = new RendererInstance(this, jsonRpcConnection);
        this.rendererInstances.add(rendererInstance);
        return rendererInstance;
    }
    closeRenderer(rendererInstance) {
        this.rendererInstances.delete(rendererInstance);
        if (rendererInstance.info)
            this.registeredRenderers.delete(rendererInstance.info.id);
    }
    registerRenderer(rendererInstance, id) {
        this.registeredRenderers.set(id, rendererInstance);
    }
    /** A ServerAPI Method */
    async listRenderers(ctx) {
        const renderers = [];
        for (const rendererInstance of this.rendererInstances) {
            if (rendererInstance.info)
                renderers.push(rendererInstance.info);
        }
        ctx.body = (0, lib_1.literal)({
            renderers,
        });
    }
    /** A ServerAPI Method */
    async getRendererManifest(ctx) {
        const params = ctx.params;
        const rendererInstance = this.registeredRenderers.get(params.rendererId);
        if (!rendererInstance) {
            ctx.status = 404;
            ctx.body = (0, lib_1.literal)({
                code: 404,
                message: `Renderer ${params.rendererId} not found`,
            });
            return;
        }
        // Just forward the request to the Renderer:
        const result = await rendererInstance.api.getManifest({});
        ctx.status = 200;
        ctx.body =
            (0, lib_1.literal)(result);
    }
    async getRendererStatus(ctx) {
        const params = ctx.params;
        const rendererInstance = this.registeredRenderers.get(params.rendererId);
        if (!rendererInstance) {
            ctx.status = 404;
            ctx.body = (0, lib_1.literal)({
                code: 404,
                message: `Renderer ${params.rendererId} not found`,
            });
            return;
        }
        const status = {
        // TBD
        };
        ctx.status = 200;
        ctx.body = (0, lib_1.literal)({ status });
    }
    async getRenderTargetStatus(ctx) {
        const params = ctx.params;
        const rendererInstance = this.registeredRenderers.get(params.rendererId);
        if (!rendererInstance) {
            ctx.status = 404;
            ctx.body = (0, lib_1.literal)({
                code: 404,
                message: `Renderer ${params.rendererId} not found`,
            });
            return;
        }
        // Just forward the request to the Renderer:
        const result = await rendererInstance.api.getTargetStatus({
            renderTargetId: params.renderTargetId,
        });
        ctx.status = 200;
        ctx.body =
            (0, lib_1.literal)(result);
    }
    async invokeRendererAction(ctx) {
        const params = ctx.params;
        const reqBody = ctx.request
            .body;
        const rendererInstance = this.registeredRenderers.get(params.rendererId);
        if (!rendererInstance) {
            ctx.status = 404;
            ctx.body = (0, lib_1.literal)({
                code: 404,
                message: `Renderer ${params.rendererId} not found`,
            });
            return;
        }
        // Just forward the request to the Renderer:
        const result = await rendererInstance.api.invokeRendererAction(reqBody);
        ctx.status = 200;
        ctx.body =
            (0, lib_1.literal)(result);
    }
    async loadGraphic(ctx) {
        const params = ctx.params;
        const reqBody = ctx.request
            .body;
        console.log("ctx", ctx);
        if (!reqBody.graphic)
            throw new Error("No body.graphic provided");
        const rendererInstance = this.registeredRenderers.get(params.rendererId);
        if (!rendererInstance) {
            ctx.status = 404;
            ctx.body = (0, lib_1.literal)({
                code: 404,
                message: `Renderer ${params.rendererId} not found`,
            });
            return;
        }
        // Just forward the request to the Renderer:
        const result = await rendererInstance.api.loadGraphic({
            renderTargetId: params.renderTargetId,
            ...reqBody,
        });
        ctx.status = 200;
        ctx.body =
            (0, lib_1.literal)(result);
    }
    async clearGraphic(ctx) {
        console.log("clearGraphic", ctx);
        const params = ctx.params;
        const reqBody = ctx.request
            .body;
        const rendererInstance = this.registeredRenderers.get(params.rendererId);
        if (!rendererInstance) {
            ctx.status = 404;
            ctx.body = (0, lib_1.literal)({
                code: 404,
                message: `Renderer ${params.rendererId} not found`,
            });
            return;
        }
        // Just forward the request to the Renderer:
        const result = await rendererInstance.api.clearGraphic(reqBody);
        ctx.status = 200;
        ctx.body =
            (0, lib_1.literal)(result);
    }
    async invokeGraphicUpdateAction(ctx) {
        const params = ctx.params;
        const reqBody = ctx.request
            .body;
        const rendererInstance = this.registeredRenderers.get(params.rendererId);
        if (!rendererInstance) {
            ctx.status = 404;
            ctx.body = (0, lib_1.literal)({
                code: 404,
                message: `Renderer ${params.rendererId} not found`,
            });
            return;
        }
        // Just forward the request to the Renderer:
        const result = await rendererInstance.api.invokeGraphicUpdateAction({
            renderTargetId: params.renderTargetId,
            ...reqBody,
        });
        ctx.status = 200;
        ctx.body =
            (0, lib_1.literal)(result);
    }
    async invokeGraphicPlayAction(ctx) {
        const params = ctx.params;
        const reqBody = ctx.request
            .body;
        const rendererInstance = this.registeredRenderers.get(params.rendererId);
        if (!rendererInstance) {
            ctx.status = 404;
            ctx.body = (0, lib_1.literal)({
                code: 404,
                message: `Renderer ${params.rendererId} not found`,
            });
            return;
        }
        // Just forward the request to the Renderer:
        const result = await rendererInstance.api.invokeGraphicPlayAction({
            renderTargetId: params.renderTargetId,
            ...reqBody,
        });
        ctx.status = 200;
        ctx.body =
            (0, lib_1.literal)(result);
    }
    async invokeGraphicStopAction(ctx) {
        const params = ctx.params;
        const reqBody = ctx.request
            .body;
        const rendererInstance = this.registeredRenderers.get(params.rendererId);
        if (!rendererInstance) {
            ctx.status = 404;
            ctx.body = (0, lib_1.literal)({
                code: 404,
                message: `Renderer ${params.rendererId} not found`,
            });
            return;
        }
        // Just forward the request to the Renderer:
        const result = await rendererInstance.api.invokeGraphicStopAction({
            renderTargetId: params.renderTargetId,
            ...reqBody,
        });
        ctx.status = 200;
        ctx.body =
            (0, lib_1.literal)(result);
    }
    async invokeGraphicCustomAction(ctx) {
        const params = ctx.params;
        const reqBody = ctx.request
            .body;
        const rendererInstance = this.registeredRenderers.get(params.rendererId);
        if (!rendererInstance) {
            ctx.status = 404;
            ctx.body = (0, lib_1.literal)({
                code: 404,
                message: `Renderer ${params.rendererId} not found`,
            });
            return;
        }
        // Just forward the request to the Renderer:
        const result = await rendererInstance.api.invokeGraphicCustomAction({
            renderTargetId: params.renderTargetId,
            ...reqBody,
        });
        ctx.status = 200;
        ctx.body =
            (0, lib_1.literal)(result);
    }
}
exports.RendererManager = RendererManager;
class RendererInstance {
    constructor(manager, jsonRpcConnection) {
        this.manager = manager;
        this.jsonRpcConnection = jsonRpcConnection;
        // static ID(): string {
        //     return `renderer-${RendererInstance._ID++}`
        // }
        this.isRegistered = false;
        this._status = {};
        this._manifest = null;
        /** Methods that can be called on the Renderer */
        this.api = {
            getManifest: (payload) => this.jsonRpcConnection.request("getManifest", payload),
            // listGraphicInstances: (payload) => this.jsonRpcConnection.request('listGraphicInstances', payload),
            getStatus: (payload) => this.jsonRpcConnection.request("getStatus", payload),
            getTargetStatus: (payload) => this.jsonRpcConnection.request("getTargetStatus", payload),
            invokeRendererAction: (payload) => this.jsonRpcConnection.request("invokeRendererAction", payload),
            loadGraphic: (payload) => this.jsonRpcConnection.request("loadGraphic", payload),
            clearGraphic: (payload) => this.jsonRpcConnection.request("clearGraphic", payload),
            invokeGraphicUpdateAction: (payload) => this.jsonRpcConnection.request("invokeGraphicUpdateAction", payload),
            invokeGraphicPlayAction: (payload) => this.jsonRpcConnection.request("invokeGraphicPlayAction", payload),
            invokeGraphicStopAction: (payload) => this.jsonRpcConnection.request("invokeGraphicStopAction", payload),
            invokeGraphicCustomAction: (payload) => this.jsonRpcConnection.request("invokeGraphicCustomAction", payload),
        };
        this.register = async (payload) => {
            var _a, _b;
            // JSONRPC METHOD, called by the Renderer
            this.isRegistered = true;
            const id = payload.info.id !== undefined
                ? `renderer:${payload.info.id}`
                : `renderer-${RendererInstance.RandomIndex++}`;
            this.info = {
                id,
                name: (_a = payload.info.name) !== null && _a !== void 0 ? _a : id,
                description: (_b = payload.info.description) !== null && _b !== void 0 ? _b : "",
            };
            this.manager.registerRenderer(this, this.info.id);
            console.log(`Renderer "${id}" registered`);
            setTimeout(() => {
                // Ask the renderer for its manifest and initial status
                this.updateManifest().catch(console.error);
                this.updateStatus().catch(console.error);
            }, 10);
            return {
                rendererId: this.info.id,
            };
        };
        this.unregister = async () => {
            // JSONRPC METHOD, called by the Renderer
            this.isRegistered = false;
            this.manager.closeRenderer(this);
            return {};
        };
        this.status = async (payload) => {
            // JSONRPC METHOD, called by the Renderer
            if (!this.isRegistered)
                throw new Error("Renderer is not registered");
            this._status = payload.status;
            return {};
        };
        this.debug = async (payload) => {
            // JSONRPC METHOD, called by the Renderer
            if (!this.isRegistered)
                throw new Error("Renderer is not registered");
            console.log("DEBUG Renderer", payload.message);
            return {};
        };
    }
    async updateManifest() {
        const result = await this.api.getManifest({});
        this._manifest = result.rendererManifest;
    }
    async updateStatus() {
        const result = await this.api.getStatus({});
        this._status = result.rendererStatus;
    }
}
RendererInstance.RandomIndex = 0;
