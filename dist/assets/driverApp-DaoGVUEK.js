import{T as St,D as bt,m as xt,c as C,z as Mt,O as Ct,t as F,d as it,e as $,f as nt,v as It,s as W,l as K,a as _,b as st,g as at,Z as ot,h as J,i as kt,j as x,k as rt,n as lt,o as dt,p as pt,q as mt}from"./demoTrip-7kwugZFo.js";import{a as Rt}from"./index-B6lD49ZG.js";const k=Object.freeze({defaultRoute:bt,deviationThresholdMeters:45,rerouteConfirmationReadings:2,rerouteRetryCooldownMs:5e3,stationaryPromptDelayMs:5*60*1e3,stationarySpeedThresholdKmH:3,waitingResumeSpeedKmH:5,defaultSpeedKmH:50,routeStartArrivalThresholdMeters:60,colors:St});function At(i){if(!i)throw new Error("Elemento raiz da aplicação não encontrado.");i.className="driver-app",i.dataset.roleRoot="driver",i.innerHTML=`
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

      <section class="navigation-simulator" id="navigation-simulator" aria-label="Simulador de navegação" hidden>
        <div class="simulator-header">
          <strong>Simulador</strong>
          <span id="simulator-status">Pronto para simular</span>
        </div>
        <div class="simulator-actions">
          <button type="button" class="simulator-btn play" id="btn-simulator-play">▶ Play</button>
          <button type="button" class="simulator-btn pause" id="btn-simulator-pause">Ⅱ Pausar</button>
          <button type="button" class="simulator-btn waiting" id="btn-simulator-waiting">Testar espera</button>
          <button type="button" class="simulator-btn gps" id="btn-simulator-gps">Reiniciar</button>
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
      </div>

      <button type="button" class="btn-recenter-map" id="fab-recenter" title="Recentralizar no GPS">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
        </svg>
        <span class="recenter-label">Centrar</span>
      </button>

      <div class="speedometer-widget" id="speedometer-widget" title="Clique para mudar velocidade"></div>

      <button type="button" class="btn-waze-nav" id="btn-waze-nav" title="Abrir trajeto no Waze" aria-label="Abrir trajeto no Waze">
        <span class="waze-icon-badge" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 48 48" fill="none">
            <path d="M37.5 19.5c0-8.28-6.72-15-15-15s-15 6.72-15 15c0 3.3.9 6.3 2.7 9l-2.7 7.5 7.8-2.4c2.1 1.2 4.5 1.9 7.2 1.9 8.28 0 15-6.72 15-15z" fill="#33CCFF"/>
            <circle cx="16" cy="18" r="3" fill="#1E224F"/>
            <circle cx="28" cy="18" r="3" fill="#1E224F"/>
            <path d="M19 24c1.5 2 4.5 2 6 0" stroke="#1E224F" stroke-width="2.5" stroke-linecap="round"/>
            <ellipse cx="14" cy="36" rx="3.5" ry="3.5" fill="#1E224F"/>
            <ellipse cx="28" cy="36" rx="3.5" ry="3.5" fill="#1E224F"/>
          </svg>
        </span>
        <span class="badge-tooltip">Abrir no Waze</span>
      </button>

      <button type="button" class="btn-google-maps-nav" id="btn-google-maps-nav" title="Abrir trajeto no Google Maps" aria-label="Abrir trajeto no Google Maps">
        <span class="gmaps-icon-badge" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M24 4C14.06 4 6 12.06 6 22c0 8.07 5.37 14.88 12.75 17.15L24 44l5.25-4.85C36.63 36.88 42 30.07 42 22c0-9.94-8.06-18-18-18z"/>
            <path fill="#34A853" d="M24 4c-9.94 0-18 8.06-18 18 0 4.12 1.39 7.91 3.73 10.95L24 22V4z"/>
            <path fill="#FBBC05" d="M24 4v18l14.27 10.95C40.61 29.91 42 26.12 42 22c0-9.94-8.06-18-18-18z"/>
            <path fill="#EA4335" d="M24 44v-4.85C16.62 36.88 11.25 30.07 11.25 22H6c0 8.07 5.37 14.88 12.75 17.15L24 44z"/>
            <circle fill="#ffffff" cx="24" cy="22" r="7"/>
            <circle fill="#4285F4" cx="24" cy="22" r="4.5"/>
          </svg>
        </span>
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

    <div class="stationary-prompt-overlay" id="trip-finish-prompt" role="dialog" aria-modal="true" aria-labelledby="trip-finish-title" hidden>
      <div class="stationary-prompt-card">
        <h2 id="trip-finish-title">Você deseja finalizar a corrida?</h2>
        <div class="stationary-prompt-actions">
          <button type="button" class="stationary-prompt-btn no" id="btn-finish-no">Não</button>
          <button type="button" class="stationary-prompt-btn yes" id="btn-finish-yes">Sim</button>
        </div>
      </div>
    </div>

    <div class="stationary-prompt-overlay" id="trip-complete-overlay" role="dialog" aria-modal="true" aria-labelledby="trip-complete-title" hidden>
      <div class="stationary-prompt-card trip-complete-card">
        <div class="trip-complete-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 id="trip-complete-title">Viagem concluída!</h2>
        <p>Os dados desta viagem ficarão disponíveis no histórico do aplicativo.</p>
        <button type="button" class="trip-complete-close" id="btn-complete-close">Fechar</button>
      </div>
    </div>
  `}class Lt{constructor(){this.isMuted=!1,this.synth=window.speechSynthesis,this.audioCtx=null,this.lastSpokenText="",this.lastSpokeTime=0}initAudioContext(){if(!this.audioCtx&&(window.AudioContext||window.webkitAudioContext)){const t=window.AudioContext||window.webkitAudioContext;this.audioCtx=new t}}toggleMute(){return this.isMuted=!this.isMuted,this.isMuted&&this.synth&&this.synth.cancel(),this.isMuted}playTone(t=440,e=.15,n="sine"){if(!this.isMuted)try{if(this.initAudioContext(),!this.audioCtx)return;this.audioCtx.state==="suspended"&&this.audioCtx.resume();const a=this.audioCtx.createOscillator(),r=this.audioCtx.createGain();a.type=n,a.frequency.setValueAtTime(t,this.audioCtx.currentTime),r.gain.setValueAtTime(.12,this.audioCtx.currentTime),r.gain.exponentialRampToValueAtTime(.001,this.audioCtx.currentTime+e),a.connect(r),r.connect(this.audioCtx.destination),a.start(),a.stop(this.audioCtx.currentTime+e)}catch(a){console.debug("Audio error:",a)}}playRerouteChime(){this.isMuted||(this.playTone(523.25,.1,"triangle"),setTimeout(()=>this.playTone(659.25,.15,"triangle"),110))}playTurnChime(){this.isMuted||this.playTone(587.33,.1,"sine")}playArrivalFanfare(){if(this.isMuted)return;[523.25,659.25,783.99,1046.5].forEach((e,n)=>{setTimeout(()=>this.playTone(e,.2,"triangle"),n*120)})}speak(t,e=!1){if(this.isMuted||!this.synth)return;const n=Date.now();if(!(!e&&t===this.lastSpokenText&&n-this.lastSpokeTime<8e3)){this.lastSpokenText=t,this.lastSpokeTime=n;try{this.synth.cancel();const a=new SpeechSynthesisUtterance(t);a.lang="pt-BR",a.rate=1.05,a.pitch=1;const o=this.synth.getVoices().find(l=>l.lang.includes("pt-BR")||l.lang.includes("pt_BR"));o&&(a.voice=o),this.synth.speak(a)}catch(a){console.debug("Speech error:",a)}}}}const A=new Lt;class Et{constructor(t={}){this.options=t,this.route=null,this.coordinates=[],this.steps=[],this.currentPosition=null,this.currentBearing=0,this.currentSpeedKmH=0,this.isRerouting=!1,this.activeStepIndex=0,this.routeDistanceMeters=0,this.routeDurationSeconds=0,this.lastSpokenStepIndex=-1,this.closestCoordIndex=0,this.gpsUpdateIntervalMs=1e3,this.offRouteReadings=0,this.lastRerouteAttemptAt=0}setRoute(t){this.route=t,this.coordinates=t.coordinates||[],this.steps=t.steps||[],this.isRerouting=!1,this.lastSpokenStepIndex=-1,this.closestCoordIndex=0,this.activeStepIndex=0,this.routeDistanceMeters=t.distanceMeters||0,this.routeDurationSeconds=t.durationSeconds||0,this.offRouteReadings=0,this.currentPosition&&this.processGpsUpdate(this.currentPosition,this.currentBearing,this.currentSpeedKmH)}processGpsUpdate(t,e,n,a=0){if(!t)return;if(!this.coordinates||this.coordinates.length<2){this.options.onUpdate&&this.options.onUpdate({position:t,bearing:e,speedKmH:n,remainingDistanceMeters:0,remainingDurationSeconds:0,activeStep:null,nextStep:null,distanceToStep:0,remainingCoordinates:[],isOffRoute:!1,distanceFromRouteMeters:0,accuracyMeters:Number(a)||0});return}const r=Math.max(k.deviationThresholdMeters||45,Math.min((Number(a)||0)*1.5,90)),o=xt(t,this.coordinates,r);this.closestCoordIndex=o.closestIndex;const l=this.predictPositionAlongRoute(o.closestPoint,o.closestIndex,n);this.offRouteReadings=o.isOffRoute?this.offRouteReadings+1:0;const c=Date.now(),p=this.offRouteReadings>=(k.rerouteConfirmationReadings||2),v=c-this.lastRerouteAttemptAt>=(k.rerouteRetryCooldownMs||5e3);p&&v&&!this.isRerouting&&(this.isRerouting=!0,this.lastRerouteAttemptAt=c,this.options.onOffRoute?this.options.onOffRoute(t,o.distance):this.isRerouting=!1);let h=0;const m=this.coordinates[this.closestCoordIndex+1]||this.coordinates[this.coordinates.length-1];h+=C(t[0],t[1],m[0],m[1]);for(let B=this.closestCoordIndex+1;B<this.coordinates.length-1;B++)h+=C(this.coordinates[B][0],this.coordinates[B][1],this.coordinates[B+1][0],this.coordinates[B+1][1]);const b=this.routeDistanceMeters>0&&this.routeDurationSeconds>0?Math.round(this.routeDurationSeconds*(h/this.routeDistanceMeters)):0;this.findActiveStepIndex();const y=this.steps[this.activeStepIndex]||this.steps[this.steps.length-1]||null,f=this.steps[this.activeStepIndex+1]||null;let I=0;y&&(I=C(t[0],t[1],y.location[0],y.location[1])),this.activeStepIndex!==this.lastSpokenStepIndex&&y&&(this.lastSpokenStepIndex=this.activeStepIndex,this.options.onStepChange&&this.options.onStepChange(y,I));const L=this.coordinates[this.coordinates.length-1];C(t[0],t[1],L[0],L[1])<30&&this.options.onDestinationReached&&this.options.onDestinationReached();const T=[t,...this.coordinates.slice(this.closestCoordIndex+1)];this.options.onUpdate&&this.options.onUpdate({position:t,bearing:e,speedKmH:n,remainingDistanceMeters:Math.round(h),remainingDurationSeconds:b,activeStep:y,nextStep:f,distanceToStep:Math.round(I),remainingCoordinates:T,closestCoordIndex:this.closestCoordIndex,displayPosition:l.position,displayCoordIndex:l.coordIndex,isOffRoute:o.isOffRoute,distanceFromRouteMeters:Math.round(o.distance),accuracyMeters:Number(a)||0})}findActiveStepIndex(){if(!this.steps||this.steps.length===0)return;let t=this.steps.length-1;for(let e=0;e<this.steps.length;e++)if(this.steps[e].coordIndex>this.closestCoordIndex){t=e;break}this.activeStepIndex=t}predictPositionAlongRoute(t,e,n){if(!t||this.coordinates.length<2)return{position:t,coordIndex:e};const a=Math.min(2,Math.max(.6,this.gpsUpdateIntervalMs/1e3));let r=Math.min(35,Math.max(0,n)/3.6*a),o=t,l=e;for(let c=e+1;c<this.coordinates.length;c++){const p=this.coordinates[c],v=C(o[0],o[1],p[0],p[1]);if(v>0&&r<=v){const h=r/v;return{position:[o[0]+(p[0]-o[0])*h,o[1]+(p[1]-o[1])*h],coordIndex:Math.max(e,c-1)}}if(r-=v,o=p,l=c,r<=0)break}return{position:o,coordIndex:l}}finishRerouting(){this.isRerouting=!1,this.offRouteReadings=0}}const g=Object.freeze({routeSource:"driver-route-source",routeOutline:"driver-route-outline",routeLine:"driver-route-line",trafficSource:"driver-traffic-source",trafficLine:"driver-traffic-line",approachSource:"driver-approach-source",approachLine:"driver-approach-line"});function E(i){return Array.isArray(i)?{lat:Number(i[0]),lng:Number(i[1])}:{lat:Number(i.lat),lng:Number(i.lng)}}class Dt{constructor(t,e={}){this.containerId=t,this.options=e,this.map=null,this.mapLoaded=!1,this.routeCoordinates=[],this.visibleRouteCoordinates=[],this.trafficSections=[],this.visualRouteCoordIndex=0,this.targetRouteCoordIndex=0,this.lastRouteVisualSyncAt=0,this.vehicleMarker=null,this.currentLocationMarker=null,this.approachCoordinates=[],this.originMarker=null,this.destMarker=null,this.stopMarkers=[],this.trafficLegend=null,this.trafficEventsBound=!1,this.isFollowingVehicle=!0,this.currentMapBearing=0,this.smoothedBearing=0,this.vehicleAnimationFrame=null,this.lastVehicleUpdateAt=0,this.navigationPitch=52,this.navigationZoom=18.3}init(t=[-23.507248,-46.653695],e=18){this.map=new Mt({container:this.containerId,style:Ct,center:F(t),zoom:e,pitch:42,bearing:0,attributionControl:!0,maxZoom:20,cooperativeGestures:!1});const n=()=>{var a,r,o;this.mapLoaded||!((r=(a=this.map.getStyle())==null?void 0:a.layers)!=null&&r.length)||(this.mapLoaded=!0,(o=document.getElementById(this.containerId))==null||o.setAttribute("data-map-ready","true"),this.ensureMapLayers(),this.renderRouteLayers(),this.renderApproachLine(),this.map.resize())};return this.map.on("styledata",n),this.map.on("load",n),["dragstart","rotatestart","pitchstart","zoomstart"].forEach(a=>{this.map.on(a,r=>{var o,l;!r.originalEvent||!this.isFollowingVehicle||(this.setFollowVehicle(!1),(l=(o=this.options).onCameraModeChange)==null||l.call(o,!1))})}),it(document.querySelector(".ui-overlay")),this}ensureMapLayers(){this.mapLoaded&&(this.map.getSource(g.routeSource)||this.map.addSource(g.routeSource,{type:"geojson",data:$()}),this.map.getLayer(g.routeOutline)||this.map.addLayer({id:g.routeOutline,type:"line",source:g.routeSource,layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":k.colors.primaryNavy,"line-width":12,"line-opacity":.92}}),this.map.getLayer(g.routeLine)||this.map.addLayer({id:g.routeLine,type:"line",source:g.routeSource,layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":"#4F46E5","line-width":7,"line-opacity":1}}),this.map.getSource(g.trafficSource)||this.map.addSource(g.trafficSource,{type:"geojson",data:nt()}),this.map.getLayer(g.trafficLine)||this.map.addLayer({id:g.trafficLine,type:"line",source:g.trafficSource,layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":["get","color"],"line-width":8,"line-opacity":1}}),this.map.getSource(g.approachSource)||this.map.addSource(g.approachSource,{type:"geojson",data:$()}),this.map.getLayer(g.approachLine)||this.map.addLayer({id:g.approachLine,type:"line",source:g.approachSource,layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":"#38BDF8","line-width":4,"line-opacity":.68,"line-dasharray":[2,2.5]}}),this.trafficEventsBound||(this.trafficEventsBound=!0,this.map.on("mouseenter",g.trafficLine,()=>{this.map.getCanvas().style.cursor="pointer"}),this.map.on("mouseleave",g.trafficLine,()=>{this.map.getCanvas().style.cursor=""}),this.map.on("click",g.trafficLine,t=>{var n,a;const e=(a=(n=t.features)==null?void 0:n[0])==null?void 0:a.properties;e&&new It({closeButton:!1,closeOnClick:!0,offset:8,className:"traffic-map-popup"}).setLngLat(t.lngLat).setDOMContent(this.createTrafficPopup(e)).addTo(this.map)})))}drawRoute(t,e=[]){!Array.isArray(t)||t.length<2||(this.routeCoordinates=t.map(n=>[...n]),this.visibleRouteCoordinates=this.routeCoordinates.map(n=>[...n]),this.trafficSections=(e||[]).map((n,a)=>({...n,id:`traffic-${a}`})).filter(n=>{const a=Number(n.startPointIndex),r=Number(n.endPointIndex);return Number.isInteger(a)&&Number.isInteger(r)&&r>a}),this.visualRouteCoordIndex=0,this.targetRouteCoordIndex=0,this.renderRouteLayers(),this.updateTrafficLegend())}renderRouteLayers(t=null){this.mapLoaded&&(this.ensureMapLayers(),W(this.map,g.routeSource,this.visibleRouteCoordinates.length>=2?K(this.visibleRouteCoordinates):$()),W(this.map,g.trafficSource,nt(this.buildTrafficFeatures(t))))}buildTrafficFeatures(t=null){return this.trafficSections.flatMap(e=>{const n=Math.max(0,Number(e.startPointIndex)),a=Math.min(this.routeCoordinates.length-1,Number(e.endPointIndex));if(a<=this.visualRouteCoordIndex)return[];const r=Math.max(n,this.visualRouteCoordIndex+1),o=this.routeCoordinates.slice(r,a+1);return n<=this.visualRouteCoordIndex&&t&&o.length&&o.unshift(t),o.length<2?[]:[K(o,{id:e.id,color:this.trafficColor(e),simpleCategory:String(e.simpleCategory||""),delayInSeconds:Number(e.delayInSeconds)||0,effectiveSpeedInKmh:Number(e.effectiveSpeedInKmh)||0})]})}trafficColor(t){const e=String(t.simpleCategory||"").toUpperCase(),n=Number(t.delayInSeconds)||0,a=Number(t.magnitudeOfDelay)||0;return e==="ROAD_CLOSURE"?"#7F1D1D":a>=3||n>=600?"#DC2626":a===2||n>=180?"#F97316":"#FACC15"}trafficCategoryLabel(t){return{JAM:"Congestionamento",ROAD_WORK:"Obras na via",ROAD_CLOSURE:"Via interditada",OTHER:"Ocorrência no trânsito"}[String(t||"").toUpperCase()]||"Trânsito lento"}formatTrafficDelay(t){const e=Number(t)||0;return e?e<60?`Atraso de ${e} s`:`Atraso de ${Math.max(1,Math.round(e/60))} min`:"Atraso não informado"}createTrafficPopup(t){const e=document.createElement("div");e.className="traffic-route-popup";const n=document.createElement("strong");n.textContent=this.trafficCategoryLabel(t.simpleCategory),e.appendChild(n);const a=document.createElement("span");if(a.textContent=this.formatTrafficDelay(t.delayInSeconds),e.appendChild(a),Number(t.effectiveSpeedInKmh)>0){const r=document.createElement("span");r.textContent=`Velocidade média: ${Math.round(t.effectiveSpeedInKmh)} km/h`,e.appendChild(r)}return e}updateTrafficLegend(){var t;if(this.map){if(!this.trafficSections.length){(t=this.trafficLegend)==null||t.remove(),this.trafficLegend=null;return}this.trafficLegend||(this.trafficLegend=_("traffic-route-legend",`
      <span><i class="traffic-dot light"></i>Leve</span>
      <span><i class="traffic-dot moderate"></i>Moderado</span>
      <span><i class="traffic-dot heavy"></i>Intenso</span>
    `),it(this.trafficLegend),this.map.getContainer().appendChild(this.trafficLegend))}}updateRemainingRoute(t,e=0){var a;if(!t||t.length<2)return;this.targetRouteCoordIndex=Math.max(this.visualRouteCoordIndex,e);const n=(a=this.vehicleMarker)==null?void 0:a.getLngLat();this.syncRouteToVisualPosition(n?st(n):t[0])}syncRouteToVisualPosition(t){if(!t||this.routeCoordinates.length<2)return;let e=1/0,n=this.visualRouteCoordIndex;const a=Math.max(0,this.visualRouteCoordIndex-3),r=Math.min(this.routeCoordinates.length-1,Math.max(this.targetRouteCoordIndex+25,a+40));for(let o=a;o<=r;o++){const l=this.routeCoordinates[o],c=C(t[0],t[1],l[0],l[1]);c<e&&(e=c,n=o)}this.visualRouteCoordIndex=Math.max(this.visualRouteCoordIndex,n),this.visibleRouteCoordinates=[t,...this.routeCoordinates.slice(this.visualRouteCoordIndex+1)],this.renderRouteLayers(t)}fitRouteBounds(t){const e=at(t);e&&(this.setFollowVehicle(!1),this.map.fitBounds(e,{padding:{top:100,right:40,bottom:100,left:40},maxZoom:18,duration:550,pitch:0,bearing:0}))}createMarker(t,e,n,a={}){const r=_(t,e);return new ot({element:r,anchor:a.anchor||"center",rotationAlignment:a.rotationAlignment||"viewport",pitchAlignment:a.pitchAlignment||"viewport"}).setLngLat(F(n)).addTo(this.map)}setOriginMarker(t){var e;(e=this.originMarker)==null||e.remove(),this.originMarker=this.createMarker("custom-pin-marker maplibre-driver-pin",'<div class="origin-pin-icon"></div>',t)}setDestinationMarker(t){var e;(e=this.destMarker)==null||e.remove(),this.destMarker=this.createMarker("custom-pin-marker maplibre-driver-destination",`<div class="destination-pin-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>`,t)}setStopMarkers(t=[]){this.stopMarkers.forEach(e=>e.remove()),this.stopMarkers=t.map((e,n)=>this.createMarker("custom-pin-marker maplibre-driver-stop",`<div class="route-stop-pin" aria-label="Parada ${n+1}">${n+1}</div>`,[e.lat,e.lng]))}showCurrentLocationApproach(t,e,{fitBounds:n=!1}={}){!t||!e||(this.currentLocationMarker?this.currentLocationMarker.setLngLat(F(t)):this.currentLocationMarker=this.createMarker("custom-pin-marker maplibre-current-location",'<div class="driver-current-location-dot" aria-label="Posição atual do motorista"></div>',t),this.approachCoordinates=[t,e],this.renderApproachLine(),n&&this.fitApproachBounds(t,e))}renderApproachLine(){this.mapLoaded&&(this.ensureMapLayers(),W(this.map,g.approachSource,this.approachCoordinates.length>=2?K(this.approachCoordinates):$()))}fitApproachBounds(t,e){var a,r;const n=at([t,e]);n&&(this.setFollowVehicle(!1),this.map.fitBounds(n,{padding:{top:112,right:48,bottom:150,left:48},maxZoom:16,duration:550,pitch:0,bearing:0}),(r=(a=this.options).onCameraModeChange)==null||r.call(a,!1))}clearCurrentLocationApproach(){var t;(t=this.currentLocationMarker)==null||t.remove(),this.currentLocationMarker=null,this.approachCoordinates=[],this.renderApproachLine()}getRoundedArrowSvg(){return`<svg viewBox="0 0 36 36" class="waze-arrow-svg">
      <path d="M18 4.2 C18.6 4.2 19.2 4.6 19.6 5.2 L30.8 25.2 C31.4 26.3 30.6 27.6 29.4 27.2 L18.6 23.4 C18.2 23.2 17.8 23.2 17.4 23.4 L6.6 27.2 C5.4 27.6 4.6 26.3 5.2 25.2 L16.4 5.2 C16.8 4.6 17.4 4.2 18 4.2 Z" fill="#0084FF" stroke="#FFFFFF" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`}updateSmoothedBearing(t){let e=Number(t)-this.smoothedBearing;return e>180&&(e-=360),e<-180&&(e+=360),Math.abs(e)>3&&(this.smoothedBearing+=e*.15),this.currentMapBearing=Number(t)||0,this.smoothedBearing}followCamera(t,e,n=!0){if(!this.isFollowingVehicle||!this.map)return;const a={center:F(t),bearing:this.updateSmoothedBearing(e),pitch:this.navigationPitch,zoom:this.navigationZoom};n?this.map.jumpTo(a):this.map.easeTo({...a,duration:500,essential:!0})}updateVehiclePosition(t,e=0,n=null){var v;if(!t)return;let a=E(t);const r=performance.now(),o=Number.isInteger(n)&&this.routeCoordinates.length>1;if(o&&(this.targetRouteCoordIndex=Math.max(this.visualRouteCoordIndex,n),this.vehicleMarker)){const h=this.vehicleMarker.getLngLat();if(n<this.visualRouteCoordIndex)a=h;else if(n===this.visualRouteCoordIndex){const m=this.routeSegmentProgress(h,n);this.routeSegmentProgress(a,n)<m&&(a=h)}}if(!this.vehicleMarker){this.smoothedBearing=e,this.currentMapBearing=e;const h=_("custom-pin-marker maplibre-driver-vehicle",`<div class="waze-vehicle-container" id="waze-vehicle-marker-dom">
          <div class="waze-vehicle-shadow"></div>
          <div class="waze-vehicle-arrow-wrapper">${this.getRoundedArrowSvg()}</div>
        </div>`);this.vehicleMarker=new ot({element:h,anchor:"center",rotationAlignment:"map",pitchAlignment:"viewport"}).setLngLat([a.lng,a.lat]).setRotation(e).addTo(this.map),this.lastVehicleUpdateAt=r,this.followCamera([a.lat,a.lng],e);return}const l=this.lastVehicleUpdateAt?r-this.lastVehicleUpdateAt:1e3;this.lastVehicleUpdateAt=r;const p=((v=window.matchMedia)==null?void 0:v.call(window,"(prefers-reduced-motion: reduce)").matches)?0:Math.min(2800,Math.max(450,l*.92));this.animateVehicleTo(a,p,o?this.targetRouteCoordIndex:null,e)}updateVehicleArrow(t){var e;(e=this.vehicleMarker)==null||e.setRotation(Number.isFinite(t)?t:this.currentMapBearing)}routeSegmentProgress(t,e){const n=this.routeCoordinates[e],a=this.routeCoordinates[e+1];if(!n||!a)return 1;const r=E(t),o=a[0]-n[0],l=a[1]-n[1],c=o*o+l*l;if(!c)return 1;const p=((r.lat-n[0])*o+(r.lng-n[1])*l)/c;return Math.max(0,Math.min(1,p))}createVehicleAnimationPath(t,e,n){if(!Number.isInteger(n)||this.routeCoordinates.length<2)return[E(t),E(e)];const a=Math.min(this.routeCoordinates.length-1,n),r=[E(t)];for(let c=this.visualRouteCoordIndex+1;c<=a;c++)r.push(E(this.routeCoordinates[c]));const o=E(e),l=r[r.length-1];return C(l.lat,l.lng,o.lat,o.lng)>.3&&r.push(o),r}animateVehicleTo(t,e,n=null,a=0){if(!this.vehicleMarker)return;this.vehicleAnimationFrame&&cancelAnimationFrame(this.vehicleAnimationFrame);const r=this.vehicleMarker.getLngLat(),o=this.createVehicleAnimationPath(r,t,n),l=[];let c=0;for(let m=0;m<o.length-1;m++){const b=o[m],y=o[m+1],f=C(b.lat,b.lng,y.lat,y.lng);f<=0||(l.push({start:b,end:y,distance:f,offset:c}),c+=f)}const p=E(t);if(e<=0||c<.5||!l.length){this.vehicleMarker.setLngLat([p.lng,p.lat]),Number.isInteger(n)||this.updateVehicleArrow(a),this.followCamera([p.lat,p.lng],a),this.vehicleAnimationFrame=null;return}const v=performance.now(),h=m=>{const b=Math.min(1,(m-v)/e),y=c*b,f=l.find(T=>y<=T.offset+T.distance)||l[l.length-1],I=Math.min(1,Math.max(0,(y-f.offset)/f.distance)),L=f.start.lat+(f.end.lat-f.start.lat)*I,P=f.start.lng+(f.end.lng-f.start.lng)*I;if(this.vehicleMarker.setLngLat([P,L]),m-this.lastRouteVisualSyncAt>=80||b===1){this.lastRouteVisualSyncAt=m;const T=J(f.start.lat,f.start.lng,f.end.lat,f.end.lng);this.updateVehicleArrow(T),Number.isInteger(n)&&this.syncRouteToVisualPosition([L,P]),this.followCamera([L,P],T)}b<1?this.vehicleAnimationFrame=requestAnimationFrame(h):this.vehicleAnimationFrame=null};this.vehicleAnimationFrame=requestAnimationFrame(h)}setView(t,e=this.navigationZoom,{animate:n=!1}={}){const a={center:F(t),zoom:e};n?this.map.easeTo({...a,duration:500,essential:!0}):this.map.jumpTo(a)}setFollowVehicle(t){if(this.isFollowingVehicle=t,t&&this.vehicleMarker){const e=st(this.vehicleMarker.getLngLat());this.map.easeTo({center:F(e),zoom:this.navigationZoom,pitch:this.navigationPitch,bearing:this.currentMapBearing,duration:500,essential:!0})}}}class Pt{constructor(t,e={}){this.container=document.getElementById(t),this.options=e,this.currentStep=null,this.nextStep=null,this.distanceToStep=0}getManeuverSvg(t){switch(t){case"corner-up-right":return`
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
      `,this.bindEvents();return}const t=kt(this.distanceToStep),e=this.currentStep.rawName||this.currentStep.instruction,n=this.getManeuverSvg(this.currentStep.icon);this.container.innerHTML=`
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
    `,this.bindEvents()}bindEvents(){const t=this.container.querySelector("#top-btn-sound");t&&this.options.onToggleSound&&x(t,()=>{this.options.onToggleSound(t)})}}class Tt{constructor(t,e={}){this.container=document.getElementById(t),this.options=e,this.currentSpeed=null,this.speedLimit=e.speedLimit||null}init(){this.render()}setSpeed(t){t==null||isNaN(t)?this.currentSpeed=null:this.currentSpeed=Math.max(0,Math.round(t)),this.updateGauge()}setSpeedLimit(t){this.speedLimit=t&&t>0?t:null,this.updateGauge()}updateGauge(){if(!this.container)return;if(this.currentSpeed===null){this.container.style.display="none";return}this.container.style.display="flex";const t=this.container.querySelector(".speedometer-val"),e=this.container.querySelector(".speedometer-ring-fill"),n=this.container.querySelector(".speed-limit-badge");if(t&&(t.textContent=this.currentSpeed),n&&(this.speedLimit?(n.style.display="flex",n.textContent=this.speedLimit):n.style.display="none"),e){const o=188-Math.min(1,this.currentSpeed/120)*188;e.style.strokeDashoffset=o,this.speedLimit&&this.currentSpeed>this.speedLimit?e.style.stroke="var(--action-red)":e.style.stroke="var(--accent-cyan)"}}render(){this.container&&(this.container.innerHTML=`
      <svg class="speedometer-ring-svg" viewBox="0 0 70 70">
        <circle class="speedometer-ring-bg" cx="35" cy="35" r="30" />
        <circle class="speedometer-ring-fill" cx="35" cy="35" r="30" />
      </svg>
      <div class="speed-limit-badge" style="display: ${this.speedLimit?"flex":"none"};">${this.speedLimit||""}</div>
      <span class="speedometer-val">${this.currentSpeed!==null?this.currentSpeed:"--"}</span>
      <span class="speedometer-unit">km/h</span>
    `,this.currentSpeed===null&&(this.container.style.display="none"),this.container&&x(this.container,()=>{this.options.onClick&&this.options.onClick()}))}}function ct(i){return String(i||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}class Bt{constructor(t,e={}){this.container=document.getElementById(t),this.options=e,this.status="transit",this.waitingMinutes=10,this.originName="Rod PR-340 - km 2.5, Jaguapitã",this.destName="Aeroporto de Londrina",this.remainingDistance=0,this.remainingDuration=0,this.isExpanded=!1,this.isDragging=!1,this.startY=0,this.currentTranslateY=0,this.dragCleanup=null}setRouteInfo(t,e){this.originName=t,this.destName=e,this.render()}setStatus(t,e=10){this.status=t,this.waitingMinutes=e,this.render()}toggleExpand(){this.setExpanded(!this.isExpanded)}setExpanded(t){if(this.isExpanded=t,this.container){this.container.classList.toggle("collapsed",!this.isExpanded),this.container.style.transform="",this.container.style.maxHeight="",this.container.style.removeProperty("--sheet-drag-progress"),this.container.classList.remove("dragging");const e=document.querySelector(".ui-overlay");e&&e.classList.toggle("sheet-expanded",this.isExpanded)}}updateMetrics(t,e){this.remainingDistance=t,this.remainingDuration=e;const n=rt(this.remainingDuration),a=lt(this.remainingDuration),r=dt(this.remainingDistance),o=document.getElementById("waze-compact-eta-val"),l=document.getElementById("waze-compact-dur"),c=document.getElementById("waze-compact-dist");o&&(o.textContent=n),l&&(l.textContent=a),c&&(c.textContent=r);const p=document.getElementById("exp-metric-eta"),v=document.getElementById("exp-metric-time"),h=document.getElementById("exp-metric-dist");p&&(p.textContent=n),v&&(v.textContent=a),h&&(h.textContent=r)}render(){if(!this.container)return;this.container.classList.toggle("collapsed",!this.isExpanded);const t=document.querySelector(".ui-overlay");t&&t.classList.toggle("sheet-expanded",this.isExpanded);const e=this.status==="waiting",n=this.status==="paused"||e?"Corrida em pausa":"Corrida em andamento",a=rt(this.remainingDuration),r=lt(this.remainingDuration),o=dt(this.remainingDistance);this.container.innerHTML=`
      <!-- Puxador de Arrasto -->
      <div class="sheet-drag-handle-container" id="sheet-drag-handle">
        <div class="sheet-drag-handle"></div>
      </div>

      <!-- 1. BARRA RETRAÍDA: APENAS INFORMAÇÃO CENTRAL -->
      <div class="waze-compact-bar" id="waze-compact-bar">
        <div class="waze-compact-center">
          <span class="waze-compact-eta" id="waze-compact-eta-val">${a}</span>
          <div class="waze-compact-sub">
            <span id="waze-compact-dur">${r}</span>
            <span class="dot-sep"></span>
            <span id="waze-compact-dist">${o}</span>
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
              <span class="timeline-point-name">${ct(this.originName)}</span>
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
              <span class="timeline-point-name">${ct(this.destName)}</span>
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
            <span class="metric-val" id="exp-metric-eta">${a}</span>
            <span class="metric-lbl">Chegada</span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric-item">
            <span class="metric-val" id="exp-metric-time">${r}</span>
            <span class="metric-lbl">Tempo</span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric-item">
            <span class="metric-val" id="exp-metric-dist">${o}</span>
            <span class="metric-lbl">Distância</span>
          </div>
        </div>
      </div>
    `,this.bindEvents()}bindEvents(){const t=document.getElementById("waze-compact-bar");document.getElementById("sheet-drag-handle");const e=document.getElementById("btn-ride-collapse"),n=document.getElementById("btn-toggle-status");t&&x(t,()=>{this.hasDragged||this.toggleExpand()}),e&&x(e,()=>this.setExpanded(!1)),n&&x(n,()=>{const a=this.status==="waiting"?"transit":"waiting";this.options.controlledStatus||this.setStatus(a),this.options.onStatusChange&&this.options.onStatusChange(a)}),this.setupDragGestures(this.container)}setupDragGestures(t){if(!t)return;this.dragCleanup&&this.dragCleanup();let e=0,n=0,a=0,r=108,o=0,l=null;this.hasDragged=!1;const c=h=>{var m;l!==null||h.button!==void 0&&h.button!==0||(l=h.pointerId,this.hasDragged=!1,e=h.clientY,n=e,r=Math.min(108,t.scrollHeight),o=Math.max(r,Math.min(t.scrollHeight,window.innerHeight*.85)),a=t.getBoundingClientRect().height,(m=t.setPointerCapture)==null||m.call(t,h.pointerId),t.classList.add("dragging"),t.style.transition="none",t.style.maxHeight=`${a}px`,t.style.setProperty("--sheet-drag-progress",this.isExpanded?"1":"0"))},p=h=>{if(h.pointerId!==l)return;h.cancelable&&h.preventDefault(),n=h.clientY;const m=n-e;Math.abs(m)>8&&(this.hasDragged=!0);const b=Math.min(o,Math.max(r,a-m)),y=Math.max(1,o-r),f=(b-r)/y;t.style.maxHeight=`${b}px`,t.style.setProperty("--sheet-drag-progress",f.toFixed(3))},v=h=>{var P;if(h.pointerId!==l)return;(P=t.releasePointerCapture)==null||P.call(t,l),l=null;const m=n-e,b=t.getBoundingClientRect().height,y=Math.max(1,o-r),f=(b-r)/y,I=Math.abs(m)>24?m<0:f>=.5;this.isExpanded=I,t.classList.toggle("collapsed",!I);const L=document.querySelector(".ui-overlay");L&&L.classList.toggle("sheet-expanded",I),t.style.transition="max-height 0.28s cubic-bezier(0.16, 1, 0.3, 1)",t.style.maxHeight=`${b}px`,t.style.setProperty("--sheet-drag-progress",I?"1":"0"),t.offsetHeight,t.style.maxHeight=`${I?o:r}px`,window.setTimeout(()=>{t.classList.remove("dragging"),t.style.transition="",t.style.maxHeight="",t.style.removeProperty("--sheet-drag-progress")},300)};t.addEventListener("pointerdown",c),window.addEventListener("pointermove",p),window.addEventListener("pointerup",v),window.addEventListener("pointercancel",v),this.dragCleanup=()=>{t.removeEventListener("pointerdown",c),window.removeEventListener("pointermove",p),window.removeEventListener("pointerup",v),window.removeEventListener("pointercancel",v)}}}const s={currentDestination:null,navigationDestination:null,currentVehiclePos:null,routeStart:null,routeStartReached:!1,approachVisualShown:!1,activeRouteData:null,isRecalculating:!1,rerouteCount:0,isSoundActive:!0,userCurrentGps:null,stationarySince:null,stationaryAnchor:null,stationaryTimeoutId:null,stationaryPromptDismissed:!1,lastGpsState:null,isWaitingForPassenger:!1,waitingStartedAt:null,waitingAnchor:null,lastWaitingMinute:-1,routeVersion:0,latestVehicleTimestamp:0,tripStatus:"in_progress",pendingCommands:new Map,arrivalPromptShown:!1,arrivalPromptDismissedUntil:0},u={enabled:!1,isPlaying:!1,timerId:null,position:null,coordIndex:0,speedKmH:45,tickMs:700};let w,U,Z,M,d,S,R=!1;function z(i,t="Dispositivo offline"){const e=document.getElementById("offline-alert-banner"),n=document.getElementById("offline-banner-text"),a=e==null?void 0:e.querySelector(".offline-banner-title");a&&(a.textContent=t),n&&i&&(n.textContent=i),e&&e.classList.add("show")}function N(){const i=document.getElementById("offline-alert-banner");i&&i.classList.remove("show")}function D(){const i=document.getElementById("stationary-prompt");i&&(i.hidden=!0)}function gt(){if(s.isWaitingForPassenger||s.stationaryPromptDismissed)return;const i=document.getElementById("stationary-prompt");i&&(i.hidden=!1),A.speak("Você está aguardando o passageiro?",!0)}function X(){s.stationaryTimeoutId!==null&&(window.clearTimeout(s.stationaryTimeoutId),s.stationaryTimeoutId=null)}function V(i=!0){X(),s.stationarySince=null,s.stationaryAnchor=null,i&&(s.stationaryPromptDismissed=!1)}function ft(i){return!!(s.activeRouteData&&!i.isOffRoute&&i.remainingDistanceMeters>40)}function Ft(){X();const i=Date.now()-s.stationarySince,t=Math.max(0,k.stationaryPromptDelayMs-i);s.stationaryTimeoutId=window.setTimeout(()=>{s.stationaryTimeoutId=null;const e=s.lastGpsState;e&&s.stationarySince&&Date.now()-s.stationarySince>=k.stationaryPromptDelayMs&&ft(e)&&e.speedKmH<=k.stationarySpeedThresholdKmH&&gt()},t)}function vt(i=!0){D(),V(!1),s.isWaitingForPassenger=!0,s.waitingStartedAt=Date.now(),s.waitingAnchor=s.currentVehiclePos?[...s.currentVehiclePos]:null,s.lastWaitingMinute=0,M==null||M.setStatus("waiting",0),Q(0),i&&A.speak("Corrida pausada. Aguardando o passageiro.",!0)}function yt(){if(!R){vt(!0);return}D();const i=S==null?void 0:S.send("waiting.confirmed",{});i&&s.pendingCommands.set(i,"waiting.confirmed")}function Q(i){const t=document.getElementById("waiting-mode-card"),e=document.getElementById("waiting-mode-duration"),n=document.querySelector(".ui-overlay");t&&(t.hidden=!1),e&&(e.textContent=i>0?`Aguardando passageiro · ${i} min`:"Aguardando passageiro · iniciado agora"),n==null||n.classList.add("passenger-waiting")}function zt(){const i=document.getElementById("waiting-mode-card"),t=document.querySelector(".ui-overlay");i&&(i.hidden=!0),t==null||t.classList.remove("passenger-waiting")}function G(i=!0){const t=s.isWaitingForPassenger;s.isWaitingForPassenger=!1,s.waitingStartedAt=null,s.waitingAnchor=null,s.lastWaitingMinute=-1,D(),V(!0),M==null||M.setStatus("transit"),zt(),i&&t&&A.speak("Corrida retomada.",!0)}function tt(){if(!R){G(!0);return}if([...s.pendingCommands.values()].includes("waiting.resumeRequested"))return;const i=S==null?void 0:S.send("waiting.resumeRequested",{});i&&s.pendingCommands.set(i,"waiting.resumeRequested")}function Vt(i){const t=Number(i.speedKmH)||0,e=Math.max(20,Math.min((Number(i.accuracyMeters)||0)*1.5,40));if(s.isWaitingForPassenger){const r=s.waitingAnchor?C(s.waitingAnchor[0],s.waitingAnchor[1],i.position[0],i.position[1]):0;if(t>=k.waitingResumeSpeedKmH||r>=e){tt();return}const o=Math.floor((Date.now()-s.waitingStartedAt)/6e4);o!==s.lastWaitingMinute&&(s.lastWaitingMinute=o,M.setStatus("waiting",o),Q(o));return}if(!ft(i)){D(),V(!0);return}const n=s.stationaryAnchor?C(s.stationaryAnchor[0],s.stationaryAnchor[1],i.position[0],i.position[1]):0;if(t>k.stationarySpeedThresholdKmH||n>=e){D(),V(!0);return}s.stationarySince||(s.stationarySince=Date.now(),s.stationaryAnchor=[...i.position],Ft())}function O(i){const t=document.getElementById("simulator-status"),e=document.getElementById("btn-simulator-play"),n=document.getElementById("btn-simulator-pause"),a=document.getElementById("btn-simulator-gps");t&&(t.textContent=i),e&&(e.disabled=u.isPlaying),n&&(n.disabled=!u.enabled||!u.isPlaying),a&&(a.disabled=!u.enabled)}function Nt(i,t){if(!i||!(t!=null&&t.length))return 0;let e=0,n=1/0;return t.forEach((a,r)=>{const o=C(i[0],i[1],a[0],a[1]);o<n&&(n=o,e=r)}),e}function Ot(i){var r;const t=((r=s.activeRouteData)==null?void 0:r.coordinates)||[];if(!t.length||!u.position)return null;let e=u.position,n=u.coordIndex,a=i;for(let o=n+1;o<t.length;o++){const l=t[o],c=C(e[0],e[1],l[0],l[1]);if(c>0&&a<=c){const p=a/c;return u.coordIndex=Math.max(n,o-1),[e[0]+(l[0]-e[0])*p,e[1]+(l[1]-e[1])*p]}a-=c,e=l,n=o,u.coordIndex=o}return t[t.length-1]}function wt(){var t;const i=(t=s.activeRouteData)==null?void 0:t.coordinates;return i!=null&&i.length?(u.enabled||(u.enabled=!0,u.coordIndex=Nt(s.currentVehiclePos,i),u.position=[...i[u.coordIndex]],d.currentPosition=[...u.position],d.gpsUpdateIntervalMs=u.tickMs),!0):(alert("Calcule uma rota antes de iniciar o simulador."),!1)}function Ht(){!wt()||u.isPlaying||(u.isPlaying=!0,O("Em movimento"),u.timerId=window.setInterval(()=>{const i=u.position,t=u.speedKmH/3.6*(u.tickMs/1e3),e=Ot(t);if(!e||!i){H();return}if(C(i[0],i[1],e[0],e[1])<.2){H(),O("Fim da rota");return}const a=J(i[0],i[1],e[0],e[1]);u.position=e,d.currentPosition=[...e],d.currentBearing=a,d.currentSpeedKmH=u.speedKmH,d.processGpsUpdate(e,a,u.speedKmH,3)},u.tickMs))}function H(){u.timerId!==null&&(window.clearInterval(u.timerId),u.timerId=null),u.isPlaying=!1,O(u.enabled?"Parado":"Pronto para simular"),u.enabled&&u.position&&(d.currentSpeedKmH=0,d.processGpsUpdate(u.position,d.currentBearing,0,3))}function $t(){wt()&&(H(),s.stationaryPromptDismissed=!1,s.stationarySince=Date.now()-k.stationaryPromptDelayMs,s.stationaryAnchor=[...u.position],gt())}function Ut(){var i;H(),u.enabled=!1,u.position=null,u.coordIndex=0,s.isWaitingForPassenger&&G(!1),V(!0),s.tripStatus="in_progress",s.currentVehiclePos=null,s.routeStart=null,s.routeStartReached=!1,s.approachVisualShown=!1,w.clearCurrentLocationApproach(),s.arrivalPromptShown=!1,s.arrivalPromptDismissedUntil=0,s.routeVersion=0,s.latestVehicleTimestamp=0,d.currentPosition=null,(i=document.getElementById("trip-complete-overlay"))==null||i.setAttribute("hidden",""),j(mt,{initial:!0}),q(pt()),O("Pronto para simular")}function jt(){const i=document.getElementById("navigation-simulator");i&&(i.hidden=R),O(R?"Posição do aplicativo":"Pronto para simular")}async function qt(i={}){S=i.tripBridge,R=!!(S!=null&&S.isEmbedded()),document.documentElement.dataset.runtime=R?"flutter":"standalone";const t=k.defaultRoute.destination;s.currentDestination=t;const e=[t.lat,t.lng];w=new Dt("map-container",{onCameraModeChange:n=>et(n)}),w.init(e,19.3),U=new Pt("waze-top-bar",{onToggleSound:n=>Qt(n)}),U.render(),Z=new Tt("speedometer-widget",{speedLimit:null}),Z.init(),M=new Bt("ride-bottom-sheet",{controlledStatus:R,onStatusChange:n=>{n==="waiting"?yt():tt()}}),M.setRouteInfo("Minha Localização Atual (GPS)",s.currentDestination.name||"Destino Selecionado"),d=new Et({onUpdate:n=>_t(n),onOffRoute:(n,a)=>Yt(n,a),onStepChange:(n,a)=>Zt(n),onDestinationReached:()=>Jt()}),ee(),jt(),R?(Gt(),S.subscribe(Kt),z("Sincronizando rota e posição do veículo…","Carregando corrida")):(j(mt,{initial:!0}),q(pt()),N())}function Gt(){var i;(i=document.getElementById("navigation-simulator"))==null||i.setAttribute("hidden","")}function Wt(i){return{id:i.id,name:i.label,address:i.label,lat:i.lat,lng:i.lng}}function j(i,{initial:t=!1}={}){if(i.version<=s.routeVersion)return!1;const e=Rt(i);s.routeVersion=i.version,s.activeRouteData=e,s.currentDestination=Wt(i.destination),s.navigationDestination={...i.destination},s.arrivalPromptShown=!1,s.arrivalPromptDismissedUntil=0;const n=[i.origin.lat,i.origin.lng],a=[i.destination.lat,i.destination.lng];if(s.routeStart=n,t&&(s.routeStartReached=!1,s.approachVisualShown=!1,w.clearCurrentLocationApproach()),w.drawRoute(e.coordinates,e.trafficSections),w.setOriginMarker(n),w.setDestinationMarker(a),w.setStopMarkers(i.stops),d.setRoute(e),M.setRouteInfo(i.origin.label,i.destination.label),M.updateMetrics(e.distanceMeters,e.durationSeconds),e.steps.length&&U.update(e.steps[0],e.steps[0].distanceMeters,e.steps[1]),t&&!s.currentVehiclePos){const r=e.coordinates[1]||a,o=J(n[0],n[1],r[0],r[1]);d.currentBearing=o,w.updateVehiclePosition(n,o,0),w.setView(n,16)}return s.activeRouteData.stops=i.stops,!0}function q(i){const t=Date.parse(i.timestamp);if(!Number.isFinite(t)||t<=s.latestVehicleTimestamp)return;const e=s.latestVehicleTimestamp;s.latestVehicleTimestamp=t;const n=[i.lat,i.lng],a=Math.max(0,Number(i.speed)||0)*3.6,r=Number(i.heading),o=a>=8&&Number.isFinite(r)?r:Number(d.currentBearing)||0;if(s.userCurrentGps=n,s.routeStart&&!s.routeStartReached){const l=C(n[0],n[1],s.routeStart[0],s.routeStart[1]),c=Math.max(0,Number(i.accuracy)||0),p=Math.max(k.routeStartArrivalThresholdMeters,Math.min(c*1.5,100));if(l>p){w.showCurrentLocationApproach(n,s.routeStart,{fitBounds:!s.approachVisualShown}),s.approachVisualShown=!0;return}s.routeStartReached=!0,s.approachVisualShown=!1,w.clearCurrentLocationApproach(),w.setFollowVehicle(!0),et(!0)}s.currentVehiclePos||(s.currentVehiclePos=n,w.updateVehiclePosition(n,o),w.setView(n,19.3)),e&&(d.gpsUpdateIntervalMs=Math.min(2500,Math.max(400,t-e))),d.currentPosition=n,d.currentBearing=o,d.currentSpeedKmH=a,d.processGpsUpdate(n,o,a,Math.max(0,Number(i.accuracy)||0))}function ut(i,t=!1){if(i.active){const e=s.isWaitingForPassenger;vt(t&&!e),s.waitingStartedAt=i.startedAt?Date.parse(i.startedAt):Date.now();const n=Math.max(0,Math.floor((Date.now()-s.waitingStartedAt)/6e4));s.lastWaitingMinute=n,M==null||M.setStatus("waiting",n),Q(n)}else G(t)}function Y(i){var t;if(s.tripStatus=i,i==="finished"||i==="completed"){D(),G(!1),M==null||M.setStatus("paused"),N(),(t=document.getElementById("trip-finish-prompt"))==null||t.setAttribute("hidden","");const e=document.getElementById("trip-complete-overlay");e&&(e.hidden=!1)}}function Kt(i){var n,a,r;const{type:t,payload:e}=i;if(t==="trip.bootstrap"){if(e.role!=="driver"){z("Os dados recebidos não pertencem à visão do motorista.");return}j(e.route,{initial:!0}),e.vehiclePosition&&q(e.vehiclePosition),ut(e.waiting,!1),Y(e.tripStatus),e.tripStatus!=="finished"&&e.tripStatus!=="completed"&&N()}else if(t==="vehicle.location")q(e);else if(t==="route.replaced")j(e)&&(s.isRecalculating=!1,d==null||d.finishRerouting(),(n=document.getElementById("reroute-banner"))==null||n.classList.remove("show"),N());else if(t==="waiting.changed")ut(e,!0);else if(t==="trip.statusChanged")Y(e.tripStatus);else if(t==="connection.changed")e.connected?N():z("A posição será sincronizada quando a internet voltar.","Sem conexão");else if(t==="command.succeeded")s.pendingCommands.delete(e.commandEventId),e.commandType==="route.rerouteRequested"&&(s.isRecalculating=!1,d==null||d.finishRerouting(),(a=document.getElementById("reroute-banner"))==null||a.classList.remove("show"));else if(t==="command.failed"){if(s.pendingCommands.delete(e.commandEventId),e.commandType==="route.rerouteRequested"&&(s.isRecalculating=!1,d==null||d.finishRerouting(),(r=document.getElementById("reroute-banner"))==null||r.classList.remove("show")),e.commandType==="trip.finishRequested"){const o=document.getElementById("trip-finish-prompt");o&&(o.hidden=!1)}z(e.reason||"Não foi possível executar a ação.","Falha ao atualizar a corrida")}}function _t(i){const{position:t,bearing:e,speedKmH:n,remainingDistanceMeters:a,remainingDurationSeconds:r,activeStep:o,nextStep:l,distanceToStep:c,remainingCoordinates:p,closestCoordIndex:v,displayPosition:h,displayCoordIndex:m}=i;s.currentVehiclePos=t,s.lastGpsState=i;const b=h||t,y=Number.isInteger(m)?m:v;w.updateVehiclePosition(b,e,y),w.updateRemainingRoute(p,y),Z.setSpeed(n),o&&U.update(o,c,l),M.updateMetrics(a,r),Vt(i)}function Zt(i,t){s.isWaitingForPassenger||(A.playTurnChime(),A.speak(i.instruction))}async function Yt(i,t){var n,a,r;if(s.isWaitingForPassenger){d==null||d.finishRerouting();return}if(s.isRecalculating){d==null||d.finishRerouting();return}s.isRecalculating=!0,s.rerouteCount++;const e=document.getElementById("reroute-banner");if(R){console.log(`⚠️ Desvio detectado (${Math.round(t)}m da rota). Solicitando novo trajeto...`),e==null||e.classList.add("show"),A.playRerouteChime(),A.speak("Você saiu da rota. Recalculando...",!0);const o=S==null?void 0:S.send("route.rerouteRequested",{deviationDistanceMeters:Math.max(0,Math.round(t)),position:{lat:i[0],lng:i[1],accuracy:Number((n=s.lastGpsState)==null?void 0:n.accuracyMeters)||0,speed:(Number((a=s.lastGpsState)==null?void 0:a.speedKmH)||0)/3.6,heading:Number((r=s.lastGpsState)==null?void 0:r.bearing)||0,timestamp:new Date().toISOString()}});o?s.pendingCommands.set(o,"route.rerouteRequested"):(s.isRecalculating=!1,d==null||d.finishRerouting(),e==null||e.classList.remove("show"),z("Não foi possível solicitar o recálculo ao aplicativo."));return}d==null||d.finishRerouting(),s.isRecalculating=!1,e==null||e.classList.remove("show")}function Jt(){if(s.arrivalPromptShown||Date.now()<s.arrivalPromptDismissedUntil||s.tripStatus==="finished"||s.tripStatus==="completed")return;s.arrivalPromptShown=!0,D(),V(!0),A.playArrivalFanfare(),A.speak("Você chegou ao seu destino.",!0);const i=document.getElementById("trip-finish-prompt");i&&(i.hidden=!1)}function Xt(){const i=document.getElementById("trip-finish-prompt");if(i&&(i.hidden=!0),!R){Y("finished");return}const t=S==null?void 0:S.send("trip.finishRequested",{});t?s.pendingCommands.set(t,"trip.finishRequested"):(i&&(i.hidden=!1),z("Não foi possível solicitar o encerramento.","Falha ao finalizar"))}function Qt(i){const t=A.toggleMute();s.isSoundActive=!t,i&&i.classList.toggle("active",s.isSoundActive)}function te(i){var e;const t=s.navigationDestination;return t?{provider:i,destination:{id:String(t.id),sequence:Number.isInteger(t.sequence)?t.sequence:0,kind:"destination",label:t.label||((e=s.currentDestination)==null?void 0:e.name)||"Destino",lat:Number(t.lat),lng:Number(t.lng)},...s.userCurrentGps?{origin:{lat:s.userCurrentGps[0],lng:s.userCurrentGps[1]}}:{}}:null}function ht(i){const t=te(i);if(!t)return;if(R){S==null||S.send("external.navigationRequested",t);return}const e=`${t.destination.lat},${t.destination.lng}`,n=i==="waze"?`https://waze.com/ul?ll=${encodeURIComponent(e)}&navigate=yes`:`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(e)}&travelmode=driving${t.origin?`&origin=${encodeURIComponent(`${t.origin.lat},${t.origin.lng}`)}`:""}`;window.open(n,"_blank","noopener,noreferrer")}function et(i){const t=document.getElementById("fab-recenter");t&&(i?t.classList.remove("visible"):t.classList.add("visible"))}function ee(){x(document.getElementById("btn-resume-waiting"),()=>{tt()}),x(document.getElementById("btn-simulator-play"),Ht),x(document.getElementById("btn-simulator-pause"),H),x(document.getElementById("btn-simulator-waiting"),$t),x(document.getElementById("btn-simulator-gps"),Ut),x(document.getElementById("btn-stationary-no"),()=>{D(),X(),s.stationaryPromptDismissed=!0}),x(document.getElementById("btn-stationary-yes"),()=>{yt()}),x(document.getElementById("btn-finish-no"),()=>{const i=document.getElementById("trip-finish-prompt");i&&(i.hidden=!0),s.arrivalPromptShown=!1,s.arrivalPromptDismissedUntil=Date.now()+6e4}),x(document.getElementById("btn-finish-yes"),Xt),x(document.getElementById("btn-complete-close"),()=>{const i=document.getElementById("trip-complete-overlay");i&&(i.hidden=!0)}),x(document.getElementById("fab-recenter"),()=>{if(!s.routeStartReached&&s.userCurrentGps&&s.routeStart){w.fitApproachBounds(s.userCurrentGps,s.routeStart);return}w.setFollowVehicle(!0),et(!0),s.currentVehiclePos&&w.setView(s.currentVehiclePos,19.3,{animate:!0})}),x(document.getElementById("btn-waze-nav"),()=>{ht("waze")}),x(document.getElementById("btn-google-maps-nav"),()=>{ht("google_maps")})}function se(i={}){document.documentElement.dataset.appRole="driver";const t=async()=>{At(document.getElementById("app")),document.title="Navegação do Motorista - Sistema de Frotas",await qt(i)};return document.readyState==="loading"?new Promise((e,n)=>{window.addEventListener("DOMContentLoaded",()=>t().then(e,n),{once:!0})}):t()}export{se as mountDriverApp};
