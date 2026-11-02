import test from "node:test";
import assert from "node:assert/strict";
import {harness} from "./helpers/service-harness.mjs";
const saved={accessToken:"access",refreshToken:"refresh",expiresAt:Date.now()+60000,refreshExpiresAt:Date.now()+86400000};
test("alertas usam JWT no Mongo e aceitam alerta geral",async()=>{
 const calls=[];
 const app=await harness(async(url,options)=>{calls.push([url,options]);return new Response(JSON.stringify({content:[{_id:"1234567890abcdef12345678",severity:"medium",triggered_at:"2026-11-02T12:00:00Z",title:"Meta",device_id:null}],page:{totalElements:1,totalPages:1}}),{status:200});},saved,{VITE_MONGO_API_URL:"https://mongo.example.test"});
 const alerts=await app.service("alerts");const page=await alerts.listAlerts("medium",0,new AbortController().signal);
 assert.equal(page.content[0].deviceId,null);assert.equal(new URL(calls[0][0]).host,"mongo.example.test");
 assert.equal(new URL(calls[0][0]).searchParams.get("severity"),"medium");
 assert.equal(calls[0][1].headers.Authorization,"Bearer access");
});

test("visita usa PUT autenticado e permite cancelar com null",async()=>{
 const calls=[];
 const app=await harness(async(url,options)=>{calls.push([url,options]);return new Response(JSON.stringify({visit_until:null}),{status:200});},saved,{VITE_MONGO_API_URL:"https://mongo.example.test"});
 const alerts=await app.service("alerts");
 await alerts.declareVisit("device/shared",null,new AbortController().signal);
 assert.equal(new URL(calls[0][0]).pathname,"/api/detection/devices/device%2Fshared/visit");
 assert.equal(calls[0][1].method,"PUT");
 assert.equal(JSON.parse(calls[0][1].body).visit_until,null);
 assert.equal(calls[0][1].headers.Authorization,"Bearer access");
});
