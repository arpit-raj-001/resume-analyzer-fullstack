"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Job } from "./JobCard";
import L from "leaflet";
import { ExternalLink, Search } from "lucide-react";

// Fix Leaflet marker icons not loading natively in Next.js pipeline
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface JobMapProps {
  jobs: Job[];
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

export default function JobMap({ jobs }: JobMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-[400px] w-full rounded-3xl bg-[#111827] border border-[#1F2937]/50 animate-pulse"></div>;

  const validJobs = jobs.filter((j) => typeof j.latitude === "number" && typeof j.longitude === "number");
  
  // Group logic: cluster overlapping jobs on same precision coordinates
  const groupedJobsObj = validJobs.reduce((acc, job) => {
    const key = `${job.latitude},${job.longitude}`;
    if (!acc[key]) acc[key] = { lat: job.latitude!, lng: job.longitude!, list: [] };
    acc[key].list.push(job);
    return acc;
  }, {} as Record<string, { lat: number, lng: number, list: Job[] }>);

  const groupedJobs = Object.values(groupedJobsObj);
  
  // Default to India Center if no active pins
  let center: [number, number] = [20.5937, 78.9629];
  let zoom = 4;

  if (validJobs.length > 0) {
    const sumLat = validJobs.reduce((acc, curr) => acc + curr.latitude!, 0);
    const sumLon = validJobs.reduce((acc, curr) => acc + curr.longitude!, 0);
    center = [sumLat / validJobs.length, sumLon / validJobs.length];
    zoom = 5;
  }

  return (
    <div className="relative w-full h-[400px] rounded-3xl overflow-hidden border border-[#1F2937]/80 shadow-[0_0_50px_-20px_rgba(59,130,246,0.3)]">
      {/* Decorative Fading Overlays tying Map securely deep into the site's dark theme */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0A0D14] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0A0D14] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0A0D14] to-transparent z-10 pointer-events-none hidden md:block" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0A0D14] to-transparent z-10 pointer-events-none hidden md:block" />
      
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full border border-[#1F2937]/80 bg-[#111827]/80 backdrop-blur-md shadow-lg pointer-events-none">
         <span className="text-[#9CA3AF] text-xs font-bold tracking-widest uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
            Opportunity Radar
         </span>
      </div>

      <MapContainer 
        center={center} 
        zoom={zoom} 
        minZoom={4}
        maxZoom={12}
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <ChangeView center={center} zoom={zoom} />
        {/* Matrix Theme Filter over native standard free OpenStreetMap tiles */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
          className="map-tiles"
        />

        {groupedJobs.map((group, idx) => (
          <Marker key={idx} position={[group.lat, group.lng]}>
            <Popup className="premium-popup">
               {/* Fixed Scrollable container so massive stacked cities do not overflow maps limits */}
              <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="text-[10px] text-[#22C55E] font-bold uppercase tracking-wider block mb-1">
                   {group.list.length} {group.list.length === 1 ? 'Opportunity' : 'Opportunities'} Found Here
                </div>

                {group.list.map((job, jdx) => (
                   <div key={jdx} className="flex flex-col gap-1 pb-3 border-b border-[#1F2937]/50 last:border-0 last:pb-0">
                     <span className="font-bold text-[#E5E7EB] text-[13px] leading-tight">{job.title}</span>
                     <span className="text-[#9CA3AF] text-[11px] font-semibold">{job.company}</span>
                     
                     <div className="flex flex-col mt-2 gap-1.5">
                       {job.postLink && job.postLink !== "N/A" && (
                         <a href={job.postLink} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 px-3 py-1 bg-[#3B82F6] hover:bg-[#2563EB] !text-white text-[10px] font-bold rounded text-center transition-colors">
                            Original Post <ExternalLink className="w-3 h-3" />
                         </a>
                       )}
                       {job.searchLink && job.searchLink !== "N/A" && (
                         <a href={job.searchLink} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 px-3 py-1 bg-[#3B82F6]/10 border border-[#3B82F6]/30 hover:bg-[#3B82F6]/20 !text-[#60A5FA] text-[10px] font-bold rounded text-center transition-colors">
                            LinkedIn Search <Search className="w-3 h-3" />
                         </a>
                       )}
                     </div>
                   </div>
                ))}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Global Scoped overrides directly pushing Map styling without globals.css mess */}
      <style dangerouslySetInnerHTML={{__html: `
        .map-tiles { filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7); }
        .leaflet-container { background: #0D1117; font-family: inherit; }
        .leaflet-popup-content-wrapper { background: #111827; border: 1px solid #1F2937; color: #E5E7EB; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); }
        .leaflet-popup-tip { background: #111827; border-top: 1px solid #1F2937; border-left: 1px solid #1F2937; }
        .leaflet-popup-content { margin: 12px; min-width: 180px !important; }
        .leaflet-control-zoom a { background-color: #111827 !important; color: #9CA3AF !important; border-color: #1F2937 !important; }
        .leaflet-control-zoom a:hover { background-color: #1F2937 !important; color: #E5E7EB !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3B82F6; border-radius: 10px; }
      `}} />
    </div>
  );
}
