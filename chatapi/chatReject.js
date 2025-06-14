
require('dotenv').config();
const axios = require('axios');
async function chat_reject(data) {

    console.log("chat_reject data:", data);
    try {
     
        const response = await axios.post(`${process.env.API_URL}/chat/chat_reject_data`, data);
        return response.data;
    } catch (error) {
  
        throw error.response ? error.response.data : error;
    }
}

module.exports = chat_reject;