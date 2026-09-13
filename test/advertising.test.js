import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advertisingConfiguration, guideAdvertising } from '../scripts/advertising.mjs';

// Nonfunctional fixture for offline rendering, never a production account.
const configured={VERCEL_ENV:'production',ADSENSE_MODE:'ads',ADSENSE_CLIENT_ID:'ca-pub-0000000000000000',ADSENSE_GUIDE_SLOT_ID:'0000000000'};

test('ads require an explicit valid production configuration; inherited preview settings are inactive',()=>{
  assert.equal(advertisingConfiguration({VERCEL_ENV:'production'}).mode,'off');
  assert.equal(advertisingConfiguration({...configured,VERCEL_ENV:'preview'}).mode,'off');
  for(const overrides of [
    {ADSENSE_MODE:'true'}, {ADSENSE_CLIENT_ID:''},
    {ADSENSE_CLIENT_ID:'ca-pub-123\"><script>'},
    {ADSENSE_GUIDE_SLOT_ID:''}, {ADSENSE_GUIDE_SLOT_ID:'123\" onload="alert(1)'}
  ])assert.throws(()=>advertisingConfiguration({...configured,...overrides}),/ADSENSE_/);
  assert.equal(advertisingConfiguration({...configured,ADSENSE_MODE:'verify',ADSENSE_GUIDE_SLOT_ID:''}).mode,'verify');
});

test('only original guides receive an ad slot even if advertising is active',()=>{
  const context={production:true,advertising:advertisingConfiguration(configured)};
  for(const page of [
    {kind:'parcours',slug:'pfe'}, {kind:'guide',slug:'confidentialite'},
    {kind:'guide',slug:'bibliotheque/document/example'}, {kind:'guide',slug:'services/plan-memoire'}
  ])assert.deepEqual(guideAdvertising(page,context),{head:'',body:''});
  const guide={kind:'guide',slug:'guides/fiche-lecture'};
  assert.deepEqual(guideAdvertising(guide,{...context,production:false}),{head:'',body:''});
  assert.deepEqual(guideAdvertising(guide,{...context,advertising:{mode:'verify'}}),{head:'',body:''});
  const rendered=guideAdvertising(guide,context);
  assert.match(rendered.head,/async src="https:\/\/pagead2\.googlesyndication\.com/);
  assert.match(rendered.body,/aria-label="Publicité"/);
  assert.equal([...rendered.body.matchAll(/<ins /g)].length,1);
});
