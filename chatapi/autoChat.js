
import axios from 'axios';
import {url} from './api.js';



async function autoChat(data) {
  const URL = url;
    try {
const response = await axios.post(`${URL}/chat/auto/completed`, data);
return response.data;
    } catch (error) {
    throw error.response ? error.response.data : error;
    }
}


export {autoChat};
