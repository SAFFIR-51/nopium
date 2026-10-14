import { Suspense } from "react";
import RequestEntry from "./RequestEntry";
export default function RequestPage(){return <Suspense fallback={<div style={{padding:60,textAlign:'center'}}>신청 내용을 준비하고 있어요.</div>}><RequestEntry/></Suspense>;}
