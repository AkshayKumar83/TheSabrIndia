import prisma from "../../lib/prisma.js"
export const createAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      phoneNo,
      addressLine1,
      addressLine2,
      addressType,
      city,
      pincode,
      state,
      country = "India",
      isDefault = false,
    } = req.body;

    if (
      !name ||
      !phoneNo ||
      !addressLine1 ||
      !addressType ||
      !city ||
      !pincode ||
      !state
    ) {
      return res.status(400).json({
        success: false,
        message: "Required address fields are missing",
      });
    }

    // If this address should be default,
    // remove default from existing address
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        name,
        phoneNo,
        addressLine1,
        addressLine2,
        addressType,
        city,
        pincode: Number(pincode),
        state,
        country,
        isDefault,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Address created successfully",
      data: address,
    });
  } catch (error) {
    console.error("Create address error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create address",
    });
  }
};

export const getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;

    const addresses = await prisma.address.findMany({
      where: {
        userId,
      },
      orderBy: [
        {
          isDefault: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error("Get addresses error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get addresses",
    });
  }
};

export const getAddressById = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = Number(req.params.id);

    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: address,
    });
  } catch (error) {
    console.error("Get address error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get address",
    });
  }
};

// ==========================================
// UPDATE ADDRESS
// ==========================================
export const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = Number(req.params.id);

    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const {
      name,
      phoneNo,
      addressLine1,
      addressLine2,
      addressType,
      city,
      pincode,
      state,
      country,
      isDefault,
    } = req.body;

    // If changing this address to default,
    // unset current default
    if (isDefault === true) {
      await prisma.address.updateMany({
        where: {
          userId,
          isDefault: true,
          id: {
            not: addressId,
          },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const address = await prisma.address.update({
      where: {
        id: addressId,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(phoneNo !== undefined && { phoneNo }),
        ...(addressLine1 !== undefined && { addressLine1 }),
        ...(addressLine2 !== undefined && { addressLine2 }),
        ...(addressType !== undefined && { addressType }),
        ...(city !== undefined && { city }),
        ...(pincode !== undefined && {
          pincode: Number(pincode),
        }),
        ...(state !== undefined && { state }),
        ...(country !== undefined && { country }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: address,
    });
  } catch (error) {
    console.error("Update address error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update address",
    });
  }
};

// ==========================================
// MAKE ADDRESS DEFAULT
// ==========================================
export const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = Number(req.params.id);

    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Remove default from all user's addresses
    await prisma.address.updateMany({
      where: {
        userId,
        isDefault: true,
        id: {
          not: addressId,
        },
      },
      data: {
        isDefault: false,
      },
    });

    // Set selected address as default
    const updatedAddress = await prisma.address.update({
      where: {
        id: addressId,
      },
      data: {
        isDefault: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Default address updated successfully",
      data: updatedAddress,
    });
  } catch (error) {
    console.error("Set default address error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to set default address",
    });
  }
};

// ==========================================
// DELETE ADDRESS
// ==========================================
export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = Number(req.params.id);

    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    await prisma.address.delete({
      where: {
        id: addressId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Delete address error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete address",
    });
  }
};
