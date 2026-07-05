export const uploadFiles = (req, res) => {
  const files = (req.files || []).map((f) => ({
    filename: f.filename,
    originalName: f.originalname,
    size: f.size,
    mimetype: f.mimetype,
    url: `/uploads/${f.filename}`,
  }));
  res.status(201).json({ success: true, results: files.length, data: files });
};
