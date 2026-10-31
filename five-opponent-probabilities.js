import {createMultiwayLoader,readMultiwayRiverCounts,readMultiwayStreetCounts} from './multiway-probabilities.js?v=31';
export const createFiveOpponentLoader=fetcher=>createMultiwayLoader(5,fetcher);
export const readFiveRiverCounts=(buffer,index,ordinal)=>readMultiwayRiverCounts(buffer,index,ordinal,5);
export const readFiveStreetCounts=(buffer,key,street)=>readMultiwayStreetCounts(buffer,key,street,5);
export const loadFiveOpponentProbabilities=createFiveOpponentLoader();
