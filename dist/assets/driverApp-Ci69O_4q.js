import{T as st,a as ot,P as at,D as rt,c as k,b as H,m as lt,L as v,d as q,f as ct,e as w,g as K,h as _,i as Z,s as Y,R as dt,j as J}from"./setupScreen-D2_zzUs_.js";const P=Object.freeze({defaultRoute:rt,presetRoutes:at,deviationThresholdMeters:45,rerouteConfirmationReadings:2,rerouteRetryCooldownMs:5e3,stationaryPromptDelayMs:5*60*1e3,stationarySpeedThresholdKmH:3,waitingResumeSpeedKmH:5,defaultSpeedKmH:50,colors:ot,tomtom:st});function ut(s){if(!s)throw new Error("Elemento raiz da aplicação não encontrado.");s.className="driver-app",s.dataset.roleRoot="driver",s.innerHTML=`
    <div id="setup-page-container" class="setup-page-container hidden"></div>

    <div id="map-viewport">
      <div id="map-rotator">
        <div id="map-container"></div>
      </div>
    </div>

    <div class="ui-overlay">
      <div class="waze-top-bar" id="waze-top-bar"></div>

      <div class="waiting-mode-card" id="waiting-mode-card" role="status" hidden>
        <div class="waiting-mode-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
            <line x1="9" y1="5" x2="9" y2="19"></line>
            <line x1="15" y1="5" x2="15" y2="19"></line>
          </svg>
        </div>
        <div class="waiting-mode-info">
          <strong>Modo de espera</strong>
          <span id="waiting-mode-duration">Aguardando passageiro · iniciado agora</span>
        </div>
        <button type="button" class="waiting-mode-resume" id="btn-resume-waiting">Retomar corrida</button>
      </div>

      <button class="btn-back-to-setup" id="btn-open-setup" title="Configurar nova rota">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        <span>Nova Rota</span>
      </button>

      <section class="navigation-simulator" id="navigation-simulator" aria-label="Simulador de navegação" hidden>
        <div class="simulator-header">
          <strong>Simulador</strong>
          <span id="simulator-status">GPS real</span>
        </div>
        <div class="simulator-actions">
          <button type="button" class="simulator-btn play" id="btn-simulator-play">▶ Play</button>
          <button type="button" class="simulator-btn pause" id="btn-simulator-pause">Ⅱ Pausar</button>
          <button type="button" class="simulator-btn waiting" id="btn-simulator-waiting">Testar espera</button>
          <button type="button" class="simulator-btn gps" id="btn-simulator-gps">Voltar ao GPS</button>
        </div>
      </section>

      <div class="reroute-banner" id="reroute-banner">
        <div class="reroute-spinner"></div>
        <span>Fora da rota! Recalculando trajeto...</span>
      </div>

      <div class="offline-alert-banner" id="offline-alert-banner">
        <div class="offline-icon-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <line x1="12" y1="20" x2="12.01" y2="20"/>
          </svg>
        </div>
        <div class="offline-banner-content">
          <span class="offline-banner-title">Dispositivo Offline</span>
          <span class="offline-banner-desc" id="offline-banner-text">Não foi possível calcular o trajeto. Verifique a internet.</span>
        </div>
        <button type="button" class="btn-offline-retry" id="btn-offline-retry" title="Tentar carregar novamente">Reconectar</button>
      </div>

      <button type="button" class="btn-recenter-map" id="fab-recenter" title="Recentralizar no GPS">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
        </svg>
        <span class="recenter-label">Centrar</span>
      </button>

      <div class="speedometer-widget" id="speedometer-widget" title="Clique para mudar velocidade"></div>

      <button class="btn-waze-nav" id="btn-waze-nav" title="Abrir trajeto no Waze">
        <div class="waze-icon-badge">
          <svg width="26" height="26" viewBox="0 0 48 48" fill="none">
            <path d="M37.5 19.5c0-8.28-6.72-15-15-15s-15 6.72-15 15c0 3.3.9 6.3 2.7 9l-2.7 7.5 7.8-2.4c2.1 1.2 4.5 1.9 7.2 1.9 8.28 0 15-6.72 15-15z" fill="#33CCFF"/>
            <circle cx="16" cy="18" r="3" fill="#1E224F"/>
            <circle cx="28" cy="18" r="3" fill="#1E224F"/>
            <path d="M19 24c1.5 2 4.5 2 6 0" stroke="#1E224F" stroke-width="2.5" stroke-linecap="round"/>
            <ellipse cx="14" cy="36" rx="3.5" ry="3.5" fill="#1E224F"/>
            <ellipse cx="28" cy="36" rx="3.5" ry="3.5" fill="#1E224F"/>
          </svg>
        </div>
        <span class="badge-tooltip">Abrir no Waze</span>
      </button>

      <button class="btn-google-maps-nav" id="btn-google-maps-nav" title="Abrir trajeto no Google Maps">
        <div class="gmaps-icon-badge">
          <svg width="26" height="26" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M24 4C14.06 4 6 12.06 6 22c0 8.07 5.37 14.88 12.75 17.15L24 44l5.25-4.85C36.63 36.88 42 30.07 42 22c0-9.94-8.06-18-18-18z"/>
            <path fill="#34A853" d="M24 4c-9.94 0-18 8.06-18 18 0 4.12 1.39 7.91 3.73 10.95L24 22V4z"/>
            <path fill="#FBBC05" d="M24 4v18l14.27 10.95C40.61 29.91 42 26.12 42 22c0-9.94-8.06-18-18-18z"/>
            <path fill="#EA4335" d="M24 44v-4.85C16.62 36.88 11.25 30.07 11.25 22H6c0 8.07 5.37 14.88 12.75 17.15L24 44z"/>
            <circle fill="#ffffff" cx="24" cy="22" r="7"/>
            <circle fill="#4285F4" cx="24" cy="22" r="4.5"/>
          </svg>
        </div>
        <span class="badge-tooltip">Abrir no Google Maps</span>
      </button>

      <div class="ride-bottom-sheet collapsed" id="ride-bottom-sheet"></div>
    </div>

    <div class="stationary-prompt-overlay" id="stationary-prompt" role="dialog" aria-modal="true" aria-labelledby="stationary-prompt-title" hidden>
      <div class="stationary-prompt-card">
        <p>Notamos que você está parado há mais de 5 minutos.</p>
        <h2 id="stationary-prompt-title">Está aguardando o passageiro?</h2>
        <div class="stationary-prompt-actions">
          <button type="button" class="stationary-prompt-btn no" id="btn-stationary-no">Não</button>
          <button type="button" class="stationary-prompt-btn yes" id="btn-stationary-yes">Sim</button>
        </div>
      </div>
    </div>
  `}class ht{constructor(){this.isMuted=!1,this.synth=window.speechSynthesis,this.audioCtx=null,this.lastSpokenText="",this.lastSpokeTime=0}initAudioContext(){if(!this.audioCtx&&(window.AudioContext||window.webkitAudioContext)){const t=window.AudioContext||window.webkitAudioContext;this.audioCtx=new t}}toggleMute(){return this.isMuted=!this.isMuted,this.isMuted&&this.synth&&this.synth.cancel(),this.isMuted}playTone(t=440,e=.15,n="sine"){if(!this.isMuted)try{if(this.initAudioContext(),!this.audioCtx)return;this.audioCtx.state==="suspended"&&this.audioCtx.resume();const i=this.audioCtx.createOscillator(),o=this.audioCtx.createGain();i.type=n,i.frequency.setValueAtTime(t,this.audioCtx.currentTime),o.gain.setValueAtTime(.12,this.audioCtx.currentTime),o.gain.exponentialRampToValueAtTime(.001,this.audioCtx.currentTime+e),i.connect(o),o.connect(this.audioCtx.destination),i.start(),i.stop(this.audioCtx.currentTime+e)}catch(i){console.debug("Audio error:",i)}}playRerouteChime(){this.isMuted||(this.playTone(523.25,.1,"triangle"),setTimeout(()=>this.playTone(659.25,.15,"triangle"),110))}playTurnChime(){this.isMuted||this.playTone(587.33,.1,"sine")}playArrivalFanfare(){if(this.isMuted)return;[523.25,659.25,783.99,1046.5].forEach((e,n)=>{setTimeout(()=>this.playTone(e,.2,"triangle"),n*120)})}speak(t,e=!1){if(this.isMuted||!this.synth)return;const n=Date.now();if(!(!e&&t===this.lastSpokenText&&n-this.lastSpokeTime<8e3)){this.lastSpokenText=t,this.lastSpokeTime=n;try{this.synth.cancel();const i=new SpeechSynthesisUtterance(t);i.lang="pt-BR",i.rate=1.05,i.pitch=1;const r=this.synth.getVoices().find(l=>l.lang.includes("pt-BR")||l.lang.includes("pt_BR"));r&&(i.voice=r),this.synth.speak(i)}catch(i){console.debug("Speech error:",i)}}}}const R=new ht;class pt{constructor(t={}){this.options=t,this.route=null,this.coordinates=[],this.steps=[],this.currentPosition=null,this.currentBearing=0,this.currentSpeedKmH=0,this.watchId=null,this.isTracking=!1,this.isRerouting=!1,this.activeStepIndex=0,this.routeDistanceMeters=0,this.routeDurationSeconds=0,this.lastSpokenStepIndex=-1,this.closestCoordIndex=0,this.lastGpsTimestamp=0,this.lastAcceptedGpsTimestamp=0,this.gpsUpdateIntervalMs=1e3,this.offRouteReadings=0,this.lastRerouteAttemptAt=0}setRoute(t){this.route=t,this.coordinates=t.coordinates||[],this.steps=t.steps||[],this.isRerouting=!1,this.lastSpokenStepIndex=-1,this.closestCoordIndex=0,this.activeStepIndex=0,this.routeDistanceMeters=t.distanceMeters||0,this.routeDurationSeconds=t.durationSeconds||0,this.offRouteReadings=0,this.currentPosition&&this.processGpsUpdate(this.currentPosition,this.currentBearing,this.currentSpeedKmH)}startGpsTracking(){if(!("geolocation"in navigator)){this.options.onGpsError&&this.options.onGpsError("Geolocalização não suportada no seu navegador.");return}this.watchId!==null&&navigator.geolocation.clearWatch(this.watchId),this.isTracking=!0,this.watchId=navigator.geolocation.watchPosition(t=>{const{latitude:e,longitude:n,speed:i,heading:o,accuracy:r}=t.coords,l=[e,n],c=t.timestamp||Date.now();let d=0,p=0;if(this.currentPosition&&this.lastGpsTimestamp){const x=Math.max(.1,(c-this.lastGpsTimestamp)/1e3),C=Math.max(.1,(c-(this.lastAcceptedGpsTimestamp||this.lastGpsTimestamp))/1e3);this.gpsUpdateIntervalMs=Math.min(2500,Math.max(400,x*1e3)),p=k(this.currentPosition[0],this.currentPosition[1],l[0],l[1]),d=p/C*3.6;const I=Number.isFinite(i)?i*3.6:0;if(d>220&&I<180&&(r||0)>20){console.warn("Salto impreciso do GPS ignorado:",{distanceMeters:Math.round(p),accuracy:Math.round(r||0)});return}}this.lastGpsTimestamp=c;const u=Math.max(8,Math.min(Number(r)||8,20)),f=Number.isFinite(i)?i*3.6:0,y=!this.currentPosition||f>=4||p>=u;let m=0;i!==null&&!isNaN(i)&&i>0?m=Math.round(i*3.6):y&&d>0&&d<=220&&(m=Math.round(d)),this.currentSpeedKmH=m,y&&m>=8&&o!==null&&!isNaN(o)&&o>=0?this.currentBearing=o:y&&m>=8&&this.currentPosition&&p>=u&&(this.currentBearing=H(this.currentPosition[0],this.currentPosition[1],l[0],l[1]));const b=y?l:this.currentPosition||l;y&&(this.lastAcceptedGpsTimestamp=c),this.currentPosition=b,this.processGpsUpdate(b,this.currentBearing,this.currentSpeedKmH,r)},t=>{console.warn("Erro no sensor GPS:",t),this.options.onGpsError&&this.options.onGpsError("Sinal de GPS indisponível ou permissão não concedida.")},{enableHighAccuracy:!0,maximumAge:1e3,timeout:1e4})}stopGpsTracking(){this.isTracking=!1,this.watchId!==null&&(navigator.geolocation.clearWatch(this.watchId),this.watchId=null)}processGpsUpdate(t,e,n,i=0){if(!t)return;if(!this.coordinates||this.coordinates.length<2){this.options.onUpdate&&this.options.onUpdate({position:t,bearing:e,speedKmH:n,remainingDistanceMeters:0,remainingDurationSeconds:0,activeStep:null,nextStep:null,distanceToStep:0,remainingCoordinates:[],isOffRoute:!1,distanceFromRouteMeters:0,accuracyMeters:Number(i)||0});return}const o=Math.max(P.deviationThresholdMeters||45,Math.min((Number(i)||0)*1.5,90)),r=lt(t,this.coordinates,o);this.closestCoordIndex=r.closestIndex;const l=this.predictPositionAlongRoute(r.closestPoint,r.closestIndex,n);this.offRouteReadings=r.isOffRoute?this.offRouteReadings+1:0;const c=Date.now(),d=this.offRouteReadings>=(P.rerouteConfirmationReadings||2),p=c-this.lastRerouteAttemptAt>=(P.rerouteRetryCooldownMs||5e3);d&&p&&!this.isRerouting&&(this.isRerouting=!0,this.lastRerouteAttemptAt=c,this.options.onOffRoute?this.options.onOffRoute(t,r.distance):this.isRerouting=!1);let u=0;const f=this.coordinates[this.closestCoordIndex+1]||this.coordinates[this.coordinates.length-1];u+=k(t[0],t[1],f[0],f[1]);for(let D=this.closestCoordIndex+1;D<this.coordinates.length-1;D++)u+=k(this.coordinates[D][0],this.coordinates[D][1],this.coordinates[D+1][0],this.coordinates[D+1][1]);const y=this.routeDistanceMeters>0&&this.routeDurationSeconds>0?Math.round(this.routeDurationSeconds*(u/this.routeDistanceMeters)):0;this.findActiveStepIndex();const m=this.steps[this.activeStepIndex]||this.steps[this.steps.length-1]||null,b=this.steps[this.activeStepIndex+1]||null;let x=0;m&&(x=k(t[0],t[1],m.location[0],m.location[1])),this.activeStepIndex!==this.lastSpokenStepIndex&&m&&(this.lastSpokenStepIndex=this.activeStepIndex,this.options.onStepChange&&this.options.onStepChange(m,x));const C=this.coordinates[this.coordinates.length-1];k(t[0],t[1],C[0],C[1])<30&&this.options.onDestinationReached&&this.options.onDestinationReached();const j=[t,...this.coordinates.slice(this.closestCoordIndex+1)];this.options.onUpdate&&this.options.onUpdate({position:t,bearing:e,speedKmH:n,remainingDistanceMeters:Math.round(u),remainingDurationSeconds:y,activeStep:m,nextStep:b,distanceToStep:Math.round(x),remainingCoordinates:j,closestCoordIndex:this.closestCoordIndex,displayPosition:l.position,displayCoordIndex:l.coordIndex,isOffRoute:r.isOffRoute,distanceFromRouteMeters:Math.round(r.distance),accuracyMeters:Number(i)||0})}findActiveStepIndex(){if(!this.steps||this.steps.length===0)return;let t=this.steps.length-1;for(let e=0;e<this.steps.length;e++)if(this.steps[e].coordIndex>this.closestCoordIndex){t=e;break}this.activeStepIndex=t}predictPositionAlongRoute(t,e,n){if(!t||this.coordinates.length<2)return{position:t,coordIndex:e};const i=Math.min(2,Math.max(.6,this.gpsUpdateIntervalMs/1e3));let o=Math.min(35,Math.max(0,n)/3.6*i),r=t,l=e;for(let c=e+1;c<this.coordinates.length;c++){const d=this.coordinates[c],p=k(r[0],r[1],d[0],d[1]);if(p>0&&o<=p){const u=o/p;return{position:[r[0]+(d[0]-r[0])*u,r[1]+(d[1]-r[1])*u],coordIndex:Math.max(e,c-1)}}if(o-=p,r=d,l=c,o<=0)break}return{position:r,coordIndex:l}}finishRerouting(){this.isRerouting=!1,this.offRouteReadings=0}}class mt{constructor(t,e={}){this.containerId=t,this.options=e,this.map=null,this.rotatorElement=null,this.routePolyline=null,this.routePolylineOutline=null,this.routeCoordinates=[],this.visualRouteCoordIndex=0,this.targetRouteCoordIndex=0,this.lastRouteVisualSyncAt=0,this.trafficPolylineLayers=[],this.trafficLegend=null,this.vehicleMarker=null,this.originMarker=null,this.destMarker=null,this.isFollowingVehicle=!0,this.currentMapBearing=0,this.cumulativeAngle=0,this.smoothedBearing=0,this.vehicleAnimationFrame=null,this.lastVehicleUpdateAt=0,this.tiltAngle=24,this.navigationZoom=18,this.onVehicleDragEnd=e.onVehicleDragEnd||null,this.onMapClick=e.onMapClick||null}init(t=[-23.507248,-46.653695],e=18){this.rotatorElement=document.getElementById("map-rotator"),this.map=v.map(this.containerId,{center:t,zoom:e,zoomControl:!1,attributionControl:!1,zoomSnap:.1,maxZoom:21}),v.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",{maxZoom:21,maxNativeZoom:18,subdomains:"abcd"}).addTo(this.map);const n=document.querySelector(".ui-overlay"),i=document.getElementById("setup-page-container");return q(n),q(i),this.map.on("dragstart",()=>{this.isFollowingVehicle&&(this.setFollowVehicle(!1),this.options.onCameraModeChange&&this.options.onCameraModeChange(!1))}),this}drawRoute(t,e=[]){!t||t.length===0||(this.routePolylineOutline&&this.map.removeLayer(this.routePolylineOutline),this.routePolyline&&this.map.removeLayer(this.routePolyline),this.clearTrafficLayers(),this.routeCoordinates=t,this.visualRouteCoordIndex=0,this.targetRouteCoordIndex=0,this.routePolylineOutline=v.polyline(t,{color:P.colors.primaryNavy,weight:12,opacity:.95,lineCap:"round",lineJoin:"round",interactive:!1}).addTo(this.map),this.routePolyline=v.polyline(t,{color:"#4F46E5",weight:7,opacity:1,lineCap:"round",lineJoin:"round",interactive:!1}).addTo(this.map),this.drawTrafficSections(e))}trafficColor(t){const e=String(t.simpleCategory||"").toUpperCase(),n=Number(t.delayInSeconds)||0,i=Number(t.magnitudeOfDelay)||0;return e==="ROAD_CLOSURE"?"#7F1D1D":i>=3||n>=600?"#DC2626":i===2||n>=180?"#F97316":"#FACC15"}trafficCategoryLabel(t){return{JAM:"Congestionamento",ROAD_WORK:"Obras na via",ROAD_CLOSURE:"Via interditada",OTHER:"Ocorrência no trânsito"}[String(t||"").toUpperCase()]||"Trânsito lento"}formatTrafficDelay(t){return t?t<60?`Atraso de ${t} s`:`Atraso de ${Math.max(1,Math.round(t/60))} min`:"Atraso não informado"}createTrafficPopup(t){const e=document.createElement("div");e.className="traffic-route-popup";const n=document.createElement("strong");n.textContent=this.trafficCategoryLabel(t.simpleCategory),e.appendChild(n);const i=document.createElement("span");if(i.textContent=this.formatTrafficDelay(Number(t.delayInSeconds)||0),e.appendChild(i),Number(t.effectiveSpeedInKmh)>0){const o=document.createElement("span");o.textContent=`Velocidade média: ${Math.round(t.effectiveSpeedInKmh)} km/h`,e.appendChild(o)}return e}drawTrafficSections(t){(t||[]).filter(n=>{const i=Number(n.startPointIndex),o=Number(n.endPointIndex);return Number.isInteger(i)&&Number.isInteger(o)&&o>i}).forEach(n=>{const i=Math.max(0,Number(n.startPointIndex)),o=Math.min(this.routeCoordinates.length-1,Number(n.endPointIndex)),r=this.routeCoordinates.slice(i,o+1);if(r.length<2)return;const l=v.polyline(r,{color:this.trafficColor(n),weight:8,opacity:1,lineCap:"round",lineJoin:"round",interactive:!0}).addTo(this.map);l.bindPopup(this.createTrafficPopup(n),{className:"traffic-leaflet-popup",closeButton:!1,offset:[0,-4]}),l.trafficStartIndex=i,l.trafficEndIndex=o,this.trafficPolylineLayers.push(l)}),this.trafficPolylineLayers.length>0&&this.showTrafficLegend()}showTrafficLegend(){this.trafficLegend=v.control({position:"bottomleft"}),this.trafficLegend.onAdd=()=>{const t=v.DomUtil.create("div","traffic-route-legend");return t.innerHTML=`
        <span><i class="traffic-dot light"></i>Leve</span>
        <span><i class="traffic-dot moderate"></i>Moderado</span>
        <span><i class="traffic-dot heavy"></i>Intenso</span>
      `,v.DomEvent.disableClickPropagation(t),t},this.trafficLegend.addTo(this.map)}clearTrafficLayers(){this.trafficPolylineLayers.forEach(t=>this.map.removeLayer(t)),this.trafficPolylineLayers=[],this.trafficLegend&&(this.map.removeControl(this.trafficLegend),this.trafficLegend=null)}updateRemainingRoute(t,e=0){var o;if(!t||t.length<2)return;this.targetRouteCoordIndex=Math.max(this.visualRouteCoordIndex,e);let n=t[0];const i=(o=this.vehicleMarker)==null?void 0:o.getLatLng();i&&(n=[i.lat,i.lng]),this.syncRouteToVisualPosition(n)}syncRouteToVisualPosition(t){if(!t||this.routeCoordinates.length<2)return;const e=v.latLng(t);let n=1/0,i=this.visualRouteCoordIndex;const o=Math.max(0,this.visualRouteCoordIndex-3),r=Math.min(this.routeCoordinates.length-1,Math.max(this.targetRouteCoordIndex+25,o+40));for(let d=o;d<=r;d++){const p=e.distanceTo(v.latLng(this.routeCoordinates[d]));p<n&&(n=p,i=d)}this.visualRouteCoordIndex=Math.max(this.visualRouteCoordIndex,i);const l=this.visualRouteCoordIndex,c=[t,...this.routeCoordinates.slice(l+1)];this.routePolyline&&this.routePolylineOutline&&(this.routePolyline.setLatLngs(c),this.routePolylineOutline.setLatLngs(c)),this.trafficPolylineLayers.forEach(d=>{if(d.trafficEndIndex<=l){d.setLatLngs([]);return}const p=Math.max(d.trafficStartIndex,l+1),u=this.routeCoordinates.slice(p,d.trafficEndIndex+1);d.trafficStartIndex<=l&&u.length>0&&u.unshift(t),d.setLatLngs(u)})}fitRouteBounds(t){if(!t||t.length===0)return;const e=v.latLngBounds(t);this.map.fitBounds(e,{paddingTopLeft:[40,100],paddingBottomRight:[40,100],maxZoom:18,animate:!0})}setOriginMarker(t){this.originMarker&&this.map.removeLayer(this.originMarker);const e=v.divIcon({className:"custom-pin-marker",html:'<div class="origin-pin-icon"></div>',iconSize:[24,24],iconAnchor:[12,12]});this.originMarker=v.marker(t,{icon:e}).addTo(this.map)}setDestinationMarker(t){this.destMarker&&this.map.removeLayer(this.destMarker);const e=v.divIcon({className:"custom-pin-marker",html:`
        <div class="destination-pin-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `,iconSize:[34,34],iconAnchor:[17,17]});this.destMarker=v.marker(t,{icon:e}).addTo(this.map)}getRoundedArrowSvg(){return`
      <svg viewBox="0 0 36 36" class="waze-arrow-svg">
        <path d="M18 4.2 
                 C18.6 4.2 19.2 4.6 19.6 5.2 
                 L30.8 25.2 
                 C31.4 26.3 30.6 27.6 29.4 27.2 
                 L18.6 23.4 
                 C18.2 23.2 17.8 23.2 17.4 23.4 
                 L6.6 27.2 
                 C5.4 27.6 4.6 26.3 5.2 25.2 
                 L16.4 5.2 
                 C16.8 4.6 17.4 4.2 18 4.2 Z" 
              fill="#0084FF" 
              stroke="#FFFFFF" 
              stroke-width="2.2" 
              stroke-linejoin="round" 
              stroke-linecap="round"/>
      </svg>
    `}applyMapTransform(t){if(this.rotatorElement)if(this.isFollowingVehicle){let e=t-this.smoothedBearing;e>180&&(e-=360),e<-180&&(e+=360),Math.abs(e)>3&&(this.smoothedBearing+=e*.15);let n=this.smoothedBearing-this.cumulativeAngle%360;n>180&&(n-=360),n<-180&&(n+=360),this.cumulativeAngle+=n,this.currentMapBearing=t,this.rotatorElement.style.transform=`scale(1.1) rotateX(${this.tiltAngle}deg) rotate(${-this.cumulativeAngle}deg)`}else this.rotatorElement.style.transform="scale(1) rotateX(0deg) rotate(0deg)"}updateVehiclePosition(t,e=0,n=null){var l;if(!t)return;let i=v.latLng(t);const o=performance.now(),r=Number.isInteger(n)&&this.routeCoordinates.length>1;if(r&&(this.targetRouteCoordIndex=Math.max(this.visualRouteCoordIndex,n),this.vehicleMarker)){const c=this.vehicleMarker.getLatLng();if(n<this.visualRouteCoordIndex)i=c;else if(n===this.visualRouteCoordIndex){const d=this.routeSegmentProgress(c,n);this.routeSegmentProgress(i,n)<d&&(i=c)}}if(this.vehicleMarker){const c=this.lastVehicleUpdateAt?o-this.lastVehicleUpdateAt:1e3;this.lastVehicleUpdateAt=o;const p=((l=window.matchMedia)==null?void 0:l.call(window,"(prefers-reduced-motion: reduce)").matches)?0:Math.min(2800,Math.max(450,c*.92));this.animateVehicleTo(i,p,r?this.targetRouteCoordIndex:null,e),r||this.updateVehicleArrow(e),this.isFollowingVehicle&&!r&&this.map.panTo(i,{animate:p>0,duration:p/1e3,easeLinearity:1,noMoveStart:!0})}else{this.smoothedBearing=e,this.cumulativeAngle=e;const c=v.divIcon({className:"custom-pin-marker",html:`
          <div class="waze-vehicle-container" id="waze-vehicle-marker-dom">
            <div class="waze-vehicle-shadow"></div>
            <div class="waze-vehicle-arrow-wrapper" style="transform: rotate(${e}deg);">
              ${this.getRoundedArrowSvg()}
            </div>
          </div>
        `,iconSize:[56,56],iconAnchor:[28,28]});this.vehicleMarker=v.marker(t,{icon:c,draggable:!1,interactive:!1,zIndexOffset:1e3}).addTo(this.map),this.lastVehicleUpdateAt=o}this.isFollowingVehicle&&!r&&(this.applyMapTransform(e),this.vehicleAnimationFrame||this.map.panTo(i,{animate:!1}))}updateVehicleArrow(t){var i;const e=((i=this.vehicleMarker)==null?void 0:i.getElement())||document.getElementById("waze-vehicle-marker-dom"),n=e==null?void 0:e.querySelector(".waze-vehicle-arrow-wrapper");n&&(n.style.transform=`rotate(${t}deg)`)}routeSegmentProgress(t,e){const n=this.routeCoordinates[e],i=this.routeCoordinates[e+1];if(!n||!i)return 1;const o=i[0]-n[0],r=i[1]-n[1],l=o*o+r*r;if(l===0)return 1;const c=((t.lat-n[0])*o+(t.lng-n[1])*r)/l;return Math.max(0,Math.min(1,c))}createVehicleAnimationPath(t,e,n){if(!Number.isInteger(n)||this.routeCoordinates.length<2)return[t,e];const i=Math.min(this.routeCoordinates.length-1,n),o=[t];for(let r=this.visualRouteCoordIndex+1;r<=i;r++)o.push(v.latLng(this.routeCoordinates[r]));return o[o.length-1].distanceTo(e)>.3&&o.push(e),o}animateVehicleTo(t,e,n=null,i=0){if(!this.vehicleMarker)return;this.vehicleAnimationFrame&&cancelAnimationFrame(this.vehicleAnimationFrame);const o=this.vehicleMarker.getLatLng(),r=performance.now(),l=this.createVehicleAnimationPath(o,t,n),c=[];let d=0;for(let u=0;u<l.length-1;u++){const f=l[u].distanceTo(l[u+1]);f<=0||(c.push({start:l[u],end:l[u+1],distance:f,offset:d}),d+=f)}if(e<=0||d<.5||c.length===0){this.vehicleMarker.setLatLng(t),Number.isInteger(n)||this.updateVehicleArrow(i),this.vehicleAnimationFrame=null;return}const p=u=>{const f=Math.min(1,(u-r)/e),y=d*f,m=c.find(I=>y<=I.offset+I.distance)||c[c.length-1],b=Math.min(1,Math.max(0,(y-m.offset)/m.distance)),x=m.start.lat+(m.end.lat-m.start.lat)*b,C=m.start.lng+(m.end.lng-m.start.lng)*b;if(this.vehicleMarker.setLatLng([x,C]),u-this.lastRouteVisualSyncAt>=80||f===1){this.lastRouteVisualSyncAt=u;const I=H(m.start.lat,m.start.lng,m.end.lat,m.end.lng);this.updateVehicleArrow(I),this.syncRouteToVisualPosition([x,C]),this.isFollowingVehicle&&(this.applyMapTransform(I),this.map.panTo([x,C],{animate:!0,duration:.1,easeLinearity:1,noMoveStart:!0}))}f<1?this.vehicleAnimationFrame=requestAnimationFrame(p):this.vehicleAnimationFrame=null};this.vehicleAnimationFrame=requestAnimationFrame(p)}setFollowVehicle(t){this.isFollowingVehicle=t,t&&this.vehicleMarker?(this.smoothedBearing=this.currentMapBearing,this.cumulativeAngle=this.currentMapBearing,this.map.setView(this.vehicleMarker.getLatLng(),this.navigationZoom,{animate:!0}),this.applyMapTransform(this.currentMapBearing)):!t&&this.rotatorElement&&(this.cumulativeAngle=0,this.rotatorElement.style.transform="scale(1) rotateX(0deg) rotate(0deg)")}}class gt{constructor(t,e={}){this.container=document.getElementById(t),this.options=e,this.currentStep=null,this.nextStep=null,this.distanceToStep=0}getManeuverSvg(t){switch(t){case"corner-up-right":return`
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" class="waze-maneuver-svg">
            <polyline points="15 14 20 9 15 4"/>
            <path d="M4 20v-7a4 4 0 0 1 4-4h12"/>
          </svg>
        `;case"corner-up-left":return`
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" class="waze-maneuver-svg">
            <polyline points="9 14 4 9 9 4"/>
            <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
          </svg>
        `;case"arrow-up-right":return`
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" class="waze-maneuver-svg">
            <line x1="7" y1="17" x2="17" y2="7"/>
            <polyline points="7 7 17 7 17 17"/>
          </svg>
        `;case"arrow-up-left":return`
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" class="waze-maneuver-svg">
            <line x1="17" y1="17" x2="7" y2="7"/>
            <polyline points="17 7 7 7 7 17"/>
          </svg>
        `;case"roundabout":return`
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" class="waze-maneuver-svg">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
            <polyline points="21 3 21 8 16 8"/>
          </svg>
        `;case"u-turn":return`
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" class="waze-maneuver-svg">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <polyline points="3 3 3 8 8 8"/>
          </svg>
        `;case"flag":return`
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" class="waze-maneuver-svg">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
            <line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
        `;case"merge":case"fork":return`
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" class="waze-maneuver-svg">
            <circle cx="18" cy="18" r="3"/>
            <circle cx="6" cy="6" r="3"/>
            <path d="M6 9v12"/>
            <path d="M18 15a9 9 0 0 0-9-9"/>
          </svg>
        `;case"arrow-up":default:return`
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" class="waze-maneuver-svg">
            <line x1="12" y1="19" x2="12" y2="5"/>
            <polyline points="5 12 12 5 19 12"/>
          </svg>
        `}}update(t,e,n=null){this.currentStep=t,this.nextStep=n,this.distanceToStep=e,this.render()}render(){if(!this.container)return;if(!this.currentStep){this.container.innerHTML=`
        <div class="waze-maneuver-icon-box">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" class="waze-maneuver-svg">
            <line x1="12" y1="19" x2="12" y2="5"/>
            <polyline points="5 12 12 5 19 12"/>
          </svg>
        </div>
        <div class="waze-step-info">
          <div class="waze-distance-row">
            <span class="waze-step-distance">Calculando...</span>
          </div>
          <div class="waze-step-street">Preparando rota</div>
        </div>
      `,this.bindEvents();return}const t=ct(this.distanceToStep),e=this.currentStep.rawName||this.currentStep.instruction,n=this.getManeuverSvg(this.currentStep.icon);this.container.innerHTML=`
      <div class="waze-maneuver-icon-box">
        ${n}
      </div>
      <div class="waze-step-info">
        <div class="waze-distance-row">
          <span class="waze-step-distance">${t}</span>
        </div>
        <div class="waze-step-street" title="${e}">${e}</div>
        ${this.nextStep?`
          <div class="waze-next-preview">
            <span>Depois: ${this.nextStep.instruction}</span>
          </div>
        `:""}
      </div>
      <div class="waze-top-right-actions">
        <button class="waze-mini-action-btn active" id="top-btn-sound" title="Alternar voz do GPS">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        </button>
      </div>
    `,this.bindEvents()}bindEvents(){const t=this.container.querySelector("#top-btn-sound");t&&this.options.onToggleSound&&w(t,()=>{this.options.onToggleSound(t)})}}class ft{constructor(t,e={}){this.container=document.getElementById(t),this.options=e,this.currentSpeed=null,this.speedLimit=e.speedLimit||null}init(){this.render()}setSpeed(t){t==null||isNaN(t)?this.currentSpeed=null:this.currentSpeed=Math.max(0,Math.round(t)),this.updateGauge()}setSpeedLimit(t){this.speedLimit=t&&t>0?t:null,this.updateGauge()}updateGauge(){if(!this.container)return;if(this.currentSpeed===null){this.container.style.display="none";return}this.container.style.display="flex";const t=this.container.querySelector(".speedometer-val"),e=this.container.querySelector(".speedometer-ring-fill"),n=this.container.querySelector(".speed-limit-badge");if(t&&(t.textContent=this.currentSpeed),n&&(this.speedLimit?(n.style.display="flex",n.textContent=this.speedLimit):n.style.display="none"),e){const r=188-Math.min(1,this.currentSpeed/120)*188;e.style.strokeDashoffset=r,this.speedLimit&&this.currentSpeed>this.speedLimit?e.style.stroke="var(--action-red)":e.style.stroke="var(--accent-cyan)"}}render(){this.container&&(this.container.innerHTML=`
      <svg class="speedometer-ring-svg" viewBox="0 0 70 70">
        <circle class="speedometer-ring-bg" cx="35" cy="35" r="30" />
        <circle class="speedometer-ring-fill" cx="35" cy="35" r="30" />
      </svg>
      <div class="speed-limit-badge" style="display: ${this.speedLimit?"flex":"none"};">${this.speedLimit||""}</div>
      <span class="speedometer-val">${this.currentSpeed!==null?this.currentSpeed:"--"}</span>
      <span class="speedometer-unit">km/h</span>
    `,this.currentSpeed===null&&(this.container.style.display="none"),this.container&&w(this.container,()=>{this.options.onClick&&this.options.onClick()}))}}class vt{constructor(t,e={}){this.container=document.getElementById(t),this.options=e,this.status="transit",this.waitingMinutes=10,this.originName="Rod PR-340 - km 2.5, Jaguapitã",this.destName="Aeroporto de Londrina",this.remainingDistance=0,this.remainingDuration=0,this.isExpanded=!1,this.isDragging=!1,this.startY=0,this.currentTranslateY=0,this.dragCleanup=null}setRouteInfo(t,e){this.originName=t,this.destName=e,this.render()}setStatus(t,e=10){this.status=t,this.waitingMinutes=e,this.render()}toggleExpand(){this.setExpanded(!this.isExpanded)}setExpanded(t){if(this.isExpanded=t,this.container){this.container.classList.toggle("collapsed",!this.isExpanded),this.container.style.transform="",this.container.style.maxHeight="",this.container.style.removeProperty("--sheet-drag-progress"),this.container.classList.remove("dragging");const e=document.querySelector(".ui-overlay");e&&e.classList.toggle("sheet-expanded",this.isExpanded)}}updateMetrics(t,e){this.remainingDistance=t,this.remainingDuration=e;const n=K(this.remainingDuration),i=_(this.remainingDuration),o=Z(this.remainingDistance),r=document.getElementById("waze-compact-eta-val"),l=document.getElementById("waze-compact-dur"),c=document.getElementById("waze-compact-dist");r&&(r.textContent=n),l&&(l.textContent=i),c&&(c.textContent=o);const d=document.getElementById("exp-metric-eta"),p=document.getElementById("exp-metric-time"),u=document.getElementById("exp-metric-dist");d&&(d.textContent=n),p&&(p.textContent=i),u&&(u.textContent=o)}render(){if(!this.container)return;this.container.classList.toggle("collapsed",!this.isExpanded);const t=document.querySelector(".ui-overlay");t&&t.classList.toggle("sheet-expanded",this.isExpanded);const e=this.status==="waiting",n=this.status==="paused"||e?"Corrida em pausa":"Corrida em andamento",i=K(this.remainingDuration),o=_(this.remainingDuration),r=Z(this.remainingDistance);this.container.innerHTML=`
      <!-- Puxador de Arrasto -->
      <div class="sheet-drag-handle-container" id="sheet-drag-handle">
        <div class="sheet-drag-handle"></div>
      </div>

      <!-- 1. BARRA RETRAÍDA: APENAS INFORMAÇÃO CENTRAL -->
      <div class="waze-compact-bar" id="waze-compact-bar">
        <div class="waze-compact-center">
          <span class="waze-compact-eta" id="waze-compact-eta-val">${i}</span>
          <div class="waze-compact-sub">
            <span id="waze-compact-dur">${o}</span>
            <span class="dot-sep"></span>
            <span id="waze-compact-dist">${r}</span>
          </div>
        </div>
      </div>

      <!-- 2. GAVETA EXPANDIDA (Anexo 1 SEM botão de finalizar) -->
      <div class="expanded-content-drawer">
        <div class="ride-sheet-header">
          <button class="back-circle-btn" id="btn-ride-collapse" title="Recolher">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <span class="ride-sheet-title">${n}</span>
        </div>

        <!-- Linha do Tempo Origem e Destino (Anexo 1) -->
        <div class="ride-route-timeline">
          <div class="timeline-vertical-line"></div>

          <!-- Origem -->
          <div class="timeline-point-row">
            <div class="timeline-point-indicator">
              <div class="origin-indicator-dot"></div>
            </div>
            <div class="timeline-point-details">
              <span class="timeline-point-label">Origem</span>
              <span class="timeline-point-name">${this.originName}</span>
            </div>
          </div>

          <!-- Destino -->
          <div class="timeline-point-row">
            <div class="timeline-point-indicator">
              <div class="dest-indicator-pin">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
            </div>
            <div class="timeline-point-details">
              <span class="timeline-point-label">Destino</span>
              <span class="timeline-point-name">${this.destName}</span>
            </div>
          </div>
        </div>

        <!-- Pílula de Status (Anexo 1) -->
        <div class="status-pill-badge" id="btn-toggle-status" title="Clique para alternar status">
          <div class="${e?"status-dot-blue":"status-dot-green"}"></div>
          <span>${e?`Aguardando passageiro há ${this.waitingMinutes} minutos`:"Em trânsito até o destino"}</span>
        </div>

        <!-- Métricas Detalhadas -->
        <div class="ride-metrics-bar">
          <div class="metric-item">
            <span class="metric-val" id="exp-metric-eta">${i}</span>
            <span class="metric-lbl">Chegada</span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric-item">
            <span class="metric-val" id="exp-metric-time">${o}</span>
            <span class="metric-lbl">Tempo</span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric-item">
            <span class="metric-val" id="exp-metric-dist">${r}</span>
            <span class="metric-lbl">Distância</span>
          </div>
        </div>
      </div>
    `,this.bindEvents()}bindEvents(){const t=document.getElementById("waze-compact-bar");document.getElementById("sheet-drag-handle");const e=document.getElementById("btn-ride-collapse"),n=document.getElementById("btn-toggle-status");t&&w(t,()=>{this.hasDragged||this.toggleExpand()}),e&&w(e,()=>this.setExpanded(!1)),n&&w(n,()=>{const i=this.status==="waiting"?"transit":"waiting";this.setStatus(i),this.options.onStatusChange&&this.options.onStatusChange(i)}),this.setupDragGestures(this.container)}setupDragGestures(t){if(!t)return;this.dragCleanup&&this.dragCleanup();let e=0,n=0,i=0,o=108,r=0,l=null;this.hasDragged=!1;const c=u=>{var f;l!==null||u.button!==void 0&&u.button!==0||(l=u.pointerId,this.hasDragged=!1,e=u.clientY,n=e,o=Math.min(108,t.scrollHeight),r=Math.max(o,Math.min(t.scrollHeight,window.innerHeight*.85)),i=t.getBoundingClientRect().height,(f=t.setPointerCapture)==null||f.call(t,u.pointerId),t.classList.add("dragging"),t.style.transition="none",t.style.maxHeight=`${i}px`,t.style.setProperty("--sheet-drag-progress",this.isExpanded?"1":"0"))},d=u=>{if(u.pointerId!==l)return;u.cancelable&&u.preventDefault(),n=u.clientY;const f=n-e;Math.abs(f)>8&&(this.hasDragged=!0);const y=Math.min(r,Math.max(o,i-f)),m=Math.max(1,r-o),b=(y-o)/m;t.style.maxHeight=`${y}px`,t.style.setProperty("--sheet-drag-progress",b.toFixed(3))},p=u=>{var I;if(u.pointerId!==l)return;(I=t.releasePointerCapture)==null||I.call(t,l),l=null;const f=n-e,y=t.getBoundingClientRect().height,m=Math.max(1,r-o),b=(y-o)/m,x=Math.abs(f)>24?f<0:b>=.5;this.isExpanded=x,t.classList.toggle("collapsed",!x);const C=document.querySelector(".ui-overlay");C&&C.classList.toggle("sheet-expanded",x),t.style.transition="max-height 0.28s cubic-bezier(0.16, 1, 0.3, 1)",t.style.maxHeight=`${y}px`,t.style.setProperty("--sheet-drag-progress",x?"1":"0"),t.offsetHeight,t.style.maxHeight=`${x?r:o}px`,window.setTimeout(()=>{t.classList.remove("dragging"),t.style.transition="",t.style.maxHeight="",t.style.removeProperty("--sheet-drag-progress")},300)};t.addEventListener("pointerdown",c),window.addEventListener("pointermove",d),window.addEventListener("pointerup",p),window.addEventListener("pointercancel",p),this.dragCleanup=()=>{t.removeEventListener("pointerdown",c),window.removeEventListener("pointermove",d),window.removeEventListener("pointerup",p),window.removeEventListener("pointercancel",p)}}}const a={currentDestination:null,currentVehiclePos:null,activeRouteData:null,isRecalculating:!1,rerouteCount:0,isSoundActive:!0,userCurrentGps:null,stationarySince:null,stationaryAnchor:null,stationaryTimeoutId:null,stationaryPromptDismissed:!1,lastGpsState:null,isWaitingForPassenger:!1,waitingStartedAt:null,waitingAnchor:null,lastWaitingMinute:-1},h={enabled:!1,isPlaying:!1,timerId:null,position:null,coordIndex:0,speedKmH:45,tickMs:700};let S,B,G,M,L,g;function E(s){const t=document.getElementById("offline-alert-banner"),e=document.getElementById("offline-banner-text");e&&s&&(e.textContent=s),t&&t.classList.add("show")}function N(){const s=document.getElementById("offline-alert-banner");s&&s.classList.remove("show")}function T(){const s=document.getElementById("stationary-prompt");s&&(s.hidden=!0)}function X(){if(a.isWaitingForPassenger||a.stationaryPromptDismissed)return;const s=document.getElementById("stationary-prompt");s&&(s.hidden=!1),R.speak("Você está aguardando o passageiro?",!0)}function $(){a.stationaryTimeoutId!==null&&(window.clearTimeout(a.stationaryTimeoutId),a.stationaryTimeoutId=null)}function A(s=!0){$(),a.stationarySince=null,a.stationaryAnchor=null,s&&(a.stationaryPromptDismissed=!1)}function Q(s){var e;const t=(e=document.getElementById("setup-page-container"))==null?void 0:e.classList.contains("hidden");return!!(a.activeRouteData&&t&&!s.isOffRoute&&s.remainingDistanceMeters>40)}function yt(){$();const s=Date.now()-a.stationarySince,t=Math.max(0,P.stationaryPromptDelayMs-s);a.stationaryTimeoutId=window.setTimeout(()=>{a.stationaryTimeoutId=null;const e=a.lastGpsState;e&&a.stationarySince&&Date.now()-a.stationarySince>=P.stationaryPromptDelayMs&&Q(e)&&e.speedKmH<=P.stationarySpeedThresholdKmH&&X()},t)}function tt(s=!0){T(),A(!1),a.isWaitingForPassenger=!0,a.waitingStartedAt=Date.now(),a.waitingAnchor=a.currentVehiclePos?[...a.currentVehiclePos]:null,a.lastWaitingMinute=0,M==null||M.setStatus("waiting",0),et(0),s&&R.speak("Corrida pausada. Aguardando o passageiro.",!0)}function et(s){const t=document.getElementById("waiting-mode-card"),e=document.getElementById("waiting-mode-duration"),n=document.querySelector(".ui-overlay");t&&(t.hidden=!1),e&&(e.textContent=s>0?`Aguardando passageiro · ${s} min`:"Aguardando passageiro · iniciado agora"),n==null||n.classList.add("passenger-waiting")}function wt(){const s=document.getElementById("waiting-mode-card"),t=document.querySelector(".ui-overlay");s&&(s.hidden=!0),t==null||t.classList.remove("passenger-waiting")}function V(s=!0){const t=a.isWaitingForPassenger;a.isWaitingForPassenger=!1,a.waitingStartedAt=null,a.waitingAnchor=null,a.lastWaitingMinute=-1,T(),A(!0),M==null||M.setStatus("transit"),wt(),s&&t&&R.speak("Corrida retomada.",!0)}function xt(s){const t=Number(s.speedKmH)||0,e=Math.max(20,Math.min((Number(s.accuracyMeters)||0)*1.5,40));if(a.isWaitingForPassenger){const o=a.waitingAnchor?k(a.waitingAnchor[0],a.waitingAnchor[1],s.position[0],s.position[1]):0;if(t>=P.waitingResumeSpeedKmH||o>=e){V(!0);return}const r=Math.floor((Date.now()-a.waitingStartedAt)/6e4);r!==a.lastWaitingMinute&&(a.lastWaitingMinute=r,M.setStatus("waiting",r),et(r));return}if(!Q(s)){T(),A(!0);return}const n=a.stationaryAnchor?k(a.stationaryAnchor[0],a.stationaryAnchor[1],s.position[0],s.position[1]):0;if(t>P.stationarySpeedThresholdKmH||n>=e){T(),A(!0);return}a.stationarySince||(a.stationarySince=Date.now(),a.stationaryAnchor=[...s.position],yt())}function F(s){const t=document.getElementById("simulator-status"),e=document.getElementById("btn-simulator-play"),n=document.getElementById("btn-simulator-pause"),i=document.getElementById("btn-simulator-gps");t&&(t.textContent=s),e&&(e.disabled=h.isPlaying),n&&(n.disabled=!h.enabled||!h.isPlaying),i&&(i.disabled=!h.enabled)}function St(s,t){if(!s||!(t!=null&&t.length))return 0;let e=0,n=1/0;return t.forEach((i,o)=>{const r=k(s[0],s[1],i[0],i[1]);r<n&&(n=r,e=o)}),e}function Mt(s){var o;const t=((o=a.activeRouteData)==null?void 0:o.coordinates)||[];if(!t.length||!h.position)return null;let e=h.position,n=h.coordIndex,i=s;for(let r=n+1;r<t.length;r++){const l=t[r],c=k(e[0],e[1],l[0],l[1]);if(c>0&&i<=c){const d=i/c;return h.coordIndex=Math.max(n,r-1),[e[0]+(l[0]-e[0])*d,e[1]+(l[1]-e[1])*d]}i-=c,e=l,n=r,h.coordIndex=r}return t[t.length-1]}function it(){var t;const s=(t=a.activeRouteData)==null?void 0:t.coordinates;return s!=null&&s.length?(h.enabled||(g==null||g.stopGpsTracking(),h.enabled=!0,h.coordIndex=St(a.currentVehiclePos,s),h.position=[...s[h.coordIndex]],g.currentPosition=[...h.position],g.gpsUpdateIntervalMs=h.tickMs),!0):(alert("Calcule uma rota antes de iniciar o simulador."),!1)}function bt(){!it()||h.isPlaying||(h.isPlaying=!0,F("Em movimento"),h.timerId=window.setInterval(()=>{const s=h.position,t=h.speedKmH/3.6*(h.tickMs/1e3),e=Mt(t);if(!e||!s){z();return}if(k(s[0],s[1],e[0],e[1])<.2){z(),F("Fim da rota");return}const i=H(s[0],s[1],e[0],e[1]);h.position=e,g.currentPosition=[...e],g.currentBearing=i,g.currentSpeedKmH=h.speedKmH,g.processGpsUpdate(e,i,h.speedKmH,3)},h.tickMs))}function z(){h.timerId!==null&&(window.clearInterval(h.timerId),h.timerId=null),h.isPlaying=!1,F(h.enabled?"Parado":"GPS real"),h.enabled&&h.position&&(g.currentSpeedKmH=0,g.processGpsUpdate(h.position,g.currentBearing,0,3))}function Ct(){it()&&(z(),a.stationaryPromptDismissed=!1,a.stationarySince=Date.now()-P.stationaryPromptDelayMs,a.stationaryAnchor=[...h.position],X())}function It(){z(),h.enabled=!1,h.position=null,h.coordIndex=0,a.isWaitingForPassenger&&V(!1),A(!0),F("GPS real"),g==null||g.startGpsTracking()}function kt(){const s=document.getElementById("navigation-simulator"),t=new URLSearchParams(window.location.search).get("simulator")==="1";s&&(s.hidden=!t),F("GPS real")}async function Pt(){const s=Y.loadActiveDestination()||P.defaultRoute.destination;a.currentDestination=s;const t=[s.lat,s.lng];S=new mt("map-container",{onCameraModeChange:e=>nt(e)}),S.init(t,19.3),B=new gt("waze-top-bar",{onToggleSound:e=>Bt(e),onOpenSetup:()=>O()}),B.render(),G=new ft("speedometer-widget",{speedLimit:null}),G.init(),M=new vt("ride-bottom-sheet",{onBackClick:()=>O(),onStatusChange:e=>{e==="waiting"?tt(!1):V(!1)}}),M.setRouteInfo("Minha Localização Atual (GPS)",a.currentDestination.name||"Destino Selecionado"),L=new dt("setup-page-container",{profile:"driver",onStartRoute:async e=>{a.currentDestination=e.destination,Y.saveActiveDestination(e.destination),await Rt(e.destination)}}),L.init(),L.setDestination(a.currentDestination),g=new pt({onUpdate:e=>Et(e),onOffRoute:(e,n)=>Tt(e,n),onStepChange:(e,n)=>At(e),onDestinationReached:()=>Lt(),onGpsError:e=>Dt(e)}),Vt(),kt(),U()}function U(){if(!("geolocation"in navigator)){E("Seu navegador não possui suporte a GPS.");return}navigator.geolocation.getCurrentPosition(async s=>{const t=[s.coords.latitude,s.coords.longitude];a.currentVehiclePos=t,a.userCurrentGps=t,S.map.setView(t,19.3),S.updateVehiclePosition(t,0),await W(t,a.currentDestination,!0),g.startGpsTracking()},s=>{console.warn("Erro ao obter GPS inicial:",s),E("GPS desativado ou permissão negada. Ative o GPS para traçar a rota.")},{enableHighAccuracy:!0,timeout:1e4})}async function Rt(s){a.isWaitingForPassenger&&V(!1),A(!0),a.currentDestination=s,M.setRouteInfo("Minha Localização Atual (GPS)",s.name||s.address),a.currentVehiclePos?(await W(a.currentVehiclePos,s,!0),g.startGpsTracking()):U()}async function W(s,t,e=!1){const n=[t.lat,t.lng];try{const i=await J(s,n);return!i||i.success===!1?(E((i==null?void 0:i.message)||"Sem conexão para carregar a rota."),null):(N(),a.activeRouteData=i,S.drawRoute(i.coordinates,i.trafficSections),e&&(S.setOriginMarker(s),S.setDestinationMarker(n),S.updateVehiclePosition(s,0),S.map.setView(s,19.3)),g.setRoute(i),M.updateMetrics(i.distanceMeters,i.durationSeconds),i.steps&&i.steps.length>0&&B.update(i.steps[0],i.steps[0].distanceMeters,i.steps[1]),i)}catch(i){return console.error("Erro ao calcular rota TomTom:",i),E("Erro de rede ao calcular trajeto. Verifique a internet."),null}}function Et(s){const{position:t,bearing:e,speedKmH:n,remainingDistanceMeters:i,remainingDurationSeconds:o,activeStep:r,nextStep:l,distanceToStep:c,remainingCoordinates:d,closestCoordIndex:p,displayPosition:u,displayCoordIndex:f}=s;a.currentVehiclePos=t,a.lastGpsState=s;const y=u||t,m=Number.isInteger(f)?f:p;S.updateVehiclePosition(y,e,m),S.updateRemainingRoute(d,m),G.setSpeed(n),r&&B.update(r,c,l),M.updateMetrics(i,o),xt(s)}function At(s,t){a.isWaitingForPassenger||(R.playTurnChime(),R.speak(s.instruction))}async function Tt(s,t){if(a.isWaitingForPassenger){g==null||g.finishRerouting();return}if(a.isRecalculating){g==null||g.finishRerouting();return}a.isRecalculating=!0,a.rerouteCount++;let e=!1;console.log(`⚠️ Desvio detectado (${Math.round(t)}m da rota). Recalculando trajeto...`);const n=document.getElementById("reroute-banner");n&&n.classList.add("show"),R.playRerouteChime(),R.speak("Você saiu da rota. Recalculando...",!0);try{const i=[a.currentDestination.lat,a.currentDestination.lng],o=await J(s,i);o&&o.success!==!1?(e=!0,a.activeRouteData=o,S.drawRoute(o.coordinates,o.trafficSections),g.setRoute(o),o.steps.length>0&&(B.update(o.steps[0],o.steps[0].distanceMeters,o.steps[1]),R.speak(o.steps[0].instruction))):E((o==null?void 0:o.message)||"Não foi possível recalcular a rota agora. Uma nova tentativa será feita.")}catch(i){console.error("Falha ao recalcular rota:",i),E("Falha ao recalcular a rota. Uma nova tentativa será feita automaticamente.")}finally{e||g==null||g.finishRerouting(),setTimeout(()=>{n&&n.classList.remove("show"),a.isRecalculating=!1},1200)}}function Dt(s){E(s||"Sinal de GPS indisponível.")}function Lt(){T(),A(!0),R.playArrivalFanfare(),R.speak("Você chegou ao seu destino.",!0)}function Bt(s){const t=R.toggleMute();a.isSoundActive=!t,s&&s.classList.toggle("active",a.isSoundActive)}function nt(s){const t=document.getElementById("fab-recenter");t&&(s?t.classList.remove("visible"):t.classList.add("visible"))}function Ft(){if(!a.currentDestination)return;const s=[a.currentDestination.lat,a.currentDestination.lng],t=`https://waze.com/ul?ll=${s[0]},${s[1]}&navigate=yes`;window.open(t,"_blank")}function zt(){if(!a.currentDestination)return;const s=a.currentVehiclePos||[a.currentDestination.lat,a.currentDestination.lng],t=[a.currentDestination.lat,a.currentDestination.lng],e=`https://www.google.com/maps/dir/?api=1&origin=${s[0]},${s[1]}&destination=${t[0]},${t[1]}&travelmode=driving`;window.open(e,"_blank")}function O(){T(),A(!0),L.setDestination(a.currentDestination),L.show()}function Vt(){w(document.getElementById("btn-resume-waiting"),()=>{V(!0)}),w(document.getElementById("btn-simulator-play"),bt),w(document.getElementById("btn-simulator-pause"),z),w(document.getElementById("btn-simulator-waiting"),Ct),w(document.getElementById("btn-simulator-gps"),It),w(document.getElementById("btn-stationary-no"),()=>{T(),$(),a.stationaryPromptDismissed=!0}),w(document.getElementById("btn-stationary-yes"),()=>{tt(!0)}),w(document.getElementById("btn-open-setup"),()=>{O()}),w(document.getElementById("fab-recenter"),()=>{S.setFollowVehicle(!0),nt(!0),a.currentVehiclePos&&S.map.setView(a.currentVehiclePos,19.3)}),w(document.getElementById("btn-waze-nav"),()=>{Ft()}),w(document.getElementById("btn-google-maps-nav"),()=>{zt()}),w(document.getElementById("btn-offline-retry"),async()=>{N(),U()}),window.addEventListener("offline",()=>{E("Você perdeu a conexão com a internet.")}),window.addEventListener("online",()=>{N(),a.currentVehiclePos&&a.currentDestination&&W(a.currentVehiclePos,a.currentDestination,!1)})}function Nt(){document.documentElement.dataset.appRole="driver";const s=()=>{ut(document.getElementById("app")),document.title="Navegação do Motorista - Sistema de Frotas",Pt()};if(document.readyState==="loading"){window.addEventListener("DOMContentLoaded",s,{once:!0});return}s()}export{Nt as mountDriverApp};
