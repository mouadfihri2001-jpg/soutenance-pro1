window.scrollTo = id => document.getElementById(id)?.scrollIntoView({behavior:'smooth'});
window.selectStep = index => {
  document.querySelectorAll('.how-step').forEach((el,i)=>el.classList.toggle('active-step',i===index));
  document.querySelectorAll('.hp-step').forEach((el,i)=>el.classList.toggle('active',i===index));
};
window.toggleFaq = button => {
  const item=button.closest('.faq-item'),open=item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(el=>el.classList.remove('open'));
  item.classList.toggle('open',!open);button.setAttribute('aria-expanded',String(!open));
};
window.showToast = message => {const el=document.getElementById('sp-notice');el.textContent=message;el.hidden=false;};
window.addEventListener('scroll',()=>document.getElementById('navbar')?.classList.toggle('scrolled',window.scrollY>40));
const sample=document.getElementById('hero-typed');
if(sample){sample.innerHTML='<h2>Mon mémoire</h2><h3>Un plan, des sources, une rédaction suivie.</h3><p>Commence par les consignes de ton établissement. Construis ton plan, sélectionne tes sources et rédige une section à la fois.</p><p>Conserve les extraits consultés et vérifie les citations avant de valider ton texte.</p>';}
for(const id of ['hero-prog-fill','hero-prog-pct','hero-word-count']){const el=document.getElementById(id);if(el)el.closest('.hc-progress')?.remove();}
