import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUsageHandler } from '../api/usage.js';
import { HttpError } from '../server/http.js';

const now = () => new Date('2026-09-11T12:00:00Z');
function response() { return { code: 200, headers: {}, setHeader(k,v) { this.headers[k]=v; }, status(v) { this.code=v;return this; }, json(v) { this.body=v;return this; } }; }
function session(account, count=3, error=null) {
  const filters=[];
  return { filters, user: { id: 'owner' }, db: { from(table) {
    const q = { select(columns, options) { filters.push({table,columns,options});return q; }, eq(k,v) { filters.push([table,k,v]);return q; }, neq(k,v) { filters.push([table,k,v]);return q; },
      gte(k,v) { filters.push([table,k,v]);return Promise.resolve({count,error}); }, single() { return Promise.resolve({data:account,error}); } };
    return q;
  } } };
}

test('usage reports owner-scoped monthly quota and includes reserved generations', async()=>{
  const s=session({plan:'free'}),r=response();
  await createUsageHandler(async()=>s,now)({method:'GET'},r);
  assert.deepEqual(r.body,{plan:'free',limit:3,used:3,remaining:0,resetsAt:'2026-10-01T00:00:00.000Z'});
  assert.equal(r.headers['Cache-Control'],'no-store');
  assert.ok(s.filters.some(x=>Array.isArray(x)&&x[0]==='student_accounts'&&x[1]==='user_id'&&x[2]==='owner'));
  assert.ok(s.filters.some(x=>Array.isArray(x)&&x[0]==='student_ai_jobs'&&x[1]==='user_id'&&x[2]==='owner'));
  assert.ok(s.filters.some(x=>Array.isArray(x)&&x[1]==='status'&&x[2]==='failed'));
  assert.ok(s.filters.some(x=>Array.isArray(x)&&x[1]==='created_at'&&x[2]==='2026-09-01T00:00:00.000Z'));
});

test('usage respects subscription expiry, paid allowances and UTC year rollover',async()=>{
  for (const [plan,expiry,limit] of [['offre','2026-10-01',60],['max','2026-10-01',150],['max','2026-09-10',3]]) {
    const r=response();await createUsageHandler(async()=>session({plan,subscription_expires_at:expiry},7),now)({method:'GET'},r);
    assert.equal(r.body.limit,limit);assert.equal(r.body.remaining,Math.max(0,limit-7));
  }
  const r=response();await createUsageHandler(async()=>session({plan:'free'},0),()=>new Date('2026-12-31T23:59:59Z'))({method:'GET'},r);
  assert.equal(r.body.resetsAt,'2027-01-01T00:00:00.000Z');
});

test('usage does not invent remaining credits when authentication or database reads fail',async()=>{
  const denied=response();await createUsageHandler(async()=>{throw new HttpError(401,'Connexion requise');},now)({method:'GET'},denied);
  assert.equal(denied.code,401);
  const unavailable=response();await createUsageHandler(async()=>session({plan:'free'},null),now)({method:'GET'},unavailable);
  assert.equal(unavailable.code,503);assert.equal(unavailable.body.error.code,'usage_unavailable');
  const method=response();await createUsageHandler(async()=>{throw new Error('must not authenticate');},now)({method:'POST'},method);
  assert.equal(method.code,405);
});
