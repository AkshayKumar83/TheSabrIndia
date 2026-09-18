import prisma from "../../lib/prisma.js";

const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.floor(
    Math.random() * 1000
  )}`;
};

export const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const email = req.user?.email;

    const { items, paymentMethod, shippingAddress } = req.body;

    if (!items?.length) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        message: "Shipping address is required",
      });
    }

    const variantIds = items.map((item) => Number(item.variantId));

    const variants = await prisma.productVariant.findMany({
      where: {
        id: {
          in: variantIds,
        },
      },

      include: {
        product: true,
      },
    });

    if (variants.length !== variantIds.length) {
      return res.status(400).json({
        message: "One or more products are unavailable",
      });
    }

    let subtotal = 0;

    const orderItems = items.map((item) => {
      const variant = variants.find((v) => v.id === Number(item.variantId));

      if (!variant) {
        throw new Error(`Variant ${item.variantId} not found`);
      }

      const quantity = Number(item.quantity);

      if (quantity <= 0) {
        throw new Error("Invalid quantity");
      }

      if (quantity > variant.inStock) {
        throw new Error(`${variant.name} does not have enough stock`);
      }

      const price = Number(variant.price);

      const totalPrice = price * quantity;

      subtotal += totalPrice;

      const primaryImage = variant.images?.find(
        (image) => Number(image.isPrimary) === 1,
      );

      return {
        productId: variant.productId,

        variantId: variant.id,

        productName: variant.product?.name || variant.name,

        variantName: variant.name,

        sku: variant.product?.skuNo || null,

        image: primaryImage?.image_url || null,

        price,
        quantity,
        totalPrice,
      };
    });

    const shippingCharge = subtotal >= 1000 ? 0 : 100;

    const discount = 0;

    const totalAmount = subtotal + shippingCharge - discount;

    const orderNumber = generateOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          orderNumber,

          subtotal,
          shippingCharge,
          discount,
          totalAmount,

          currency: "INR",

          paymentMethod,
          paymentStatus: "PENDING",
          orderStatus: "PENDING",

          shippingName: shippingAddress.name,

          shippingPhone: shippingAddress.phoneNo,

          shippingEmail: email,

          shippingAddressLine1: shippingAddress.addressLine1,
          shippingAddressLine2: shippingAddress.addressLine2,

          shippingCity: shippingAddress.city,

          shippingState: shippingAddress.state,

          shippingPincode: `${shippingAddress.pincode}`,

          shippingCountry: shippingAddress.country || "India",

          items: {
            create: orderItems,
          },
        },

        include: {
          items: true,
        },
      });

      return createdOrder;
    });

    // ONLINE PAYMENT
    // if (paymentMethod === "ONLINE") {
    //   const razorpayOrder = await createRazorpayOrder({
    //     amount: totalAmount,
    //     receipt: orderNumber,

    //     notes: {
    //       orderId: order.id,
    //     },
    //   });

    //   await prisma.payment.create({
    //     data: {
    //       orderId: order.id,

    //       provider: "RAZORPAY",

    //       providerOrderId: razorpayOrder.id,

    //       amount: totalAmount,

    //       currency: "INR",

    //       status: "PENDING",
    //     },
    //   });

    //   return res.status(201).json({
    //     message: "Order created",

    //     orderId: order.id,

    //     orderNumber,

    //     payment: {
    //       provider: "RAZORPAY",

    //       orderId: razorpayOrder.id,

    //       amount: razorpayOrder.amount,

    //       currency: razorpayOrder.currency,
    //     },
    //   });
    // }

    // COD
    await prisma.order.update({
      where: {
        id: order.id,
      },

      data: {
        paymentStatus: "PENDING",
        orderStatus: "CONFIRMED",
      },
    });

     await prisma.cartItem.deleteMany({
      where: {
        userId,
      },
    });

    return res.status(201).json({
      message: "Order created",

      orderId: order.id,

      orderNumber,

      payment: null,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      message: error.message || "Unable to create order",
    });
  }
};

export const verifyOrderPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: req.user.id,
      },

      include: {
        payment: true,
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (!order.payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    if (order.payment.providerOrderId !== razorpay_order_id) {
      return res.status(400).json({
        message: "Invalid Razorpay order",
      });
    }

    const valid = verifyRazorpayPayment({
      orderId: order.payment.providerOrderId,

      paymentId: razorpay_payment_id,

      signature: razorpay_signature,
    });

    if (!valid) {
      await prisma.payment.update({
        where: {
          id: order.payment.id,
        },

        data: {
          status: "FAILED",

          failureReason: "Invalid payment signature",
        },
      });

      return res.status(400).json({
        message: "Payment verification failed",
      });
    }

    await prisma.$transaction([
      prisma.payment.update({
        where: {
          id: order.payment.id,
        },

        data: {
          providerPaymentId: razorpay_payment_id,

          signature: razorpay_signature,

          status: "PAID",
        },
      }),

      prisma.order.update({
        where: {
          id: order.id,
        },

        data: {
          paymentStatus: "PAID",
          orderStatus: "CONFIRMED",
        },
      }),
    ]);

    // Shiprocket
    try {
      const shipment = await createShiprocketOrder({
        order: {
          ...order,
          paymentStatus: "PAID",
          orderStatus: "CONFIRMED",
        },

        items: order.items,
      });

      await prisma.shipment.create({
        data: {
          orderId: order.id,

          provider: "SHIPROCKET",

          shiprocketOrderId: String(shipment.order_id || ""),

          shipmentId: shipment.shipment_id
            ? String(shipment.shipment_id)
            : null,

          status: "CREATED",
        },
      });
    } catch (shippingError) {
      console.error("Shiprocket error:", shippingError);

      // Payment remains PAID.
      // Shipping can be retried separately.
    }

    return res.status(200).json({
      message: "Payment verified successfully",

      orderId: order.id,

      orderNumber: order.orderNumber,

      paymentStatus: "PAID",

      orderStatus: "CONFIRMED",
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    return res.status(500).json({
      message: "Unable to verify payment",
    });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: req.user.id,
      },

      include: {
        items: true,
        payment: true,
        shipment: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      orders: orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      message: "Unable to fetch orders",
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const orderNumber = req.params.orderNo
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        orderNumber:orderNumber,
        userId: req.user.id,
      },

      include: {
        items: true,
        payment: true,
        shipment: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.status(200).json({
      order: order,
    });
  } catch (error) {
    console.error("Get order error:", error);
    return res.status(500).json({
      message: "Unable to fetch order",
    });
  }
};

export const updateOrderStatus = async (orderId, status) => {
  const validStatuses = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "RETURNED",
  ];

  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid order status: ${status}`);
  }

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  return prisma.order.update({
    where: {
      id: orderId,
    },

    data: {
      orderStatus: status,
    },
  });
};

