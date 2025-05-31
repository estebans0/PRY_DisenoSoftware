"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
var mongoose_1 = require("mongoose");
var SessionSchema = new mongoose_1.Schema({
    number: { type: String, required: true },
    date: { type: Date, required: true },
    time: String,
    modality: String,
    location: String,
    attendees: [{ memberId: String, status: String }],
    agenda: [{ title: String, presenter: String, duration: Number }],
}, { timestamps: true });
exports.Session = (0, mongoose_1.model)('Session', SessionSchema);
