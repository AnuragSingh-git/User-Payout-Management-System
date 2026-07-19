import Sale from "../models/Sale.js";

export const createSale = async (req, res) => {
  try {
    const {
      userId,
      brand,
      earning
    } = req.body;

    const sale = await Sale.create({
      userId,
      brand,
      earning,
      status: "pending"
    });

    res.status(201).json({
      message: "Sale created",
      sale
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const getMySales = async (req, res) => {
  try {
    const sales = await Sale.find({
      userId: req.user.id
    }).sort({
      createdAt: -1
    });

    res.json({
      sales
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const getPendingSales = async (
  req,
  res
) => {
  try {
    const sales = await Sale.find({
      status: "pending"
    })
      .populate(
        "userId",
        "name email"
      )
      .sort({
        createdAt: -1
      });

    res.json({
      sales
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};