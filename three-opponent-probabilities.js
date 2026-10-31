import {createMultiwayLoader,readMultiwayRiverCounts,readMultiwayStreetCounts} from './multiway-probabilities.js?v=26';
export const createThreeOpponentLoader=fetcher=>createMultiwayLoader(3,fetcher);
export const readThreeRiverCounts=(buffer,index,ordinal)=>readMultiwayRiverCounts(buffer,index,ordinal,3);
export const readThreeStreetCounts=(buffer,key,street)=>readMultiwayStreetCounts(buffer,key,street,3);
export const loadThreeOpponentProbabilities=createThreeOpponentLoader();
