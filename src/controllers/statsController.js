import Product from "../models/Product.js";
import Order from "../models/Order.js";

/**
 * Public platform stats endpoint for the Hero Banner dashboard widget.
 * Returns aggregated metrics from Products and Orders collections.
 * GET /api/v1/stats
 */
export const getPlatformStats = async (req, res) => {
  try {
    // --- Product aggregations ---
    const totalListings = await Product.countDocuments();
    const totalStockUnits = await Product.aggregate([
      { $group: { _id: null, total: { $sum: "$availableQuantity" } } },
    ]);

    // Top categories by number of listings (up to 4 for production lines widget)
    const categoryBreakdown = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 }, stock: { $sum: "$availableQuantity" } } },
      { $sort: { count: -1 } },
      { $limit: 4 },
    ]);

    // --- Order aggregations ---
    const totalOrders = await Order.countDocuments();
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // GM revenue (sum of all approved order prices)
    const revenueAgg = await Order.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, total: { $sum: "$orderPrice" } } },
    ]);

    // Build a status map for easy lookup
    const statusMap = {};
    for (const s of ordersByStatus) {
      statusMap[s._id] = s.count;
    }

    const approvedOrders = statusMap["approved"] || 0;
    const pendingOrders = statusMap["pending"] || 0;

    // Approval rate: approved / (approved + rejected) * 100
    const rejectedOrders = statusMap["rejected"] || 0;
    const decided = approvedOrders + rejectedOrders;
    const approvalRate = decided > 0 ? Math.round((approvedOrders / decided) * 100) : 100;

    res.json({
      totalListings,
      totalStockUnits: totalStockUnits[0]?.total || 0,
      totalOrders,
      approvedOrders,
      pendingOrders,
      approvalRate,          // % of decided orders that were approved
      totalRevenue: revenueAgg[0]?.total || 0,
      categoryBreakdown,     // [{ _id: "category", count, stock }]
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Failed to fetch platform stats" });
  }
};
