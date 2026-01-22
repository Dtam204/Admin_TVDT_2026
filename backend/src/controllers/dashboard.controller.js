exports.getSummary = (req, res) => {
  res.json({
    totalUsers: 1280,
    activeUsers: 934,
    newOrdersToday: 37,
    revenueToday: 12500000,
  });
};




