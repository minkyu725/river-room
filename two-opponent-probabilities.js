import {createMultiwayLoader,readMultiwayRiverCounts,readMultiwayStreetCounts} from './multiway-probabilities.js?v=31';
export const createTwoOpponentLoader=fetcher=>createMultiwayLoader(2,fetcher);
export const readTwoRiverCounts=(buffer,index,ordinal)=>readMultiwayRiverCounts(buffer,index,ordinal,2);
export const readTwoStreetCounts=(buffer,key,street)=>readMultiwayStreetCounts(buffer,key,street,2);
export const loadTwoOpponentProbabilities=createTwoOpponentLoader();
