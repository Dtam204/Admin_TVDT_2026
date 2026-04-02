const PublicationService = require('../services/admin/publication.service');
const CollectionService = require('../services/admin/collection.service');

class AdminPublicationController {
  static async create(req, res) {
    try {
      console.log('--- Controller Create Publication Hit ---', JSON.stringify(req.body, null, 2));
      const { 
        publication, 
        copies,
      } = req.body;
      
      const result = await PublicationService.createPublicationWithCopies(publication, copies);
      res.status(201).json({ 
        success: true, 
        message: 'Publication created successfully',
        data: result 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getCollections(req, res) {
    try {
      const collections = await CollectionService.getAllCollections();
      res.json({ success: true, data: collections });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getDetail(req, res) {
    try {
      const { id } = req.params;
      const data = await PublicationService.getPublicationDetail(id);
      if (!data) return res.status(404).json({ success: false, message: "Not found" });
      res.json({ success: true, data: data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      console.log(`--- [DEBUG] Update Publication ${id} --- Payload:`, JSON.stringify(req.body, null, 2));
      const { publication, copies } = req.body;
      const result = await PublicationService.updatePublicationWithCopies(id, publication, copies);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error(`--- [DEBUG] Update Error ---`, error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const success = await PublicationService.deletePublication(id);
      if (!success) return res.status(404).json({ success: false, message: "Not found" });
      res.json({ success: true, message: "Deleted" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const { page, limit, status, search, collection_id, cooperation_status, media_type } = req.query;
      const result = await PublicationService.getAll({ page, limit, status, search, collection_id, cooperation_status, media_type });
      
      // Map thêm trường format ảo dựa trên media_type (hoặc logic cũ nếu media_type trống)
      const publicationsWithFormat = result.publications.map(row => {
        let format = row.media_type || 'Physical';
        
        // Logic fallback nếu media_type chưa sync kịp
        if (!row.media_type) {
          const hasDigital = !!row.is_digital;
          const hasPhysical = parseInt(row.total_copies || 0) > 0;
          if (hasDigital && hasPhysical) format = 'Hybrid';
          else if (hasDigital) format = 'Digital';
          else format = 'Physical';
        }

        return {
          ...row,
          format
        };
      });

      res.json({ 
        success: true, 
        data: publicationsWithFormat,
        pagination: result.pagination
      });
    } catch (error) {
      console.error("Controller GetAll Error:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getStats(req, res) {
    try {
      const stats = await PublicationService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = AdminPublicationController;
