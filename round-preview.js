// A visible five-second decision window, independent of card animation speed.
export function createRoundPreview({onChange=()=>{},onRelease=()=>{},schedule=setTimeout,cancel=clearTimeout,seconds=5}){
 let active=false,waiting=false,paused=false,remaining=seconds,timer=null,generation=0,clock=0;
 function clear(){clock++;if(timer!==null)cancel(timer);timer=null;}
 function valid(id){return active&&id===generation;}
 function tick(id){if(!valid(id)||paused||waiting||timer!==null)return;const ticket=++clock;timer=schedule(()=>{if(ticket!==clock||!valid(id)||paused)return;timer=null;remaining--;if(remaining===0){api.proceed();return;}onChange();tick(id);},1000);}
 const api={get active(){return active;},get waiting(){return waiting;},get remaining(){return remaining;},
  reset(){clear();generation++;active=false;waiting=false;remaining=seconds;},
  start(prepare){api.reset();active=true;waiting=true;const id=generation;onChange();let ready;try{ready=prepare();}catch{ready=undefined;}const prepared=()=>{if(!valid(id))return;waiting=false;onChange();tick(id);};if(ready&&typeof ready.then==='function')Promise.resolve(ready).then(prepared,prepared);else prepared();},
  proceed(){if(!active||paused)return;api.reset();onChange();onRelease();},
  pause(){paused=true;clear();},
  resume(){paused=false;if(active){onChange();tick(generation);}}
 };return api;
}
