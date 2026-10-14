"use client";
import { useSearchParams } from "next/navigation";
import RequestFlow from "./RequestFlow";
export default function RequestEntry(){const params=useSearchParams();const expertId=params.get('expert')||undefined;return <RequestFlow key={expertId||'direct'} expertId={expertId}/>;}
