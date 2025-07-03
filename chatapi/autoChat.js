
require('dotenv').config();
const axios = require('axios');
const url = require('./api');



async function autoChat(data) {
  const URL = url;
    try {
const response = await axios.post(`${URL}/chat/auto/completed`, data);
return response.data;
    } catch (error) {
    throw error.response ? error.response.data : error;
    }
}
module.exports = autoChat;
