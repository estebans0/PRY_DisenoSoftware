import { RequestHandler } from 'express';
import { SettingsModel, Settings } from '../models/settings.model';

/**
 * GET /api/settings
 * Retrieve (or initialize) the single settings document.
 */
export const getSettings: RequestHandler = async (_, res, next) => {
  try {
    let settings = await SettingsModel.findOne().lean();
    if (!settings) {
      // create defaults if none exist
      settings = await new SettingsModel().save();
    }
    res.json(settings);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/settings
 * Update the singleton settings document.
 */
export const updateSettings: RequestHandler = async (req, res, next) => {
  try {
    const updates = req.body;
    const updated = await SettingsModel.findOneAndUpdate(
      {},
      updates,
      { new: true, upsert: true, runValidators: true }
    ).lean();
    res.json(updated);
  } catch (err) {
    next(err);
  }
};
