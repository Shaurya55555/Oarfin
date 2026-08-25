import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import {
  MapContainer, TileLayer, Marker, Popup,
  Circle, Rectangle, LayersControl, useMapEvents, useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import DisasterFilter from "./DisasterFilter";
import SafeSpotMarker from "./SafeSpotMarker";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
const DISASTER_TYPES = ["EQ","FL","TC","VO","DR","WF"];
const DAY_OPTIONS = [1,3,5,7,14,30];
const safeSpotIcon = new L.Icon({ iconUrl:"https://cdn-icons-png.flaticon.com/512/2776/2776067.png", iconSize:[25,41], iconAnchor:[12,41], popupAnchor:[1,-34], shadowSize:[41,41] });
const ICON_MAP = { EQ:"https://cdn-icons-png.flaticon.com/512/1840/1840485.png", FL:"https://cdn-icons-png.flaticon.com/512/1840/1840525.png", TC:"https://cdn-icons-png.flaticon.com/512/1840/1840491.png", VO:"https://cdn-icons-png.flaticon.com/512/1840/1840506.png", DR:"https://cdn-icons-png.flaticon.com/512/1840/1840489.png", WF:"https://cdn-icons-png.flaticon.com/512/1840/1840524.png" };
const getIcon = (t) => ICON_MAP[t] || "https://cdn-icons-png.flaticon.com/512/184/184525.png";
const CATEGORY_LABELS = { shelter:"Shelters", hospital:"Hospitals", clinic:"Clinics", nursing_home:"Nursing Homes", police:"Police", fire_station:"Fire Stations", pharmacy:"Pharmacies" };
const CATEGORY_FA = { shelter:"fa-house", hospital:"fa-hospital", clinic:"fa-stethoscope", nursing_home:"fa-bed-pulse", police:"fa-shield-halved", fire_station:"fa-fire-extinguisher", pharmacy:"fa-pills" };

const userLocationIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149059.png",
  iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
});

function SpotMarker({ onMapClick }) { useMapEvents({ click:(e)=>onMapClick(e.latlng) }); return null; }
function FlyTo({ center }) { const map=useMap(); useEffect(()=>{ if(center) map.flyTo(center,8,{duration:1.0}); },[center]); return null; }

