import APIFeatures from '../utils/apiFeatures.js';
import { logActivity } from '../middleware/audit.js';

export const getAll = (Model, { searchFields = [], populate = [] } = {}) =>
  async (req, res, next) => {
    try {
      const features = new APIFeatures(Model.find(), req.query, searchFields)
        .filter()
        .search()
        .sort()
        .limitFields()
        .paginate();
      let query = features.query;
      populate.forEach((p) => (query = query.populate(p)));

      const countFeatures = new APIFeatures(Model.find(), req.query, searchFields).filter().search();
      const [docs, total] = await Promise.all([query, countFeatures.query.countDocuments()]);

      res.json({
        success: true,
        results: docs.length,
        total,
        page: features.page,
        pages: Math.ceil(total / features.limit),
        data: docs,
      });
    } catch (err) {
      next(err);
    }
  };

export const getOne = (Model, { populate = [] } = {}) =>
  async (req, res, next) => {
    try {
      let query = Model.findById(req.params.id);
      populate.forEach((p) => (query = query.populate(p)));
      const doc = await query;
      if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: doc });
    } catch (err) {
      next(err);
    }
  };

export const createOne = (Model, entityName) =>
  async (req, res, next) => {
    try {
      if (req.user) req.body.createdBy = req.user._id;
      const doc = await Model.create(req.body);
      logActivity(req.user?._id, 'create', entityName, doc._id, `Created ${entityName}`, req.ip);
      res.status(201).json({ success: true, data: doc });
    } catch (err) {
      next(err);
    }
  };

export const updateOne = (Model, entityName) =>
  async (req, res, next) => {
    try {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
      logActivity(req.user?._id, 'update', entityName, doc._id, `Updated ${entityName}`, req.ip);
      res.json({ success: true, data: doc });
    } catch (err) {
      next(err);
    }
  };

export const deleteOne = (Model, entityName) =>
  async (req, res, next) => {
    try {
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
      logActivity(req.user?._id, 'delete', entityName, doc._id, `Deleted ${entityName}`, req.ip);
      res.json({ success: true, data: null });
    } catch (err) {
      next(err);
    }
  };
