"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphicsStore = void 0;
const fs_1 = __importDefault(require("fs"));
const mime_types_1 = __importDefault(require("mime-types"));
const path_1 = __importDefault(require("path"));
const lib_1 = require("../lib/lib");
const decompress_1 = __importDefault(require("decompress"));
class GraphicsStore {
    constructor() {
        /** File path where to store Graphics */
        this.FILE_PATH = path_1.default.resolve("./localGraphicsStorage");
        /** How long to wait befor removing Graphics, in ms */
        this.REMOVAL_WAIT_TIME = 1000 * 3600 * 24; // 24 hours
        // Ensure the directory exists
        fs_1.default.mkdirSync(this.FILE_PATH, { recursive: true });
        setInterval(() => {
            this.removeExpiredGraphics().catch(console.error);
        }, 1000 * 3600 * 24); // Check every 24 hours
        // Also do a check now:
        this.removeExpiredGraphics().catch(console.error);
    }
    async listGraphics(ctx) {
        const folderList = await fs_1.default.promises.readdir(this.FILE_PATH);
        const graphics = [];
        for (const folder of folderList) {
            const { id, version } = this.fromFileName(folder);
            // Don't list Graphics that are marked for removal:
            if (await this.isGraphicMarkedForRemoval(id, version))
                continue;
            const manifest = JSON.parse(await fs_1.default.promises.readFile(path_1.default.join(this.FILE_PATH, folder, "manifest.json"), "utf8"));
            // Ensure the id and version match:
            if (id !== manifest.id || version !== `${manifest.version}`) {
                console.error(`Folder name ${folder} does not match manifest id ${manifest.id} or version ${manifest.version}`);
                continue;
            }
            graphics.push({
                id: manifest.id,
                version: manifest.version,
                name: manifest.name,
                description: manifest.description,
                author: manifest.author,
                draft: manifest.draft,
            });
        }
        ctx.body = (0, lib_1.literal)({
            graphics,
        });
    }
    async getGraphicManifest(ctx) {
        const params = ctx.params;
        const id = params.graphicId;
        const version = params.graphicVersion;
        const manifestPath = path_1.default.join(this.FILE_PATH, this.toFileName(id, version), "manifest.json");
        // Don't return manifest if the Graphic is marked for removal:
        if ((await this.fileExists(manifestPath)) &&
            !(await this.isGraphicMarkedForRemoval(id, version))) {
            const graphicManifest = JSON.parse(await fs_1.default.promises.readFile(manifestPath, "utf8"));
            // TODO
            // graphicManifest.totalSize =
            // graphicManifest.fileCount =
            if (graphicManifest) {
                ctx.status = 200;
                if (this.isImmutable(version)) {
                    ctx.header["Cache-Control"] = "public, max-age=31536000, immutable";
                }
                else {
                    // Never cache:
                    ctx.header["Cache-Control"] = "no-store";
                }
                ctx.body = (0, lib_1.literal)({ graphicManifest });
                return;
            }
        }
        // else:
        ctx.status = 404;
        ctx.body = (0, lib_1.literal)({
            code: 404,
            message: `Graphic ${params.graphicId}-${params.graphicVersion} not found`,
        });
        return;
    }
    async getGraphicModule(ctx) {
        const params = ctx.params;
        const id = params.graphicId;
        const version = params.graphicVersion;
        // Don't return graphic if the Graphic is marked for removal:
        if (await this.isGraphicMarkedForRemoval(id, version)) {
            ctx.status = 404;
            ctx.body = (0, lib_1.literal)({
                code: 404,
                message: "File not found",
            });
            return;
        }
        await this.serveFile(ctx, path_1.default.join(this.FILE_PATH, this.toFileName(id, version), "graphic.mjs"), this.isImmutable(version));
    }
    async getGraphicResource(ctx) {
        console.log("getGraphicResource");
        const params = ctx.params;
        const id = params.graphicId;
        const version = params.graphicVersion;
        const localPath = params.localPath;
        console.log("url aaaa", path_1.default.join(this.FILE_PATH, this.toFileName(id, version), "resources", localPath));
        // Note: We DO serve resources even if the Graphic is marked for removal!
        await this.serveFile(ctx, path_1.default.join(this.FILE_PATH, this.toFileName(id, version), "resources", localPath), this.isImmutable(version));
    }
    async deleteGraphic(ctx) {
        const params = ctx.params;
        const reqBody = ctx.request
            .body;
        if (reqBody.force) {
            await this.actuallyDeleteGraphic(params.graphicId, params.graphicVersion);
        }
        else {
            await this.markGraphicForRemoval(params.graphicId, params.graphicVersion);
        }
    }
    async uploadGraphic(ctx) {
        // ctx.status = 501
        // ctx.body = literal<ServerAPI.ErrorReturnValue>({code: 501, message: 'Not implemented yet'})
        // Expect a zipped file that contains the Graphic
        const file = ctx.request.file;
        // console.log('file', ctx.request.file)
        // console.log('files', ctx.request.files)
        // console.log('body', ctx.request.body)
        console.log("Uploaded file", file.originalname, file.size);
        if (file.mimetype !== "application/x-zip-compressed") {
            ctx.status = 400;
            ctx.body = (0, lib_1.literal)({
                code: 400,
                message: "Expected a zip file",
            });
            return;
        }
        const tempZipPath = file.path;
        const decompressPath = path_1.default.resolve("tmpGraphic");
        const cleanup = async () => {
            try {
                await fs_1.default.promises.rm(decompressPath, { recursive: true });
            }
            catch (err) {
                if (err.code !== "ENOENT")
                    throw err;
            }
        };
        try {
            await cleanup();
            const files = await (0, decompress_1.default)(tempZipPath, decompressPath);
            const manifest = files.find((f) => f.path.endsWith("manifest.json"));
            if (!manifest)
                throw new Error("No manifest.json found in zip file");
            const graphicModule = files.find((f) => f.path.endsWith("graphic.mjs"));
            if (!graphicModule)
                throw new Error("No graphic.mjs found in zip file");
            let basePath = "";
            if (graphicModule.path.includes("/graphic.mjs")) {
                // basepath/graphic.mjs
                basePath = graphicModule.path.slice(0, -"/graphic.mjs".length);
            }
            const manifestData = JSON.parse(manifest.data.toString("utf8"));
            const id = manifestData.id;
            const version = `${manifestData.version}`;
            const folderPath = path_1.default.join(this.FILE_PATH, this.toFileName(id, `${version}`));
            // Check if the Graphic already exists
            let alreadyExists = false;
            if (await this.fileExists(folderPath)) {
                alreadyExists = true;
                if (await this.isGraphicMarkedForRemoval(id, version)) {
                    // If a pre-existing graphic is marked for removal, we can overwrite it.
                    await this.actuallyDeleteGraphic(id, version);
                    alreadyExists = false;
                }
                else if (version === "0") {
                    // If the version is 0, it is considered mutable, so we can overwrite it.
                    await this.actuallyDeleteGraphic(id, version);
                    alreadyExists = false;
                }
            }
            if (alreadyExists) {
                await cleanup();
                ctx.status = 409; // conflict
                ctx.body = (0, lib_1.literal)({
                    code: 409,
                    message: "Graphic already exists",
                });
                return;
            }
            // Copy the files to the right folder:
            await fs_1.default.promises.mkdir(folderPath, { recursive: true });
            // Then, copy files:
            for (const innerFile of files) {
                if (innerFile.type !== "file")
                    continue;
                const filePath = innerFile.path.slice(basePath.length); // Remove the base path
                const outputFilePath = path_1.default.join(folderPath, filePath);
                const outputFolderPath = path_1.default.dirname(outputFilePath);
                // ensure dir:
                try {
                    await fs_1.default.promises.mkdir(outputFolderPath, {
                        recursive: true,
                    });
                }
                catch (err) {
                    if (!`${err}`.includes("EEXIST"))
                        throw err; // Ignore "already exists" errors
                }
                // Copy data:
                await fs_1.default.promises.writeFile(outputFilePath, innerFile.data);
            }
            ctx.status = 200;
            ctx.body = (0, lib_1.literal)({});
        }
        finally {
            // clean up after ourselves:
            await cleanup();
        }
    }
    async fileExists(filePath) {
        try {
            await fs_1.default.promises.access(filePath);
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    toFileName(id, version) {
        return `${id}-${version}`;
    }
    fromFileName(filename) {
        const m = filename.match(/(.+)-([^-]+)/);
        if (!m)
            throw new Error(`Invalid filename ${filename}`);
        return { id: m[1], version: m[2] };
    }
    isImmutable(version) {
        // If the version is 0, the graphic is considered mutable
        // ie, it is a non-production version, in development
        // Otherwise it is considered immutable.
        return `${version}` !== "0";
    }
    async getFileInfo(filePath) {
        if (!(await this.fileExists(filePath))) {
            return { found: false };
        }
        let mimeType = mime_types_1.default.lookup(filePath);
        if (!mimeType) {
            // Fallback to "unknown binary":
            mimeType = "application/octet-stream";
        }
        const stat = await fs_1.default.promises.stat(filePath);
        return {
            found: true,
            mimeType,
            length: stat.size,
            lastModified: stat.mtime,
        };
    }
    async serveFile(ctx, fullPath, immutable) {
        const info = await this.getFileInfo(fullPath);
        if (!info.found) {
            ctx.status = 404;
            ctx.body = (0, lib_1.literal)({
                code: 404,
                message: "File not found",
            });
            return;
        }
        ctx.type = info.mimeType;
        ctx.length = info.length;
        ctx.lastModified = info.lastModified;
        if (immutable) {
            ctx.header["Cache-Control"] = "public, max-age=31536000, immutable";
        }
        else {
            // Never cache:
            ctx.header["Cache-Control"] = "no-store";
        }
        const readStream = fs_1.default.createReadStream(fullPath);
        ctx.body = readStream;
    }
    async actuallyDeleteGraphic(id, version) {
        const folderPath = path_1.default.join(this.FILE_PATH, this.toFileName(id, version));
        if (await this.fileExists(folderPath)) {
            await fs_1.default.promises.rm(folderPath, { recursive: true });
        }
    }
    async markGraphicForRemoval(id, version) {
        // Mark the Graphic for removal, but keep it for a while.
        // The reason for this is to not delete a Graphic that is currently on-air
        // (which might break due to missing resources)
        const folderPath = path_1.default.join(this.FILE_PATH, this.toFileName(id, version));
        const removalFilePath = path_1.default.join(folderPath, "__markedForRemoval");
        if (await this.fileExists(folderPath)) {
            fs_1.default.promises.writeFile(removalFilePath, `${Date.now() + this.REMOVAL_WAIT_TIME}`, "utf-8");
        }
    }
    /** Find any graphics that are due to be removed */
    async removeExpiredGraphics() {
        const folderList = await fs_1.default.promises.readdir(this.FILE_PATH);
        for (const folder of folderList) {
            const { id, version } = this.fromFileName(folder);
            if (!(await this.isGraphicMarkedForRemoval(id, version)))
                continue;
            const removalFilePath = path_1.default.join(this.FILE_PATH, folder, "__markedForRemoval");
            const removalTimeStr = await fs_1.default.promises.readFile(removalFilePath, "utf-8");
            const removalTime = parseInt(removalTimeStr);
            if (Number.isNaN(removalTime)) {
                continue;
            }
            if (Date.now() > removalTime) {
                // Time to remove the Graphic
                await this.actuallyDeleteGraphic(id, version);
            }
        }
    }
    /** Returns true if a graphic exists (and is not marked for removal) */
    async isGraphicMarkedForRemoval(id, version) {
        const removalFilePath = path_1.default.join(this.FILE_PATH, this.toFileName(id, version), "__markedForRemoval");
        return await this.fileExists(removalFilePath);
    }
}
exports.GraphicsStore = GraphicsStore;
