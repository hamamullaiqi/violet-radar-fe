import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

export const getTickersMaster = async () => {
    let tickers = [];
    try {
        const response = await api.get(`/api/market-data/idx/tickers`);
        tickers = response.data.data;
    } catch (error) {
        console.log(error);
    }
    return tickers;

};

export const useTickersMaster = () => {
    return useQuery({
        queryKey: ['tickers-master'],
        queryFn: () => getTickersMaster(),
    });
};