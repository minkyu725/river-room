// Large stages use an immutable commit in this same public repository.
// Populated only after the dataset commit has been independently verified.
export const externalTableRevisions={6:'484429223d26de7bf168207d0880123476ae49cb',5:'5a28a4ba726dfeb4d598cbf7be3e94b405d57e21'};
export function tablePath(opponents,path){const revision=externalTableRevisions[opponents];if(!revision)return './data/'+path;if(!/^[a-f0-9]{40}$/.test(revision))throw Error('Invalid static data revision');return `https://raw.githubusercontent.com/minkyu725/river-room/${revision}/data/${path}`;}
