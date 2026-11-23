import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useLocation } from '../../context/LocationContext';
import { colors } from '../../theme';
import { type AppMapType, type MapCanvasProps, kmToDelta } from './types';

// Leaflet + OpenStreetMap inside a WebView: no Google Maps API key or billing
// account is needed, and the map behaves identically in Expo Go, a standalone
// build and the web preview. The React Native side sends JSON commands
// (draw markers/circles, switch layer, fly to a point); the page reports
// marker taps back as JSON messages.

const LAYERS: Record<AppMapType, { url: string; attribution: string; maxZoom: number; labels?: string }> = {
  standard: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 18,
  },
  hybrid: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 18,
    labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
  },
  terrain: {
    url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap, OpenStreetMap contributors',
    maxZoom: 17,
  },
};

const PAGE = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
html,body,#map{height:100%;margin:0;padding:0;background:#e5e7eb}
.pin{width:32px;height:32px;border-radius:16px;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 1px 4px rgba(0,0,0,.4)}
.me{width:16px;height:16px;border-radius:8px;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,.25)}
</style></head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var map=L.map('map',{zoomControl:false,attributionControl:true});
var base=null,labels=null,group=L.layerGroup().addTo(map),me=null;
function post(o){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(o));}
function setLayer(l){
  if(base)map.removeLayer(base); if(labels){map.removeLayer(labels);labels=null;}
  base=L.tileLayer(l.url,{maxZoom:l.maxZoom,attribution:l.attribution}).addTo(map);
  if(l.labels)labels=L.tileLayer(l.labels,{maxZoom:l.maxZoom}).addTo(map);
}
function draw(d){
  group.clearLayers();
  d.circles.forEach(function(c){L.circle([c.lat,c.lng],{radius:c.radiusKm*1000,color:c.color,weight:2,fillColor:c.color,fillOpacity:.15}).addTo(group);});
  d.markers.forEach(function(m){
    var icon=L.divIcon({className:'',iconSize:[32,32],iconAnchor:[16,16],html:'<div class="pin" style="background:'+m.color+'">'+m.glyph+'</div>'});
    L.marker([m.lat,m.lng],{icon:icon,title:m.title}).on('click',function(){post({type:'marker',id:m.id});}).addTo(group);
  });
}
function setMe(p){
  if(me){map.removeLayer(me);me=null;}
  if(p){me=L.marker([p.lat,p.lng],{interactive:false,icon:L.divIcon({className:'',iconSize:[16,16],iconAnchor:[8,8],html:'<div class="me"></div>'})}).addTo(map);}
}
function setInteractive(on){
  ['dragging','touchZoom','doubleClickZoom','scrollWheelZoom','boxZoom','keyboard'].forEach(function(h){on?map[h].enable():map[h].disable();});
}
window.__cmd=function(c){
  if(c.t==='init'){map.setView([c.lat,c.lng],c.zoom);setInteractive(c.interactive);}
  if(c.t==='layer')setLayer(c.layer);
  if(c.t==='data')draw(c);
  if(c.t==='me')setMe(c.p);
  if(c.t==='fly')map.flyTo([c.lat,c.lng],c.zoom,{duration:.6});
};
map.on('click',function(){post({type:'map'});});
post({type:'ready'});
</script></body></html>`;

// Leaflet zoom level that roughly fits a span of `km` kilometres on a phone-width map.
const kmToZoom = (km: number) => {
  const deg = kmToDelta(km);
  return Math.max(2, Math.min(17, Math.round(Math.log2(360 / (deg * 2.2)))));
};

export function MapCanvas({
  initialCenter,
  initialSpanKm = 60,
  focus,
  markers,
  circles,
  mapType = 'standard',
  showsUserLocation = true,
  interactive = true,
  onMarkerPress,
  onMapPress,
  style,
}: MapCanvasProps) {
  const ref = useRef<WebView<object>>(null);
  const [ready, setReady] = useState(false);
  const { position } = useLocation();

  const send = useCallback((cmd: object) => {
    ref.current?.injectJavaScript(`window.__cmd(${JSON.stringify(cmd)});true;`);
  }, []);

  // Set up the view once the page has loaded.
  useEffect(() => {
    if (!ready) return;
    send({
      t: 'init',
      lat: initialCenter.latitude,
      lng: initialCenter.longitude,
      zoom: kmToZoom(initialSpanKm),
      interactive,
    });
    // initial view only; later moves go through `focus`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (ready) send({ t: 'layer', layer: LAYERS[mapType] });
  }, [ready, mapType, send]);

  const data = useMemo(
    () => ({
      t: 'data',
      circles: circles.map((c) => ({ lat: c.center.latitude, lng: c.center.longitude, radiusKm: c.radiusKm, color: c.color })),
      markers: markers.map((m) => ({
        id: m.id,
        lat: m.coordinate.latitude,
        lng: m.coordinate.longitude,
        title: m.title,
        color: m.color,
        glyph: m.glyph,
      })),
    }),
    [markers, circles],
  );
  useEffect(() => {
    if (ready) send(data);
  }, [ready, data, send]);

  useEffect(() => {
    if (!ready) return;
    send({ t: 'me', p: showsUserLocation && position ? { lat: position.latitude, lng: position.longitude } : null });
  }, [ready, showsUserLocation, position, send]);

  useEffect(() => {
    if (!ready || !focus) return;
    send({ t: 'fly', lat: focus.coordinate.latitude, lng: focus.coordinate.longitude, zoom: kmToZoom(focus.spanKm) });
  }, [ready, focus, send]);

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as { type: string; id?: string };
      if (msg.type === 'ready') setReady(true);
      else if (msg.type === 'marker') {
        const m = markers.find((x) => x.id === msg.id);
        if (m) onMarkerPress?.(m);
      } else if (msg.type === 'map') onMapPress?.();
    } catch {
      // ignore malformed messages
    }
  };

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.section }, style]}>
      <WebView<object>
        ref={ref}
        originWhitelist={['*']}
        source={{ html: PAGE, baseUrl: 'https://oarfin.app/' }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        setSupportMultipleWindows={false}
        style={styles.web}
      />
    </View>
  );
}

const styles = StyleSheet.create({ web: { flex: 1, backgroundColor: 'transparent' } });