function MapSkeleton() {
  return (
    <div style={{height:"100%",background:"#1a2a3a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"1.25rem"}}>
      <div style={{position:"relative",width:56,height:56}}>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"4px solid rgba(255,255,255,0.1)"}}></div>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"4px solid transparent",borderTopColor:"#005EA2",animation:"spin 0.9s linear infinite"}}></div>
        <i className="fa-solid fa-globe" style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#aac4e0",fontSize:"1.4rem"}}></i>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{color:"#fff",fontWeight:700,fontSize:"0.95rem",marginBottom:"0.3rem"}}>Loading Disaster Map</div>
        <div style={{color:"#aac4e0",fontSize:"0.8rem"}}>Fetching live data from GDACS...</div>
      </div>
      <div style={{display:"flex",gap:"0.4rem"}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#005EA2",animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`}}></div>)}</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes bounce{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

export default function DisasterMap() {
  const [disasters,setDisasters]=useState([]);
  const [filters,setFilters]=useState({EQ:true,FL:true,TC:true,VO:true,DR:true,WF:true});
  const [loading,setLoading]=useState(true);
  const [daysBack,setDaysBack]=useState(5);
  const [safeSpots,setSafeSpots]=useState([]);
  const [clickPosition,setClickPosition]=useState(null);
  const [selectedDisaster,setSelectedDisaster]=useState(null);
  const [shelters,setShelters]=useState([]);
  const [shelterRadius,setShelterRadius]=useState(70);
  const [sliderValue,setSliderValue]=useState(70);
  const [shelterLoading,setShelterLoading]=useState(false);
  const [clickedShelterEventId,setClickedShelterEventId]=useState(null);
  const [clickedTeleportEventId,setClickedTeleportEventId]=useState(null);
  const [shelterError,setShelterError]=useState("");
  const [flyTarget,setFlyTarget]=useState(null);
  const [activeCategory,setActiveCategory]=useState("all");
  const [userLocation,setUserLocation]=useState(null);
  const [toast,setToast]=useState("");
  const debounceRef=useRef(null);
  const disasterCoords=useRef(null);
  const toastRef=useRef(null);

  const showToast=(msg)=>{
    setToast(msg);
    if(toastRef.current) clearTimeout(toastRef.current);
    toastRef.current=setTimeout(()=>setToast(""),2500);
  };

  useEffect(()=>{
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(
        pos=>setUserLocation({lat:pos.coords.latitude,lng:pos.coords.longitude}),
        ()=>console.warn("Location access denied")
      );
    }
  },[]);

  const fetchDisasters=useCallback(async(days)=>{
    setLoading(true);
    const fromDate=new Date(); fromDate.setDate(fromDate.getDate()-days);
    const fromStr=fromDate.toISOString().split("T")[0];
    try {
      const res = await axios.get(
        `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ,FL,TC,VO,DR,WF&fromdate=${fromStr}&todate=&alertlevel=&country=&limit=500`
      );
      const features = res.data?.features || [];
      const seen = new Set();
      const all = features.filter(e => {
        const c = e.geometry?.coordinates;
        const id = e.properties?.eventid;
        if (!Array.isArray(c) || c.length < 2 || typeof c[0] !== "number" || typeof c[1] !== "number") return false;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      setDisasters(all);
      if(all.length>0){ try{ const formatted=all.map(d=>({eventid:d.properties?.eventid||Date.now().toString(),latitude:d.geometry?.coordinates[1],longitude:d.geometry?.coordinates[0],type:d.properties?.eventtype||"Unknown",description:d.properties?.htmldescription||d.properties?.title||"Unknown Event"})); await axios.post(`${SERVER_URL}/api/disasters/report-batch`,{disasters:formatted}); }catch(e){} }
    } catch(err) {
      console.error("Failed to fetch disasters:", err.message);
    } finally {
      setLoading(false);
    }
  },[]);

  useEffect(()=>{fetchDisasters(daysBack);},[daysBack,fetchDisasters]);

  const fetchShelters=useCallback(async(lat,lng,radius)=>{
    setShelterLoading(true); setShelterError(""); setShelters([]); setActiveCategory("all");
    try{
      const res=await axios.get(`${SERVER_URL}/api/shelters/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
      const data=res.data.shelters||[];
      setShelters(data);
      if(data.length===0) setShelterError(`No facilities found within ${radius}km. Try a larger radius.`);
    }catch(err){
      setShelterError(`Server error: ${err.message}`);
    }finally{
      setShelterLoading(false);
    }
  },[]);

  const handleSelectDisaster=(event)=>{
    const [lng,lat]=event.geometry.coordinates;
    disasterCoords.current={lat,lng};
    setSelectedDisaster(event); setFlyTarget([lat,lng]);
    setSliderValue(70); setShelterRadius(70);
    fetchShelters(lat,lng,70);
  };

  const handleSliderChange=(val)=>{
    setSliderValue(val);
    setShelterError("");
    if(debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current=setTimeout(()=>{
      setShelterRadius(val);
      if(disasterCoords.current) fetchShelters(disasterCoords.current.lat,disasterCoords.current.lng,val);
    },800);
  };

  const retryFetch=()=>{ if(disasterCoords.current) fetchShelters(disasterCoords.current.lat,disasterCoords.current.lng,shelterRadius); };
  const closePanel=()=>{ setSelectedDisaster(null); setShelters([]); setShelterError(""); setActiveCategory("all"); disasterCoords.current=null; if(debounceRef.current) clearTimeout(debounceRef.current); };
  const handleAddSafeSpot=(pos)=>setSafeSpots(prev=>[...prev,{id:Date.now(),position:{lat:pos.lat,lng:pos.lng},name:pos.name||`Safe Spot ${prev.length+1}`,eventid:pos.eventid||`safespot-${Date.now()}`}]);
  const handleRemoveSafeSpot=(id)=>setSafeSpots(prev=>prev.filter(s=>s.id!==id));
  const handleClearSafeSpots=()=>setSafeSpots([]);
  const handleSendToBackend=async(data)=>{ try{ for(const spot of data.safeSpots){ await axios.post(`${SERVER_URL}/api/disasters/safe-locations/report`,{eventID:spot.eventId,safelat:spot.latitude,safelong:spot.longitude,type:"safe",desc:spot.name}); } alert("Safe spots sent successfully."); }catch{ alert("Error sending safe spots."); } };

  const disasterCounts=disasters.reduce((acc,d)=>{ const t=d.properties?.eventtype; if(t) acc[t]=(acc[t]||0)+1; return acc; },{});
  const filteredDisasters=disasters.filter(d=>{ const t=d.properties?.eventtype; return t&&filters[t]; });
  const categoryCounts=shelters.reduce((acc,s)=>{ acc[s.type]=(acc[s.type]||0)+1; return acc; },{});
  const filteredShelters=activeCategory==="all"?shelters:shelters.filter(s=>s.type===activeCategory);
  const availableCategories=["all",...Object.keys(CATEGORY_FA).filter(c=>categoryCounts[c]>0)];

  return (
    <div style={{display:"flex",height:"calc(100vh - 92px)",position:"relative"}}>

      {/* Map */}
      <div style={{flex:3,position:"relative",minWidth:0}}>
        {loading&&<div style={{position:"absolute",inset:0,zIndex:999}}><MapSkeleton/></div>}
        <MapContainer center={[20,0]} zoom={2} style={{height:"100%",width:"100%"}} preferCanvas={true}>
          <SpotMarker onMapClick={setClickPosition}/>
          {flyTarget&&<FlyTo center={flyTarget}/>}
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Satellite">
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Tiles &copy; Esri"/>
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Street Map">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'/>
            </LayersControl.BaseLayer>
          </LayersControl>

          {userLocation&&(
            <Marker position={[userLocation.lat,userLocation.lng]} draggable={true} icon={userLocationIcon} eventHandlers={{dragend:e=>setUserLocation(e.target.getLatLng())}}>
              <Popup><strong>You are here!</strong><br/>Drag to update your location for AI Assistance.</Popup>
            </Marker>
          )}

          {safeSpots.map(spot=>(
            <Marker key={spot.id} position={[spot.position.lat,spot.position.lng]} icon={safeSpotIcon} eventHandlers={{click:()=>handleRemoveSafeSpot(spot.id)}}>
              <Popup><strong>{spot.name}</strong><br/>Lat:{spot.position.lat.toFixed(4)}<br/>Lng:{spot.position.lng.toFixed(4)}</Popup>
            </Marker>
          ))}

          {!loading&&filteredDisasters.map((event,i)=>{
            const coords=event.geometry?.coordinates;
            const bbox=event.bbox||[];
            const eventType=event.properties?.eventtype||"Unknown";
            const description=event.properties?.htmldescription||event.properties?.title||"Unknown Event";
            const alertLevel=event.properties?.alertlevel||"N/A";
            const markerPos=[coords[1],coords[0]];
            const eventIcon=L.icon({iconUrl:event.properties?.icon||getIcon(eventType),iconSize:[22,22],iconAnchor:[11,22]});
            let area=null;
            if(bbox.length===4){ const [minLon,minLat,maxLon,maxLat]=bbox; area=minLon!==maxLon||minLat!==maxLat?<Rectangle bounds={[[minLat,minLon],[maxLat,maxLon]]} pathOptions={{color:"red",weight:1.5,fillOpacity:0.05}}/>:<Circle center={markerPos} radius={50000} pathOptions={{color:"red",weight:1.5,fillOpacity:0.05}}/>; }
            return (
              <div key={i}>
                <Marker position={markerPos} icon={eventIcon}>
                  <Popup>
                    <p style={{margin:"0 0 4px",fontSize:"0.75rem",color:"#666"}}>Event ID: {event.properties?.eventid||"N/A"}</p>
                    <strong style={{fontSize:"0.85rem"}}>{description}</strong>
                    <p style={{margin:"4px 0 8px"}}>Type: {eventType} | Alert: <span style={{color:alertLevel==="Red"?"#D32F2F":alertLevel==="Orange"?"#E65100":"#2E7D32",fontWeight:700}}>{alertLevel}</span></p>
                    <div style={{display:"flex",gap:"6px",flexDirection:"column"}}>
                      <button
                        onClick={()=>{
                          const eid=event.properties?.eventid;
                          setClickedShelterEventId(eid);
                          handleSelectDisaster(event);
                          setTimeout(()=>setClickedShelterEventId(null),2000);
                        }}
                        style={{width:"100%",padding:"8px",background:clickedShelterEventId===event.properties?.eventid?"#003f73":"#005EA2",color:"white",border:"none",borderRadius:6,cursor:clickedShelterEventId===event.properties?.eventid?"not-allowed":"pointer",fontSize:"0.82rem",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6,opacity:clickedShelterEventId===event.properties?.eventid?0.65:1,transition:"all 0.2s"}}
                        disabled={clickedShelterEventId===event.properties?.eventid}
                      >
                        <i className={clickedShelterEventId===event.properties?.eventid?"fa-solid fa-circle-notch fa-spin":"fa-solid fa-house-medical"}></i>
                        {clickedShelterEventId===event.properties?.eventid?" Searching...":" Find Nearby Shelters"}
                      </button>
                      <button
                        onClick={()=>{
                          const eid=event.properties?.eventid;
                          setClickedTeleportEventId(eid);
                          setUserLocation({lat:markerPos[0],lng:markerPos[1]});
                          showToast("Location set to "+eventType+" zone");
                          setTimeout(()=>setClickedTeleportEventId(null),2000);
                        }}
                        style={{width:"100%",padding:"8px",background:clickedTeleportEventId===event.properties?.eventid?"#3730a3":"#4F46E5",color:"white",border:"none",borderRadius:6,cursor:clickedTeleportEventId===event.properties?.eventid?"not-allowed":"pointer",fontSize:"0.82rem",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6,opacity:clickedTeleportEventId===event.properties?.eventid?0.65:1,transition:"all 0.2s"}}
                        disabled={clickedTeleportEventId===event.properties?.eventid}
                      >
                        <i className={clickedTeleportEventId===event.properties?.eventid?"fa-solid fa-check":"fa-solid fa-location-crosshairs"}></i>
                        {clickedTeleportEventId===event.properties?.eventid?" Location Set!":" Teleport Location Here"}
                      </button>
                    </div>
                  </Popup>
                </Marker>
                {area}
              </div>
            );
          })}

          {selectedDisaster&&(()=>{ const [lng,lat]=selectedDisaster.geometry.coordinates; return <Circle center={[lat,lng]} radius={shelterRadius*1000} pathOptions={{color:"#005EA2",fillColor:"#005EA2",fillOpacity:0.04,weight:2,dashArray:"8 5"}}/>; })()}

          {filteredShelters.map((s,i)=>(
            <Marker key={`sh-${i}`} position={[s.lat,s.lng]} icon={L.divIcon({className:"",html:`<div style="width:26px;height:26px;border-radius:50%;background:#1E3A5F;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.4);border:2px solid #fff"><i class="fa-solid ${CATEGORY_FA[s.type]||'fa-location-dot'}" style="color:#fff;font-size:11px"></i></div>`,iconSize:[26,26],iconAnchor:[13,13]})}>
              <Popup>
                <div style={{fontFamily:"system-ui",minWidth:160}}>
                  <div style={{fontWeight:700,fontSize:"13px",marginBottom:3}}>{s.name||"Unnamed Facility"}</div>
                  <div style={{fontSize:"11px",color:"#555",textTransform:"capitalize",marginBottom:4}}><i className={`fa-solid ${CATEGORY_FA[s.type]||'fa-location-dot'}`}></i> {s.type?.replace(/_/g," ")}</div>
                  {s.address&&<div style={{fontSize:"11px",color:"#777",marginBottom:4}}>{s.address}</div>}
                  {s.capacity&&<div style={{fontSize:"11px",marginBottom:4}}>Capacity: {s.capacity}</div>}
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    <span style={{fontSize:"10px",padding:"2px 6px",borderRadius:10,background:s.source==="FEMA/Red Cross"?"#e8f5e9":"#e3f2fd",color:s.source==="FEMA/Red Cross"?"#2e7d32":"#1565c0",fontWeight:600}}>{s.source}</span>
                    {s.distance_km!=null&&<span style={{fontSize:"10px",padding:"2px 6px",borderRadius:10,background:"#fff3e0",color:"#e65100",fontWeight:600}}>{s.distance_km}km</span>}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>


      {/* Right Sidebar */}
      <div style={{flex:1,display:"flex",flexDirection:"column",padding:"10px",backgroundColor:"var(--bg-section)",overflowY:"auto",minWidth:220,maxWidth:280}}>
        <div style={{background:"var(--bg-card)",border:"1px solid var(--border-subtle)",borderRadius:12,boxShadow:"0 4px 16px rgba(0,0,0,0.08)",padding:"0.6rem 0.75rem",marginBottom:"0.5rem"}}>
          <div style={{fontSize:"0.8rem",fontWeight:700,color:"var(--text-primary)",marginBottom:"0.4rem"}}>
            <i className="fa-solid fa-calendar-days" style={{marginRight:"0.3rem"}}></i>Show disasters from last:
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"0.3rem"}}>
            {DAY_OPTIONS.map(d=><button key={d} onClick={()=>setDaysBack(d)} style={{padding:"0.2rem 0.5rem",fontSize:"0.75rem",borderRadius:4,border:`1px solid ${daysBack===d?"#005EA2":"#BDBDBD"}`,background:daysBack===d?"var(--color-primary)":"var(--bg-section)",color:daysBack===d?"#fff":"var(--text-secondary)",fontWeight:daysBack===d?700:400,cursor:"pointer"}}>{d}d</button>)}
          </div>
          <div style={{fontSize:"0.72rem",color:"var(--text-muted)",marginTop:"0.35rem"}}>{loading?"Loading...":`${filteredDisasters.length} events shown`}</div>
        </div>
        <DisasterFilter filters={filters} setFilters={setFilters} disasterCounts={disasterCounts}/>
        <SafeSpotMarker safeSpots={safeSpots} disasterMarkers={filteredDisasters} onAddSafeSpot={handleAddSafeSpot} onRemoveSafeSpot={handleRemoveSafeSpot} onClearSafeSpots={handleClearSafeSpots} onSendToBackend={handleSendToBackend} onClickPosition={clickPosition}/>
      </div>

      {/* Nearby Facilities Panel */}
      {selectedDisaster&&(
        <div style={{position:"absolute",top:0,left:0,width:"calc(100% - 280px)",height:"100%",pointerEvents:"none",zIndex:1500}}>
          <div style={{position:"absolute",top:0,right:0,width:320,height:"100%",background:"var(--bg-card)",borderLeft:"1px solid var(--border-subtle)",pointerEvents:"all",display:"flex",flexDirection:"column",boxShadow:"-8px 0 32px rgba(0,0,0,0.15)",backdropFilter:"blur(12px)"}}>

            {/* Header */}
            <div style={{background:"linear-gradient(135deg,#1E3A5F,#2563eb)",color:"white",padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:"13px",fontWeight:700,letterSpacing:"0.3px",display:"flex",alignItems:"center",gap:7}}>
                  <i className="fa-solid fa-house-medical"></i> Nearby Facilities
                </div>
                <div style={{fontSize:"11px",opacity:0.75,marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:240}}>
                  {selectedDisaster.properties?.eventname||selectedDisaster.properties?.title||"Selected Event"}
                </div>
              </div>
              <button onClick={closePanel} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"white",cursor:"pointer",borderRadius:"50%",width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"15px"}}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Radius Slider */}
            <div style={{padding:"14px 16px",borderBottom:"1px solid #f0f0f0",background:"var(--bg-section)",flexShrink:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontSize:"11px",color:"var(--text-secondary)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>
                  <i className="fa-solid fa-circle-dot" style={{marginRight:5,color:"#005EA2"}}></i>Search Radius
                </span>
                <span style={{fontSize:"18px",fontWeight:800,color:"#005EA2"}}>{sliderValue} km</span>
              </div>
              <input type="range" min={10} max={500} step={10} value={sliderValue} onChange={e=>handleSliderChange(Number(e.target.value))} style={{width:"100%",accentColor:"#005EA2",cursor:"pointer"}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:"10px",color:"var(--text-muted)",marginTop:4}}><span>10km</span><span>500km</span></div>
              {shelterLoading&&(
                <div style={{marginTop:10,fontSize:"12px",color:"#005EA2",textAlign:"center",fontWeight:600,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <i className="fa-solid fa-circle-notch fa-spin"></i> Searching nearby facilities...
                  </div>
                  <div style={{fontSize:"10px",color:"#94a3b8",fontWeight:400}}>
                    May take 10–30 sec · Trying multiple servers
                  </div>
                </div>
              )}
            </div>

            {/* Category Tabs */}
            {!shelterLoading&&shelters.length>0&&(
              <div style={{padding:"10px 12px",borderBottom:"1px solid #f0f0f0",background:"var(--bg-section)",flexShrink:0,overflowX:"auto"}}>
                <div style={{display:"flex",gap:6,width:"max-content"}}>
                  {availableCategories.map(cat=>(
                    <button key={cat} onClick={()=>setActiveCategory(cat)} style={{padding:"5px 11px",fontSize:"11px",borderRadius:20,border:"none",cursor:"pointer",whiteSpace:"nowrap",fontWeight:600,background:activeCategory===cat?"var(--color-primary)":"var(--bg-primary)",color:activeCategory===cat?"white":"var(--text-secondary)",display:"flex",alignItems:"center",gap:4}}>
                      {cat==="all"
                        ?<><i className="fa-solid fa-layer-group"></i>&nbsp;All ({shelters.length})</>
                        :<><i className={`fa-solid ${CATEGORY_FA[cat]||"fa-location-dot"}`}></i>&nbsp;{CATEGORY_LABELS[cat]||cat} ({categoryCounts[cat]})</>
                      }
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* List */}
            <div style={{flex:1,overflowY:"auto"}}>
              {!shelterLoading&&shelterError&&(
                <div style={{margin:14,padding:14,background:"#fffbeb",border:"1px solid #fcd34d",borderRadius:10,fontSize:"12px",color:"#92400e",lineHeight:1.6}}>
                  <div style={{fontWeight:700,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                    <i className="fa-solid fa-triangle-exclamation" style={{color:"#f59e0b"}}></i> {shelterError}
                  </div>
                  <button onClick={retryFetch} style={{padding:"6px 14px",background:"#005EA2",color:"white",border:"none",borderRadius:6,cursor:"pointer",fontSize:"11px",fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
                    <i className="fa-solid fa-rotate-right"></i>&nbsp;Retry
                  </button>
                </div>
              )}
              {!shelterLoading&&!shelterError&&filteredShelters.length===0&&shelters.length>0&&(
                <div style={{textAlign:"center",padding:"30px 12px",color:"#94a3b8",fontSize:"13px"}}>
                  <i className="fa-solid fa-filter" style={{fontSize:"1.5rem",marginBottom:8,display:"block"}}></i>
                  No {CATEGORY_LABELS[activeCategory]||activeCategory} in results
                </div>
              )}
              {!shelterLoading&&filteredShelters.map((s,i)=>(
                <div key={i}
                  style={{padding:"12px 16px",borderBottom:"1px solid var(--border-subtle)",cursor:"pointer"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--bg-section)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                  onClick={()=>setFlyTarget([s.lat,s.lng])}
                >
                  <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                    <div style={{width:36,height:36,borderRadius:10,background:"var(--bg-section)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <i className={`fa-solid ${CATEGORY_FA[s.type]||'fa-location-dot'}`} style={{color:"#1E3A5F",fontSize:"15px"}}></i>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:"13px",fontWeight:600,color:"var(--text-primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                        {s.name||"Unnamed Facility"}
                      </div>
                      <div style={{fontSize:"11px",color:"var(--text-secondary)",textTransform:"capitalize",marginTop:2}}>
                        <i className={`fa-solid ${CATEGORY_FA[s.type]||"fa-location-dot"}`} style={{marginRight:4,color:"#94a3b8"}}></i>
                        {s.type?.replace(/_/g," ")||"shelter"}
                      </div>
                      {s.address&&<div style={{fontSize:"11px",color:"var(--text-muted)",marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.address}</div>}
                      <div style={{display:"flex",gap:5,marginTop:6,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{fontSize:"10px",padding:"2px 8px",borderRadius:10,background:s.source==="FEMA/Red Cross"?"#dcfce7":"#dbeafe",color:s.source==="FEMA/Red Cross"?"#166534":"#1e40af",fontWeight:700}}>
                          {s.source==="FEMA/Red Cross"?"FEMA":"OSM"}
                        </span>
                        {s.capacity&&<span style={{fontSize:"10px",color:"#64748b",background:"#f1f5f9",padding:"2px 7px",borderRadius:10}}>Cap: {s.capacity}</span>}
                        {s.distance_km!=null&&<span style={{fontSize:"11px",color:"#005EA2",fontWeight:700,marginLeft:"auto"}}>{s.distance_km} km</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{padding:"8px 16px",borderTop:"1px solid #f0f0f0",background:"var(--bg-section)",fontSize:"11px",color:"var(--text-muted)",flexShrink:0,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span>{shelters.length>0?`${filteredShelters.length} of ${shelters.length} shown`:"No results"}</span>
              <span style={{fontSize:"10px"}}>OSM + FEMA</span>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast&&(
        <div style={{position:"fixed",bottom:"90px",left:"50%",transform:"translateX(-50%)",background:"#1E3A5F",color:"white",padding:"10px 22px",borderRadius:24,fontSize:"13px",fontWeight:600,zIndex:99999,boxShadow:"0 4px 16px rgba(0,0,0,0.3)",pointerEvents:"none",whiteSpace:"nowrap"}}>
          {toast}
        </div>
      )}

    </div>
  );
}




