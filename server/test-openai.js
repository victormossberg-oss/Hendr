const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 0
});

async function test() {
  try {
    const response = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: "Det här är ett enkelt test."
    });

    console.log("OPENAI TEST OK:");
    console.log(response);
  } catch (error) {
    console.error("OPENAI TEST ERROR:");
    console.error({
      status: error.status,
      message: error.message,
      code: error.code,
      type: error.type,
      requestID: error.requestID,
      headers: Object.fromEntries(error.headers || [])
    });
  }
}

test();