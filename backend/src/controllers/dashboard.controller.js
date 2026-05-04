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
        ...activities,
        communityDiscussion: summary.communityDiscussion,
      }
    });
  } catch (error) {
    console.error('[Dashboard Controller Error]:', error);
    return next(error);
  }
};

exports.getAlerts = async (req, res, next) => {
  try {
    const alerts = await DashboardService.getSystemAlerts();
    return res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error('[Dashboard Alerts Error]:', error);
    return next(error);
  }
};

exports.getAIInsights = async (req, res, next) => {
  try {
    const insights = await DashboardService.getAIInsights();
    return res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error('[Dashboard AI Insights Error]:', error);
    return next(error);
  }
};




