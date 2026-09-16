import prisma from '../../lib/prisma.js';

export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId,
      },
      include: {
        product: true,
        variant: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const subtotal = cartItems.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0
    );

    const totalItems = cartItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    res.status(200).json({
      success: true,
      data: {
        items: cartItems,
        totalItems,
        subtotal,
      },
    });
  } catch (error) {
    console.error("Get cart error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
    });
  }
};


export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      productId,
      variantId,
      quantity = 1,
    } = req.body;

    if (!productId || !variantId) {
      return res.status(400).json({
        success: false,
        message: "productId and variantId are required",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    // Check product
    const product = await prisma.product.findUnique({
      where: {
        id: Number(productId),
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check variant
    const variant = await prisma.productVariant.findUnique({
      where: {
        id: Number(variantId),
      },
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found",
      });
    }

    // Make sure variant belongs to product
    if (variant.productId !== Number(productId)) {
      return res.status(400).json({
        success: false,
        message: "Variant does not belong to this product",
      });
    }

    /*
      Replace this with the actual price field
      from your ProductVariant model.
    */
    const price = Number(variant.price);

    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        userId_variantId: {
          userId,
          variantId: Number(variantId),
        },
      },
    });

    let cartItem;

    if (existingCartItem) {
      const newQuantity =
        existingCartItem.quantity + Number(quantity);

      cartItem = await prisma.cartItem.update({
        where: {
          id: existingCartItem.id,
        },
        data: {
          quantity: newQuantity,
          totalPrice: price * newQuantity,
        },
        include: {
          product: true,
          variant: true,
        },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          userId,
          productId: Number(productId),
          variantId: Number(variantId),
          quantity: Number(quantity),
          totalPrice: price * Number(quantity),
        },
        include: {
          product: true,
          variant: true,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: "Product added to cart",
      data: cartItem,
    });
  } catch (error) {
    console.error("Add to cart error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add product to cart",
    });
  }
};


export const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const variantId = Number(req.params.variantId);
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: {
        userId_variantId: {
          userId,
          variantId,
        },
      },
      include: {
        variant: true,
      },
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    const price = Number(cartItem.variant.price);

    const updatedItem = await prisma.cartItem.update({
      where: {
        id: cartItem.id,
      },
      data: {
        quantity: Number(quantity),
        totalPrice: price * Number(quantity),
      },
      include: {
        product: true,
        variant: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Cart quantity updated",
      data: updatedItem,
    });
  } catch (error) {
    console.error("Update cart error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update cart",
    });
  }
};


export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const variantId = Number(req.params.variantId);

    const cartItem = await prisma.cartItem.findUnique({
      where: {
        userId_variantId: {
          userId,
          variantId,
        },
      },
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    await prisma.cartItem.delete({
      where: {
        id: cartItem.id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
    });
  } catch (error) {
    console.error("Remove cart item error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to remove cart item",
    });
  }
};


export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.cartItem.deleteMany({
      where: {
        userId,
      },
    });

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.error("Clear cart error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
    });
  }
};