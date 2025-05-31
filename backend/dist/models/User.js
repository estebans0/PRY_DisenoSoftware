"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
// backend/src/models/user.model.ts
var mongoose_1 = require("mongoose");
var userSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    position: { type: String, required: true },
    organization: { type: String, required: true },
    currentPassword: { type: String, required: true },
}, {
    timestamps: true, // createdAt + updatedAt
});
exports.User = (0, mongoose_1.model)('User', userSchema);
