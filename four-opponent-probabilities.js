import {createMultiwayLoader,readMultiwayRiverCounts,readMultiwayStreetCounts} from './multiway-probabilities.js?v=26';
export const createFourOpponentLoader=fetcher=>createMultiwayLoader(4,fetcher);
export const readFourRiverCounts=(buffer,index,ordinal)=>readMultiwayRiverCounts(buffer,index,ordinal,4);
export const readFourStreetCounts=(buffer,key,street)=>readMultiwayStreetCounts(buffer,key,street,4);
export const loadFourOpponentProbabilities=createFourOpponentLoader();
