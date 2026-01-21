const axios = require("axios");
 
const AUTH_KEY = process.env.MSG91_AUTH_KEY;
const SENDER_ID = process.env.MSG91_SENDER_ID || "LabBox";
const ROUTE = process.env.MSG91_ROUTE || "4";
const COUNTRY_CODE = process.env.MSG91_COUNTRY_CODE || "91";

const sendSms = async (otp, mobile) => {
  try { 
    const phone = `${COUNTRY_CODE}${mobile}`;

    const payload = {
      authkey: AUTH_KEY,
      template_id: process.env.MSG91_TEMPLATE_ID || "", // optional
      message: otp,
      mobile: phone,
      sender: SENDER_ID,
      route: ROUTE,
      country: COUNTRY_CODE
    };

    const response = await axios.post("https://api.msg91.com/api/v5/otp/", payload, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    console.log("SMS sent:", response.data);
    return response.data;

  } catch (error) {
    console.error("SMS sending failed:", error.response?.data || error.message);
    return { error: error.message };
  }
};

module.exports = sendSms;
