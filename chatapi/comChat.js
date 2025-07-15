
import axios from 'axios';
import {url} from './api.js';


async function comChat(data) {
  const URL = url;
    try {

const response = await axios.post(`${URL}/chat/completed`, data);


return response.data;
    } catch (error) {
  
        throw error.response ? error.response.data : error;
    }
}

export {comChat};