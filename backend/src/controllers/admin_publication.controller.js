const PublicationService = require('../services/admin/publication.service');
const CollectionService = require('../services/admin/collection.service');
const StorageLocationService = require('../services/admin/storage_location.service');

// Helper để tạo response chuẩn 7 trường
const sendResponse = (res, status, message, data = null, errors = null, pagination = null) => {
  const response = {
    code: status === 200 || status === 201 ? 0 : status,
    success: status >= 200 && status < 300,
    message: message,
    data: data,
    errorId: null,
    appId: null,
    errors: errors
  };

  if (pagination) response.pagination = pagination;
  return res.status(status).json(response);
};

class AdminPublicationController {
  static async create(req, res) {
    try {
      const { publication, copies } = req.body;
      const adminId = req.user?.id || null;
      const createdPublication = await PublicationService.createPublicationWithCopies(publication, copies, adminId);
      return sendResponse(res, 201, 'Publication created successfully', {
        id: createdPublication?.id,
        publication: createdPublication,
        copies: createdPublication?.copies || []
      });
    } catch (error) {
      return sendResponse(res, 500, error.message);
    }
  }

  static async getCollections(req, res) {
    try {
      const collections = await CollectionService.getAllCollections();
      return sendResponse(res, 200, 'Lấy danh mục thành công', collections);
    } catch (error) {
      return sendResponse(res, 500, error.message);
    }
  }

  static async getStorageLocations(req, res) {
    try {
      const locations = await StorageLocationService.getAll();
      return sendResponse(res, 200, 'Lấy danh sách kho thành công', locations);
    } catch (error) {
      return sendResponse(res, 500, error.message);
    }
  }

  static async getDetail(req, res) {
    try {
      const { id } = req.params;
      const data = await PublicationService.getPublicationDetail(id);
      if (!data) return sendResponse(res, 404, "Không tìm thấy ấn phẩm");
      return sendResponse(res, 200, 'Lấy chi tiết ấn phẩm thành công', data);
    } catch (error) {
      return sendResponse(res, 500, error.message);
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { publication, copies } = req.body;
      const adminId = req.user?.id || null;

      const updatedPublication = await PublicationService.updatePublicationWithCopies(id, publication, copies, adminId);
      return sendResponse(res, 200, 'Cập nhật ấn phẩm thành công', {
        success: true,
        id: updatedPublication?.id || Number(id),
        publication: updatedPublication,
        copies: updatedPublication?.copies || []
      });
    } catch (error) {
      return sendResponse(res, 500, error.message);
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user?.id || null;
      const success = await PublicationService.deletePublication(id, adminId);
      if (!success) return sendResponse(res, 404, "Không tìm thấy ấn phẩm");
      return sendResponse(res, 200, "Xóa ấn phẩm thành công");
    } catch (error) {
      return sendResponse(res, 500, error.message);
    }
  }

  static async getAll(req, res) {
    try {
      const { page, limit, status, search, collection_id, cooperation_status, media_type } = req.query;
      const result = await PublicationService.getAll({ page, limit, status, search, collection_id, cooperation_status, media_type });
      
      const publicationsWithFormat = result.publications.map(row => {
        let format = row.media_type || 'Physical';
        if (!row.media_type) {
          const hasDigital = !!row.is_digital;
          const hasPhysical = parseInt(row.total_copies || 0) > 0;
          if (hasDigital && hasPhysical) format = 'Hybrid';
          else if (hasDigital) format = 'Digital';
          else format = 'Physical';
        }
        return { ...row, format };
      });

      return sendResponse(res, 200, 'Lấy danh sách ấn phẩm thành công', publicationsWithFormat, null, result.pagination);
    } catch (error) {
      return sendResponse(res, 500, error.message);
    }
  }

  static async getAllNoPagination(req, res) {
    try {
      const result = await PublicationService.getAllSelect();
      return sendResponse(res, 200, 'Lấy toàn bộ danh sách ấn phẩm thành công', result);
    } catch (error) {
      return sendResponse(res, 500, error.message);
    }
  }

  static async getStats(req, res) {
    try {
      const stats = await PublicationService.getStats();
      return sendResponse(res, 200, 'Lấy thống kê thành công', stats);
    } catch (error) {
      return sendResponse(res, 500, error.message);
    }
  }
}

module.exports = AdminPublicationController;

