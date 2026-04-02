const DashboardService = require('../services/admin/dashboard.service');

/**
 * Controller xử lý thống kê Dashboard "Chuẩn thật"
 */
exports.getSummary = async (req, res, next) => {
  try {
    const summary = await DashboardService.getSummary();
    const activities = await DashboardService.getRecentActivities();
    
    return res.json({
      success: true,
      data: {
        ...summary,
        ...activities
      }
    });
  } catch (error) {
    console.error('[Dashboard Controller Error]:', error);
    return next(error);
  }
};




