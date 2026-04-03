const AuthorService = require('../services/admin/author.service');

// GET /api/admin/authors
exports.getAll = async (req, res, next) => {
  try {
    const result = await AuthorService.getAll(req.query);
    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/admin/authors/:id
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await AuthorService.getById(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tác giả',
      });
    }

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/admin/authors
exports.create = async (req, res, next) => {
  try {
    const adminId = req.user?.id || null;
    const data = await AuthorService.create(req.body, adminId);
    return res.status(201).json({
      success: true,
      message: 'Đã tạo tác giả thành công',
      data
    });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/admin/authors/:id
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id || null;
    const data = await AuthorService.update(id, req.body, adminId);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tác giả',
      });
    }

    return res.json({
      success: true,
      message: 'Đã cập nhật tác giả thành công',
      data
    });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/admin/authors/:id
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id || null;
    const success = await AuthorService.delete(id, adminId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tác giả',
      });
    }

    return res.json({
      success: true,
      message: 'Đã xóa tác giả thành công',
    });
  } catch (error) {
    return next(error);
  }
};