const updateShipmentStatus = async (shipmentId, status) => {
  const validStatuses = [
    "PENDING",
    "CREATED",
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "ERROR",
  ];

  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid shipment status: ${status}`);
  }

  const shipment = await prisma.shipment.findUnique({
    where: {
      id: shipmentId,
    },
  });

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  return prisma.shipment.update({
    where: {
      id: shipmentId,
    },

    data: {
      status,
    },
  });
};

const updateShipmentStatusHelper = async (shipmentId, status) => {
  if (!SHIPMENT_STATUSES.includes(status)) {
    throw new Error(`Invalid shipment status: ${status}`);
  }

  return prisma.shipment.update({
    where: {
      id: shipmentId,
    },

    data: {
      status,
    },
  });
};

export const updateShipmentAndOrderStatus = async ({
  shipmentId,
  shipmentStatus,
  orderStatus,
}) => {
  if (!SHIPMENT_STATUSES.includes(shipmentStatus)) {
    throw new Error(`Invalid shipment status: ${shipmentStatus}`);
  }

  if (!ORDER_STATUSES.includes(orderStatus)) {
    throw new Error(`Invalid order status: ${orderStatus}`);
  }

  const shipment = await prisma.shipment.findUnique({
    where: {
      id: shipmentId,
    },
  });

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  return prisma.$transaction([
    prisma.shipment.update({
      where: {
        id: shipmentId,
      },

      data: {
        status: shipmentStatus,
      },
    }),

    prisma.order.update({
      where: {
        id: shipment.orderId,
      },

      data: {
        orderStatus,
      },
    }),
  ]);
};

// await updateOrderStatus(
//   order.id,
//   "SHIPPED"
// );

// await updateShipmentStatus(
//   shipment.id,
//   "IN_TRANSIT"
// );

// await updateShipmentAndOrderStatus({
//   shipmentId: shipment.id,
//   shipmentStatus: "IN_TRANSIT",
//   orderStatus: "SHIPPED",
// });

// await updateShipmentAndOrderStatus({
//   shipmentId: shipment.id,
//   shipmentStatus: "DELIVERED",
//   orderStatus: "DELIVERED",
// });

// await updateShipmentAndOrderStatus({
//   shipmentId: shipment.id,
//   shipmentStatus: "PICKED_UP",
//   orderStatus: "PROCESSING",
// });


export const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        payment: true,
        shipment: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return res.status(200).json({
      orders: orders,
    });
  } catch (error) {
    console.error("Get All orders error:", error);
    return res.status(500).json({
      message: "Unable to fetch orders",
    });
  }
};