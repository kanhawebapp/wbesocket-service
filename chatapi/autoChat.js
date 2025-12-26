
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


async function changeAutoChatStatus(data) {
  const URL = url;
    try {
const response = await axios.post(`${URL}/chat/change-request-status-astro-free`, data);
return response.data;
    } catch (error) {
    throw error.response ? error.response.data : error;
    }
}


export {autoChat,changeAutoChatStatus};
