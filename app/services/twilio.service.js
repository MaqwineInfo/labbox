const twilio = require("twilio");

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

const sendOTP = async (to, otp) => {
  try {
    const message = `Your OTP is: ${otp}`;

    await client.messages.create({
      body: message,
      from: fromNumber,
      to: to,
    });

    console.log("OTP sent successfully via Twilio");
    return true;

  } catch (error) {
    console.error("Twilio Error:", error.message);
    return false;
  }
};

module.exports = sendOTP;
