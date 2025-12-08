import Tracking from "../models/Tracking.js";

/**
 * Get tracking updates for an order
 */
export const getTrackingByOrder = async (req, res) => {
  try {
    const trackings = await Tracking.find({ orderId: req.params.orderId }).sort(
      { createdAt: 1 }
    );
    res.json(trackings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Add a tracking update
 */
export const addTrackingUpdate = async (req, res) => {
  try {
    const tracking = new Tracking(req.body);
    const savedTracking = await tracking.save();
    res.status(201).json(savedTracking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
