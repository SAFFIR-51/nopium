import { notFound } from "next/navigation";
import { Suspense } from "react";
import { experts } from "@/lib/data";
import { ExpertProfile } from "@/components/ExpertProfile";
import "./profile-v2.css";
export function generateStaticParams(){return experts.map(e=>({id:e.id}));}
async function ProfileContent({params}:{params:Promise<{id:string}>}){const {id}=await params;const expert=experts.find(e=>e.id===id);if(!expert)notFound();return <ExpertProfile expert={expert}/>;}
export default function ExpertPage({params}:{params:Promise<{id:string}>}){return <Suspense fallback={<div className="expert-container" role="status">전문가 정보를 불러오고 있어요.</div>}><ProfileContent params={params}/></Suspense>;}

