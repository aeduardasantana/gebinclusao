/* Componente isolado: artigos recentes do Blog GEB Inclusão */
(function(){
 "use strict";
 if(document.getElementById("geb-blog-inclusao"))return;
 const footer=document.querySelector("footer");
 if(!footer)return;
 const link=document.createElement("link");link.rel="stylesheet";link.href="/assets/blog-strip.css?v=20261015";document.head.append(link);
 const section=document.createElement("section");section.id="geb-blog-inclusao";section.className="geb-blog-inclusao";section.setAttribute("aria-labelledby","geb-blog-inclusao-title");
 const wrap=document.createElement("div");wrap.className="geb-blog-inclusao__wrap";
 const head=document.createElement("div");head.className="geb-blog-inclusao__head";
 const info=document.createElement("div");
 const eyebrow=document.createElement("span");eyebrow.className="geb-blog-inclusao__eyebrow";eyebrow.textContent="BLOG GEB · INCLUSÃO";
 const title=document.createElement("h2");title.id="geb-blog-inclusao-title";title.className="geb-blog-inclusao__title";title.textContent="Conhecimento que amplia a inclusão";
 const desc=document.createElement("p");desc.className="geb-blog-inclusao__description";desc.textContent="Leia os três artigos mais recentes sobre Libras, acessibilidade e comunicação inclusiva.";
 info.append(eyebrow,title,desc);
 const all=document.createElement("a");all.className="geb-blog-inclusao__all";all.href="https://blog.grupoeduardabispo.com.br/?categoria=Inclus%C3%A3o";all.textContent="Ver todos os artigos de Inclusão →";
 head.append(info,all);
 const frame=document.createElement("iframe");frame.className="geb-blog-inclusao__frame";frame.title="Três artigos recentes da categoria Inclusão do Blog GEB";frame.src="https://blog.grupoeduardabispo.com.br/assets/embed.html?categoria=Inclus%C3%A3o&limite=3";frame.loading="lazy";frame.referrerPolicy="strict-origin-when-cross-origin";
 wrap.append(head,frame);section.append(wrap);footer.before(section);
 addEventListener("message",event=>{
   if(event.origin!=="https://blog.grupoeduardabispo.com.br"||event.source!==frame.contentWindow)return;
   if(!event.data||event.data.type!=="geb-blog-embed-height")return;
   const height=Number(event.data.height);
   if(Number.isFinite(height)&&height>=100&&height<=2500){const px=Math.ceil(height)+"px";if(frame.style.height!==px)frame.style.height=px;}
 });
})();
