// Shared returning-wallet palette and partial-interval opacity for both chart renderers.
export const colors={all:"#b5ef58",paid:"#71c5b3",new:"#a8d956",returning:"#607367",fee:"#a8d956",grid:"#292e2b",text:"#919c95"};
// Keep returning bars above 3:1 on the dark card even for incomplete intervals.
export const barOpacity=(key,partial,defaultPartial)=>!partial?1:key==="returning"?.92:defaultPartial;
