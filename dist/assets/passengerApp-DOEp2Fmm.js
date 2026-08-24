import{L as d,d as P,a as C,g as E,h as k,i as T,D as N,s as S,R as F,j as z,e as h,c as M,b as B,m as R}from"./setupScreen-D2_zzUs_.js";class O{constructor(e,n={}){this.containerId=e,this.options=n,this.map=null,this.routeCoordinates=[],this.routeLayers=[],this.trafficLayers=[],this.vehicleMarker=null,this.originMarker=null,this.destinationMarker=null,this.vehicleAnimationFrame=null,this.isProgrammaticMove=!1,this.isOverview=!0}init(e,n=13){this.map=d.map(this.containerId,{center:e,zoom:n,zoomControl:!1,attributionControl:!1,zoomSnap:.25,maxZoom:20,dragging:!0,touchZoom:!0,scrollWheelZoom:!0}),d.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",{maxZoom:20,maxNativeZoom:18,subdomains:"abcd"}).addTo(this.map),["dragstart","zoomstart"].forEach(c=>{this.map.on(c,()=>{this.isProgrammaticMove||this.setOverviewState(!1)})});const a=document.getElementById("setup-page-container"),o=document.querySelector(".passenger-status-card"),r=document.getElementById("passenger-ride-card"),l=document.getElementById("passenger-recenter");return[a,o,r,l].forEach(P),window.setTimeout(()=>this.map.invalidateSize(),0),this}setOverviewState(e){var n,a;this.isOverview!==e&&(this.isOverview=e,(a=(n=this.options).onOverviewChange)==null||a.call(n,e))}drawRoute(e,n=[]){!Array.isArray(e)||e.length<2||(this.clearRoute(),this.routeCoordinates=e,this.routeLayers.push(d.polyline(e,{color:"#FFFFFF",weight:12,opacity:.95,lineCap:"round",lineJoin:"round",interactive:!1}).addTo(this.map),d.polyline(e,{color:C.accentBlue,weight:7,opacity:1,lineCap:"round",lineJoin:"round",interactive:!1}).addTo(this.map)),this.drawTrafficSections(n))}clearRoute(){[...this.routeLayers,...this.trafficLayers].forEach(e=>{var n;return(n=this.map)==null?void 0:n.removeLayer(e)}),this.routeLayers=[],this.trafficLayers=[]}drawTrafficSections(e=[]){e.forEach(n=>{const a=Number(n.startPointIndex),o=Number(n.endPointIndex);if(!Number.isInteger(a)||!Number.isInteger(o)||o<=a)return;const r=this.routeCoordinates.slice(Math.max(0,a),Math.min(this.routeCoordinates.length-1,o)+1);if(r.length<2)return;const l=d.polyline(r,{color:this.trafficColor(n),weight:8,opacity:1,lineCap:"round",lineJoin:"round",interactive:!0}).addTo(this.map),c=Math.max(0,Number(n.delayInSeconds)||0),g=c>=60?`${Math.round(c/60)} min de atraso`:"Trânsito lento";l.bindTooltip(g,{direction:"top",opacity:.95}),this.trafficLayers.push(l)})}trafficColor(e){const n=String(e.simpleCategory||"").toUpperCase(),a=Number(e.delayInSeconds)||0,o=Number(e.magnitudeOfDelay)||0;return n==="ROAD_CLOSURE"?"#7F1D1D":o>=3||a>=600?"#DC2626":o===2||a>=180?"#F97316":"#FACC15"}setOriginMarker(e){this.originMarker&&this.map.removeLayer(this.originMarker);const n=d.divIcon({className:"passenger-pin-wrapper",html:'<span class="passenger-origin-pin"></span>',iconSize:[18,18],iconAnchor:[9,9]});this.originMarker=d.marker(e,{icon:n,interactive:!1}).addTo(this.map)}setDestinationMarker(e){this.destinationMarker&&this.map.removeLayer(this.destinationMarker);const n=d.divIcon({className:"passenger-pin-wrapper",html:`<span class="passenger-destination-pin">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </span>`,iconSize:[38,38],iconAnchor:[19,34]});this.destinationMarker=d.marker(e,{icon:n,interactive:!1}).addTo(this.map)}updateVehiclePosition(e,n=0,a=!0){if(!this.vehicleMarker){const o=d.divIcon({className:"passenger-vehicle-wrapper",html:`<div class="passenger-vehicle-marker">
          <div class="passenger-vehicle-heading">
            <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3 27 26l-11-4-11 4L16 3Z"/></svg>
          </div>
        </div>`,iconSize:[46,46],iconAnchor:[23,23]});this.vehicleMarker=d.marker(e,{icon:o,zIndexOffset:1e3,interactive:!1}).addTo(this.map),this.setVehicleBearing(n);return}if(this.setVehicleBearing(n),!a){this.vehicleMarker.setLatLng(e);return}this.animateVehicleTo(e)}setVehicleBearing(e){var a,o;const n=(o=(a=this.vehicleMarker)==null?void 0:a.getElement())==null?void 0:o.querySelector(".passenger-vehicle-heading");n&&(n.style.transform=`rotate(${Number.isFinite(e)?e:0}deg)`)}animateVehicleTo(e){this.vehicleAnimationFrame&&cancelAnimationFrame(this.vehicleAnimationFrame);const n=this.vehicleMarker.getLatLng(),a=d.latLng(e),o=performance.now(),r=850,l=c=>{const g=Math.min(1,(c-o)/r),m=1-Math.pow(1-g,3);this.vehicleMarker.setLatLng([n.lat+(a.lat-n.lat)*m,n.lng+(a.lng-n.lng)*m]),g<1&&(this.vehicleAnimationFrame=requestAnimationFrame(l))};this.vehicleAnimationFrame=requestAnimationFrame(l)}showRouteOverview(){this.routeCoordinates.length&&(this.isProgrammaticMove=!0,this.setOverviewState(!0),this.map.fitBounds(d.latLngBounds(this.routeCoordinates),{paddingTopLeft:[34,150],paddingBottomRight:[34,220],maxZoom:16,animate:!0,duration:.55}),window.setTimeout(()=>{this.isProgrammaticMove=!1},650))}}function x(t){return String(t||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}class V{constructor(e){this.container=document.getElementById(e),this.originName="Localização do veículo",this.destinationName="Destino",this.remainingDistance=null,this.remainingDuration=null,this.trafficDelay=0}setRouteInfo(e,n){this.originName=e||"Localização do veículo",this.destinationName=n||"Destino",this.render()}updateMetrics(e,n,a=0){this.remainingDistance=e,this.remainingDuration=n,this.trafficDelay=Math.max(0,a||0),this.render()}render(){if(!this.container)return;const e=Math.round(this.trafficDelay/60);this.container.innerHTML=`
      <div class="passenger-card-summary">
        <div class="passenger-eta-block">
          <strong>${E(this.remainingDuration)}</strong>
          <span>Chegada estimada</span>
        </div>
        <div class="passenger-metric">
          <strong>${k(this.remainingDuration)}</strong>
          <span>Tempo restante</span>
        </div>
        <div class="passenger-metric">
          <strong>${T(this.remainingDistance)}</strong>
          <span>Distância</span>
        </div>
      </div>

      <div class="passenger-route-row">
        <div class="passenger-route-line" aria-hidden="true"><i></i><span></span></div>
        <div class="passenger-route-names">
          <p><small>Origem</small><strong>${x(this.originName)}</strong></p>
          <p><small>Destino</small><strong>${x(this.destinationName)}</strong></p>
        </div>
        <div class="passenger-traffic-chip ${e>0?"delayed":""}">
          ${e>0?`+${e} min no trânsito`:"Trânsito normal"}
        </div>
      </div>
    `}}function G(t){if(!t)throw new Error("Elemento raiz da aplicação não encontrado.");t.className="passenger-app",t.dataset.roleRoot="passenger",t.innerHTML=`
    <div id="setup-page-container" class="setup-page-container hidden"></div>

    <main class="passenger-map-screen" aria-label="Acompanhamento da corrida">
      <div id="passenger-map"></div>

      <div class="passenger-ui-layer">
        <header class="passenger-status-card">
          <div class="passenger-status-icon" aria-hidden="true">
            <span></span>
          </div>
          <div class="passenger-status-copy">
            <span class="passenger-eyebrow">Corrida em andamento</span>
            <strong id="passenger-destination-name">Carregando destino…</strong>
          </div>
          <div class="passenger-live-badge"><i></i> Ao vivo</div>
        </header>

        <button type="button" class="passenger-new-route" id="passenger-new-route">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="15 18 9 12 15 6"/></svg>
          Nova rota
        </button>

        <section class="passenger-simulator" id="passenger-simulator" aria-label="Simulador do veículo" hidden>
          <div>
            <strong>Simulador</strong>
            <span id="passenger-simulator-status">GPS real</span>
          </div>
          <div class="passenger-simulator-actions">
            <button type="button" id="passenger-simulator-play">▶ Play</button>
            <button type="button" id="passenger-simulator-pause">Ⅱ Pausar</button>
            <button type="button" id="passenger-simulator-gps">Usar GPS</button>
          </div>
        </section>

        <div class="passenger-alert" id="passenger-alert" role="alert" hidden>
          <div>
            <strong>Não foi possível atualizar a corrida</strong>
            <span id="passenger-alert-text">Verifique sua conexão e tente novamente.</span>
          </div>
          <button type="button" id="passenger-alert-retry">Tentar novamente</button>
        </div>

        <button type="button" class="passenger-overview-button" id="passenger-recenter" title="Mostrar a rota completa" aria-hidden="true" disabled>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6.5 9 3l6 3.5L21 3v14.5L15 21l-6-3.5L3 21V6.5Z"/>
            <path d="M9 3v14.5M15 6.5V21"/>
          </svg>
          <span>Ver rota inteira</span>
        </button>

        <section class="passenger-ride-card" id="passenger-ride-card" aria-live="polite"></section>
      </div>
    </main>
  `}const i={destination:null,vehiclePosition:null,vehicleBearing:0,routeData:null,routeGeometryDistance:0,routeRemainingByIndex:[],watchId:null,offRouteReadings:0,isRecalculating:!1,lastRerouteAt:0},s={enabled:!1,playing:!1,timerId:null,position:null,coordinateIndex:0,speedKmH:48,tickMs:600};let u,f,v;async function q(){i.destination=S.loadActiveDestination()||N.destination;const t=[i.destination.lat,i.destination.lng];u=new O("passenger-map",{onOverviewChange:J}),u.init(t,13),f=new V("passenger-ride-card"),f.setRouteInfo("Localização atual do veículo",i.destination.name),A(),v=new F("setup-page-container",{profile:"passenger",onStartRoute:async e=>{i.destination=e.destination,S.saveActiveDestination(e.destination),f.setRouteInfo("Localização atual do veículo",e.destination.name),A(),await y(i.vehiclePosition||[e.origin.lat,e.origin.lng])}}),v.init(),v.setDestination(i.destination),K(),_(),L()}function A(){var e;const t=document.getElementById("passenger-destination-name");t&&(t.textContent=((e=i.destination)==null?void 0:e.name)||"Destino da corrida")}function L(){if(!("geolocation"in navigator)){p("Este navegador não possui suporte à localização.");return}navigator.geolocation.getCurrentPosition(async t=>{const e=[t.coords.latitude,t.coords.longitude];i.vehiclePosition=e,u.updateVehiclePosition(e,i.vehicleBearing,!1),await y(e),H()},t=>{console.warn("Não foi possível obter a localização inicial do veículo:",t),p("Permita o acesso à localização para acompanhar o veículo neste protótipo.")},{enableHighAccuracy:!0,timeout:12e3,maximumAge:15e3})}function H(){i.watchId!==null||!("geolocation"in navigator)||(i.watchId=navigator.geolocation.watchPosition(t=>{if(s.enabled)return;const e=[t.coords.latitude,t.coords.longitude],n=Number.isFinite(t.coords.speed)?t.coords.speed*3.6:0;D(e,t.coords.heading,n)},t=>{s.enabled||(console.warn("Falha ao atualizar localização do veículo:",t),p("O sinal de localização está temporariamente indisponível."))},{enableHighAccuracy:!0,timeout:15e3,maximumAge:3e3}))}function D(t,e=null,n=0){const a=i.vehiclePosition,o=a?M(a[0],a[1],t[0],t[1]):0;let r=i.vehicleBearing;Number.isFinite(e)&&n>=7?r=e:a&&o>=6&&n>=4&&(r=B(a[0],a[1],t[0],t[1])),i.vehiclePosition=t,i.vehicleBearing=r,u.updateVehiclePosition(t,r,!0),Z(t),U(t),w()}async function y(t,{keepViewport:e=!1}={}){if(!t||!i.destination||i.isRecalculating)return null;i.isRecalculating=!0;try{const n=[i.destination.lat,i.destination.lng],a=await z(t,n);if(!a||a.success===!1)return p((a==null?void 0:a.message)||"Não foi possível carregar a rota da corrida."),null;i.routeData=a,i.offRouteReadings=0,$(a.coordinates);const o=document.querySelector(".passenger-eyebrow");return o&&(o.textContent="Corrida em andamento"),u.drawRoute(a.coordinates,a.trafficSections),u.setOriginMarker(t),u.setDestinationMarker(n),u.updateVehiclePosition(t,i.vehicleBearing,!1),f.updateMetrics(a.distanceMeters,a.durationSeconds,a.trafficDelaySeconds),e||u.showRouteOverview(),w(),a}catch(n){return console.error("Falha ao carregar a corrida do passageiro:",n),p("Não foi possível atualizar a rota. Verifique sua conexão."),null}finally{i.isRecalculating=!1}}function $(t){const e=new Array(t.length).fill(0);let n=0;for(let a=t.length-2;a>=0;a--)n+=M(t[a][0],t[a][1],t[a+1][0],t[a+1][1]),e[a]=n;i.routeGeometryDistance=n,i.routeRemainingByIndex=e}function Z(t){var g;const e=i.routeData;if(!((g=e==null?void 0:e.coordinates)!=null&&g.length)||i.routeGeometryDistance<=0)return;const n=R(t,e.coordinates,80),a=i.routeRemainingByIndex[n.closestIndex]||0,o=Math.max(0,Math.min(1,a/i.routeGeometryDistance)),r=e.distanceMeters*o,l=e.durationSeconds*o,c=e.trafficDelaySeconds*o;if(f.updateMetrics(r,l,c),r<=35){const m=document.querySelector(".passenger-eyebrow");m&&(m.textContent="Veículo chegou ao destino")}}function U(t){if(s.enabled||i.isRecalculating||!i.routeData)return;const e=R(t,i.routeData.coordinates,80);i.offRouteReadings=e.isOffRoute?i.offRouteReadings+1:0;const n=Date.now()-i.lastRerouteAt>1e4;i.offRouteReadings>=3&&n&&(i.lastRerouteAt=Date.now(),i.offRouteReadings=0,y(t,{keepViewport:!u.isOverview}))}function J(t){const e=document.getElementById("passenger-recenter");if(!e)return;const n=!t;e.classList.toggle("visible",n),e.disabled=!n,e.setAttribute("aria-hidden",String(!n))}function p(t){const e=document.getElementById("passenger-alert"),n=document.getElementById("passenger-alert-text");n&&(n.textContent=t),e&&(e.hidden=!1)}function w(){const t=document.getElementById("passenger-alert");t&&(t.hidden=!0)}function K(){h(document.getElementById("passenger-new-route"),()=>{b(),v.setDestination(i.destination),v.show()}),h(document.getElementById("passenger-recenter"),()=>{u.showRouteOverview()}),h(document.getElementById("passenger-alert-retry"),()=>{w(),i.vehiclePosition?y(i.vehiclePosition):L()}),h(document.getElementById("passenger-simulator-play"),Q),h(document.getElementById("passenger-simulator-pause"),b),h(document.getElementById("passenger-simulator-gps"),X),window.addEventListener("offline",()=>p("Você perdeu a conexão com a internet.")),window.addEventListener("online",()=>{w(),i.vehiclePosition&&y(i.vehiclePosition,{keepViewport:!u.isOverview})})}function _(){const t=document.getElementById("passenger-simulator"),e=new URLSearchParams(window.location.search).get("simulator")==="1";t&&(t.hidden=!e),I("GPS real")}function j(){var n;const t=(n=i.routeData)==null?void 0:n.coordinates;if(!(t!=null&&t.length))return!1;if(s.enabled)return!0;s.enabled=!0;const e=R(i.vehiclePosition||t[0],t,1/0);return s.coordinateIndex=e.closestIndex,s.position=[...t[s.coordinateIndex]],i.vehiclePosition=[...s.position],u.updateVehiclePosition(s.position,i.vehicleBearing,!1),!0}function Q(){!j()||s.playing||(s.playing=!0,I("Em movimento"),s.timerId=window.setInterval(()=>{const t=W(s.speedKmH/3.6*(s.tickMs/1e3));if(!t){b();return}D(t.position,t.bearing,s.speedKmH)},s.tickMs))}function W(t){var r;const e=((r=i.routeData)==null?void 0:r.coordinates)||[];if(!s.position||s.coordinateIndex>=e.length-1)return null;let n=s.position,a=t,o=s.coordinateIndex;for(;o<e.length-1;){const l=e[o+1],c=M(n[0],n[1],l[0],l[1]);if(c>a&&c>0){const g=a/c,m=[n[0]+(l[0]-n[0])*g,n[1]+(l[1]-n[1])*g];return s.position=m,s.coordinateIndex=o,{position:m,bearing:B(n[0],n[1],l[0],l[1])}}a-=c,n=l,o++}return s.position=[...e[e.length-1]],s.coordinateIndex=e.length-1,{position:s.position,bearing:i.vehicleBearing}}function b(){s.timerId!==null&&window.clearInterval(s.timerId),s.timerId=null,s.playing=!1,I(s.enabled?"Pausado":"GPS real")}function X(){b(),s.enabled=!1,s.position=null,s.coordinateIndex=0,I("GPS real"),Y()}function Y(){var t;(t=navigator.geolocation)==null||t.getCurrentPosition(e=>D([e.coords.latitude,e.coords.longitude],e.coords.heading,Number.isFinite(e.coords.speed)?e.coords.speed*3.6:0),()=>p("Não foi possível voltar ao GPS agora."),{enableHighAccuracy:!0,timeout:12e3,maximumAge:3e3})}function I(t){const e=document.getElementById("passenger-simulator-status"),n=document.getElementById("passenger-simulator-play"),a=document.getElementById("passenger-simulator-pause"),o=document.getElementById("passenger-simulator-gps");e&&(e.textContent=t),n&&(n.disabled=s.playing),a&&(a.disabled=!s.playing),o&&(o.disabled=!s.enabled)}function te(){document.documentElement.dataset.appRole="passenger";const t=()=>{G(document.getElementById("app")),document.title="Acompanhar Corrida - Sistema de Frotas",q()};if(document.readyState==="loading"){window.addEventListener("DOMContentLoaded",t,{once:!0});return}t()}export{te as mountPassengerApp};
