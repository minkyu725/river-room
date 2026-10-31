import {createMultiwayLoader,readMultiwayRiverCounts,readMultiwayStreetCounts} from './multiway-probabilities.js?v=32';
export const createSixOpponentLoader=fetcher=>createMultiwayLoader(6,fetcher);
export const readSixRiverCounts=(buffer,index,ordinal)=>readMultiwayRiverCounts(buffer,index,ordinal,6);
export const readSixStreetCounts=(buffer,key,street)=>readMultiwayStreetCounts(buffer,key,street,6);
export const loadSixOpponentProbabilities=createSixOpponentLoader();
