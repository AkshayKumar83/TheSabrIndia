import axios from "axios";

const BASE_URL = "https://apiv2.shiprocket.in/v1/external";

let cachedToken = null;
let tokenExpiry = null;

const getShiprocketToken = async () => {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const response = await axios.post(`${BASE_URL}/auth/login`, {
    email: process.env.SHIPROCKET_EMAIL,
    password: process.env.SHIPROCKET_PASSWORD,
  });

  cachedToken = response.data.token;

  tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;

  return cachedToken;
};

const shiprocketRequest = async ({ method, url, data }) => {
  const token = await getShiprocketToken();

  return axios({
    method,
    url: `${BASE_URL}${url}`,
    data,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const createShiprocketOrder = async ({ order, items }) => {
  const payload = {
    order_id: order.orderNumber,

    order_date: new Date(order.createdAt)
      .toISOString()
      .slice(0, 19)
      .replace("T", " "),

    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION,

    billing_customer_name: order.shippingName,

    billing_last_name: "",

    billing_address: order.shippingAddress,

    billing_city: order.shippingCity,

    billing_pincode: order.shippingPincode,

    billing_state: order.shippingState,

    billing_country: order.shippingCountry,

    billing_email: order.shippingEmail,

    billing_phone: order.shippingPhone,

    shipping_is_billing: true,

    shipping_customer_name: order.shippingName,

    shipping_address: order.shippingAddress,

    shipping_city: order.shippingCity,

    shipping_pincode: order.shippingPincode,

    shipping_state: order.shippingState,

    shipping_country: order.shippingCountry,

    shipping_email: order.shippingEmail,

    shipping_phone: order.shippingPhone,

    order_items: items.map((item) => ({
      name: item.productName,
      sku: item.sku || `VARIANT-${item.variantId}`,
      units: item.quantity,
      selling_price: Number(item.price),
      discount: 0,
      tax: 0,
    })),

    payment_method: order.paymentMethod === "COD" ? "COD" : "Prepaid",

    sub_total: Number(order.subtotal),

    length: Number(process.env.PACKAGE_LENGTH || 20),

    breadth: Number(process.env.PACKAGE_BREADTH || 15),

    height: Number(process.env.PACKAGE_HEIGHT || 10),

    weight: Number(process.env.PACKAGE_WEIGHT || 0.5),
  };

  const response = await shiprocketRequest({
    method: "POST",
    url: "/orders/create/adhoc",
    data: payload,
  });

  return response.data;
};
