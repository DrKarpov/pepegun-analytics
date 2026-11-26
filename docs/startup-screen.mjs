// Presentation only. Never wait for a background sync once usable data is shown.
(()=>{
 const screen=document.getElementById("startup-screen");
 if(!screen)return;
 const root=document.documentElement;
 const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 const started=performance.now(),minDuration=400,fillDuration=reduced?0:160,fadeDuration=reduced?0:220;
 let closing=false,finishTimer,hideTimer;
 function hide(){
  clearTimeout(deadline);clearTimeout(finishTimer);clearTimeout(hideTimer);
  root.classList.remove("startup-active");
  screen.remove();
 }
 function finish(){
  if(closing)return;
  closing=true;clearTimeout(deadline);
  finishTimer=setTimeout(()=>{
   screen.classList.add("startup-complete");
   hideTimer=setTimeout(()=>{
    root.classList.remove("startup-active");
    screen.classList.add("startup-leaving");
    hideTimer=setTimeout(hide,fadeDuration);
   },fillDuration);
  },Math.max(0,minDuration-fillDuration-(performance.now()-started)));
 }
 // Fail open even if the app module, storage or network never responds.
 const deadline=setTimeout(finish,8000);
 screen.addEventListener("pepegun:ready",finish,{once:true});
 window.addEventListener("pageshow",event=>{if(event.persisted)hide()});
 try{if(localStorage.getItem("pepegun-lang")==="ru")screen.setAttribute("aria-label","Загрузка аналитики")}catch{}
 screen.hidden=false;root.classList.add("startup-active");
 requestAnimationFrame(()=>requestAnimationFrame(()=>{if(!closing)screen.classList.add("startup-loading")}));
})();
