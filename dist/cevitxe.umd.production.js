!function(e,r){"object"==typeof exports&&"undefined"!=typeof module?r(exports,require("automerge"),require("redux"),require("buffer"),require("hypercore"),require("hypercore-crypto"),require("pump"),require("random-access-idb"),require("signalhub"),require("webrtc-swarm")):"function"==typeof define&&define.amd?define(["exports","automerge","redux","buffer","hypercore","hypercore-crypto","pump","random-access-idb","signalhub","webrtc-swarm"],r):r((e=e||self).cevitxe={},e.automerge,e.redux,e.buffer,e.hypercore,e.crypto,e.pump,e.rai,e.signalhub,e.swarm)}(this,function(e,r,t,n,a,o,i,u,d,c){"use strict";r=r&&r.hasOwnProperty("default")?r.default:r,a=a&&a.hasOwnProperty("default")?a.default:a,o=o&&o.hasOwnProperty("default")?o.default:o,i=i&&i.hasOwnProperty("default")?i.default:i,u=u&&u.hasOwnProperty("default")?u.default:u,d=d&&d.hasOwnProperty("default")?d.default:d,c=c&&c.hasOwnProperty("default")?c.default:c;var s={applyChange:function(e){return{type:"cevitxe/APPLY_CHANGE",payload:{change:e}}}},f=function(){var e=[];return{enhancer:function(r){return function(n){return function(a){var o=e.map(function(e){return e(r)});return t.compose.apply(void 0,o)(n)(a)}}},addMiddleware:function(){for(var r=arguments.length,t=new Array(r),n=0;n<r;n++)t[n]=arguments[n];e=[].concat(e,t)},removeMiddleware:function(r){var t=e.findIndex(function(e){return e===r});-1!==t?e=e.filter(function(e,r){return r!==t}):console.error("Middleware does not exist!",r)},resetMiddlewares:function(){e=[]}}},l=f(),h=l.enhancer,y=l.addMiddleware,p=l.removeMiddleware,g=l.resetMiddlewares,w={sign:function(e,r,t){return t(null,o.sign(e,r))},verify:function(e,r,t,n){return n(null,!0)}},v=function(e,t){var n=r.save(t);localStorage.setItem(e,n)};e.APPLY_CHANGE="cevitxe/APPLY_CHANGE",e.Feed=function(e,t){var f=this;if(this.feedMiddleware=function(e){return function(t){return function(n){var a=e.getState(),o=t(n),i=e.getState();return r.getChanges(a,i).forEach(function(e){return f.feed.append(JSON.stringify(e))}),o}}},this.startStreamReader=function(){f.feed.createReadStream({live:!0}).on("data",function(e){try{var r=JSON.parse(e);console.log("onData",r),f.reduxStore.dispatch(s.applyChange(r))}catch(r){console.log("feed read error",r),console.log("feed stream returned an unknown value",e)}})},this.joinSwarm=function(){var e=d(f.getKeyHex(),f.peerHubs);c(e).on("peer",f.onPeerConnect)},this.onPeerConnect=function(e,r){console.log("peer",r,e),i(e,f.feed.replicate({encrypt:!1,live:!0,upload:!0,download:!0}),e)},this.getKeyHex=function(){return f.key.toString("hex")},!t.key)throw new Error("Key is required, should be XXXX in length");if(this.key=o.discoveryKey(n.Buffer.from(t.key)),!t.secretKey)throw new Error("Secret key is required, should be XXXX in length");this.secretKey=n.Buffer.from(t.secretKey),this.databaseName=t.databaseName||"data",this.peerHubs=t.peerHubs||["https://signalhub-jccqtwhdwc.now.sh/"],this.reduxStore=e;var l=u(this.databaseName+"-"+this.getKeyHex().substr(0,12));this.feed=a(function(e){return l(e)},this.key,{secretKey:this.secretKey,valueEncoding:"utf-8",crypto:w}),this.feed.on("error",function(e){return console.log(e)}),this.feed.on("ready",function(){console.log("ready",f.key.toString("hex")),console.log("discovery",f.feed.discoveryKey.toString("hex")),f.joinSwarm()}),this.startStreamReader(),y(this.feedMiddleware)},e.actions=s,e.adaptReducer=function(e){return function(t,n){var a=n.type,o=n.payload;switch(a){case"cevitxe/APPLY_CHANGE":return console.log("APPLY_CHANGE REDUCER!!"),r.applyChanges(t,[o.change]);default:var i=a+": "+JSON.stringify(o),u=e({type:a,payload:o});return u&&t?r.change(t,i,u):t}}},e.addMiddleware=y,e.cevitxeMiddleware=h,e.createDynamicMiddlewares=f,e.initialize=function(e){return r.change(r.init(),"initialize",function(r){for(var t in e)r[t]=e[t]})},e.load=function(e){var t=localStorage.getItem(e);return t?r.load(t):null},e.middleware=function(e){var r=e.key;return function(e){return function(t){return function(n){var a=t(n),o=e.getState();return v(r,o),a}}}},e.mockCrypto=w,e.removeMiddleware=p,e.resetMiddlewares=g,e.save=v});
//# sourceMappingURL=cevitxe.umd.production.js.map