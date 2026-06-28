import axios from 'axios';
import database from '../data/db.json';

const API_URL = 'http://localhost:3001';
const LOCAL_CREATED_KEY = 'localCreatedRecords';

const getLocalCollection = (collection) => database[collection] || [];

const normalizeId = (id) => Number(id);

const getLocalCreatedRecords = (collection) => {
    if (typeof localStorage === 'undefined') return [];

    try {
        const records = JSON.parse(localStorage.getItem(LOCAL_CREATED_KEY)) || {};
        return records[collection] || [];
    } catch (error) {
        return [];
    }
};

const saveLocalCreatedRecord = (collection, payload) => {
    if (typeof localStorage === 'undefined') return payload;

    const records = JSON.parse(localStorage.getItem(LOCAL_CREATED_KEY)) || {};
    const currentCollection = records[collection] || [];
    const nextRecord = {
        id: payload.id || Date.now(),
        ...payload,
    };

    records[collection] = [...currentCollection, nextRecord];
    localStorage.setItem(LOCAL_CREATED_KEY, JSON.stringify(records));
    return nextRecord;
};

export async function getCollection(collection, params = {}) {
    try {
        const res = await axios.get(`${API_URL}/${collection}`, { params });
        return res.data;
    } catch (error) {
        let data = [...getLocalCollection(collection), ...getLocalCreatedRecords(collection)];

        if (params.categoryId) {
            data = data.filter(item => item.categoryId === normalizeId(params.categoryId));
        }

        if (params.userId) {
            data = data.filter(item => item.userId === normalizeId(params.userId));
        }

        if (params.username) {
            data = data.filter(item => item.username === params.username);
        }

        if (params.email) {
            data = data.filter(item => item.email === params.email);
        }

        if (params.password) {
            data = data.filter(item => item.password === params.password);
        }

        if (params.name_like) {
            const keyword = params.name_like.toLowerCase();
            data = data.filter(item => item.name?.toLowerCase().includes(keyword));
        }

        if (params._sort) {
            const sortKey = params._sort;
            const order = params._order === 'desc' ? -1 : 1;
            data = [...data].sort((a, b) => {
                if (a[sortKey] < b[sortKey]) return -1 * order;
                if (a[sortKey] > b[sortKey]) return 1 * order;
                return 0;
            });
        }

        return data;
    }
}

export async function getItem(collection, id) {
    try {
        const res = await axios.get(`${API_URL}/${collection}/${id}`);
        return res.data;
    } catch (error) {
        return getLocalCollection(collection).find(item => item.id === normalizeId(id)) || null;
    }
}

export async function createItem(collection, payload) {
    try {
        const res = await axios.post(`${API_URL}/${collection}`, payload);
        return res.data;
    } catch (error) {
        return saveLocalCreatedRecord(collection, payload);
    }
}

export async function deleteItem(collection, id) {
    await axios.delete(`${API_URL}/${collection}/${id}`);
}
