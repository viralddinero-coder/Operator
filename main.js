const params = new URLSearchParams(location.search);
const ADMIN = params.get('admin') === '1';
const DEFAULT_RTP = parseFloat(params.get('rtp') || '96.34');

function randHex(len=32){
  const arr = new Uint8Array(len/2);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function sha256Hex(str){
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(str));
  const view = new Uint8Array(buf);
  return Array.from(view).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function makePRNG(seedHex){
  let a = parseInt(seedHex.slice(0,8),16)>>>0;
  let b = parseInt(seedHex.slice(8,16),16)>>>0;
  let c = parseInt(seedHex.slice(16,24),16)>>>0;
  let d = parseInt(seedHex.slice(24,32),16)>>>0;
  function next(){
    let t = (a + b) | 0;
    a = b ^ (b<<9);
    b = c + (c<<3) | 0;
    c = (c<<21 | c>>>11);
    d = (d + 1) | 0;
    t = t + d | 0;
    return (t >>> 0) / 0xFFFFFFFF;
  }
  return {
    next,
    int(max){ return Math.floor(next()*max); },
    pickWeighted(items){
      const sum = items.reduce((s,i)=>s+i.w,0);
      let r = next()*sum;
      for(const i of items){ if((r -= i.w) <= 0) return i.item; }
      return items[items.length-1].item;
    }
  };
}

const GRID_W = 6;
const GRID_H = 5;
const CELL = 88;
const MARGIN = 10;
const MIN_CLUSTER = 5;

const baseSymbols = [
  {key:'A', color:0x3fbf5c},
  {key:'B', color:0x3aa6ff},
  {key:'C', color:0xff9f1c},
  {key:'D', color:0xda3fd1}
];
const specialSymbols = [
  {key:'S', color:0xf0e14a}, // Scatter
  {key:'G', color:0xffd166}, // Gold
  {key:'R', color:0x7bdff2}, // Rainbow
  {key:'CLO', color:0x8aff80}, // Clover multiplier
  {key:'P', color:0x9b5de5}  // Pot
];

function weightSet(rtp){
  const t = Math.min(0.99, Math.max(0.90, rtp/100));
  const low = {A:60,B:60,C:60,D:60,S:3,G:18,R:5,CLO:4,P:4};
  const high= {A:80,B:80,C:80,D:80,S:5,G:26,R:7,CLO:6,P:6};
  const mix = k => Math.round(low[k] + (high[k]-low[k])*((t-0.90)/(0.09)));
  return {A:mix('A'),B:mix('B'),C:mix('C'),D:mix('D'),S:mix('S'),G:mix('G'),R:mix('R'),CLO:mix('CLO'),P:mix('P')};
}

function buildWeights(rtp){
  const w = weightSet(rtp);
  const arr = [];
  for(const b of baseSymbols) arr.push({item:b, w:w[b.key]});
  for(const s of specialSymbols) arr.push({item:s, w:w[s.key]});
  return arr;
}

class GameScene extends Phaser.Scene{
  constructor(){ super('Game'); }
  init(){
    this.balance = 1000;
    this.bet = 1;
    this.spinCount = 0;
    this.serverSeed = randHex(64);
    this.clientSeed = '';
    this.globalMult = 1;
    this.freeSpinsLeft = 0;
    this.goldPersistent = false;
    this.inSpin = false;
    this.autoSpinsRemaining = 0;
    this.autoPanel = null;
    this.grid = this.emptyGrid();
    this.nodes = this.emptyGrid();
  }
  emptyGrid(){ return Array.from({length:GRID_H},()=>Array(GRID_W).fill(null)); }
  async create(){
    document.getElementById('serverSeed').textContent = this.serverSeed;
    const seedInput = document.getElementById('clientSeed');
    seedInput.value = params.get('seed') || 'client-'+randHex(16);
    this.clientSeed = seedInput.value;
    seedInput.addEventListener('change',()=>{ this.clientSeed = seedInput.value || 'client-'+randHex(8); });

    const adminPanel = document.getElementById('adminPanel');
    const rtpSlider = document.getElementById('rtpSlider');
    const rtpValue = document.getElementById('rtpValue');
    if(ADMIN){
      adminPanel.classList.add('show');
      rtpSlider.value = DEFAULT_RTP.toFixed(2);
      rtpValue.textContent = DEFAULT_RTP.toFixed(2)+'%';
      rtpSlider.addEventListener('input',()=>{
        const v = parseFloat(rtpSlider.value);
        rtpValue.textContent = v.toFixed(2)+'%';
        this.rtp = v;
        console.log('[ADMIN] RTP set to', v);
      });
    }
    this.rtp = DEFAULT_RTP;

    const w = 640, h = 960;
    this.cameras.main.setBackgroundColor('#0e0f13');
    this.centerX = w/2; this.centerY = h/2 + 30;

    this.board = this.add.container(this.centerX, this.centerY);
    this.makeUI(w,h);
    await this.generateGrid();
    this.renderGrid(true);
    this.simulateSpins(5000);
  }
  async animateReelDrop() {
    for (let col = 0; col < GRID_W; col++) {
        for (let row = GRID_H - 1; row >= 0; row--) {
            const node = this.nodes[row][col];
            if (node) {
                const targetY = this.cellPos(row, col).y;
                this.tweens.add({
                    targets: node,
                    y: targetY,
                    duration: 200,
                    ease: 'Quad.easeOut'
                });
                await new Promise(res => setTimeout(res, 50)); // Delay between each drop
            }
        }
    }
    for (let row = GRID_H - 2; row >= 0; row--) {
        for (let col = 0; col < GRID_W; col++) {
            const node = this.nodes[row][col];
            if (node) {
                const targetY = this.cellPos(row, col).y;
                this.tweens.add({
                    targets: node,
                    y: targetY,
                    duration: 200,
                    ease: 'Quad.easeOut'
                });
                await new Promise(res => setTimeout(res, 50)); // Delay between each drop
            }
        }
    }
  }
  makeUI(w,h){
    // Beräkna gridens kanter för exakt placering
    const totalW = GRID_W*CELL + (GRID_W-1)*MARGIN;
    const totalH = GRID_H*CELL + (GRID_H-1)*MARGIN;
    const gridLeftX = this.centerX - totalW/2;
    const gridRightX = this.centerX + totalW/2;
    const gridBottomY = this.centerY + totalH/2;

    // Saldo-ruta i nedre vänstra hörnet
    const saldoX = gridLeftX + 80;
    const saldoY = gridBottomY + 20;
    const saldoBox = this.add.container(saldoX, saldoY);
    const saldoBg = this.add.rectangle(0,0,160,40,0x1b1f2d).setStrokeStyle(2,0x2d334c);
    const saldoLbl = this.add.text(-70,-10,'Saldo',{fontSize:'14px',color:'#bfc6d6'});
    this.balanceText = this.add.text(-70,6, this.balance.toFixed(2), {fontSize:'16px',color:'#e6e6e6'});
    saldoBox.add([saldoBg, saldoLbl, this.balanceText]);

    // Spin-knapp längst ner till höger
    const spinX = gridRightX - 60;
    const spinY = gridBottomY + 20;
    const spinBg = this.add.circle(spinX,spinY,42,0x28a745).setStrokeStyle(4,0x1e7e34);
    const spinGlow = this.add.circle(spinX,spinY,48,0x28a745,0.25);
    const spinTxt = this.add.text(spinX-20,spinY-14,'SPIN',{fontSize:'20px',fontStyle:'bold',color:'#ffffff'});
    const spinBtn = this.add.container(spinX,spinY,[spinGlow, spinBg, spinTxt]).setSize(96,96).setInteractive({useHandCursor:true});
    spinBtn.on('pointerover',()=>{ spinGlow.setAlpha(0.25); });
    spinBtn.on('pointerout',()=>{ spinGlow.setAlpha(0.15); });
    spinBtn.on('pointerdown',()=>this.spin());

    // Auto-spin knapp bredvid spin, till vänster om den
    const autoX = spinX - 100;
    const autoY = spinY;
    const autoBg = this.add.circle(autoX,autoY,32,0x222638).setStrokeStyle(2,0x2d334c);
    const autoTxt = this.add.text(autoX-22,autoY-10,'AUTO',{fontSize:'14px',color:'#e6e6e6'});
    const autoBtn = this.add.container(autoX,autoY,[autoBg, autoTxt]).setSize(72,72).setInteractive({useHandCursor:true});
    autoBtn.on('pointerdown',()=>this.openAutoPanel(autoX, autoY));

    // Insats-kontroll i mitten nedre
    const betX = this.centerX;
    const betY = gridBottomY + 20;
    const betBg = this.add.rectangle(betX,betY,120,56,0x1b1f2d).setStrokeStyle(2,0x2d334c);
    const betTxt = this.add.text(betX-46,betY-22,'Insats',{fontSize:'12px',color:'#bfc6d6'});
    const betVal = this.add.text(betX-24, betY-2, this.bet.toFixed(2), {fontSize:'14px',color:'#e6e6e6'});
    const betSlider = this.add.dom(betX+6, betY+16, 'input', {width:'100px'}, null);
    betSlider.node.type='range'; betSlider.node.min='1'; betSlider.node.max='50'; betSlider.node.step='1'; betSlider.node.value=String(this.bet);
    betSlider.node.addEventListener('input',()=>{ this.bet = parseFloat(betSlider.node.value); betVal.setText(this.bet.toFixed(2)); });

    // Lägg till allt i scenen
    this.uiElements = {spinBtn, autoBtn, betBg, betTxt, betVal, betSlider, saldoBox};
  }
  openAutoPanel(x,y){
    if(this.autoPanel){ this.autoPanel.destroy(); this.autoPanel=null; }
    const panel = this.add.container(x, y-96);
    const bg = this.add.rectangle(0,0,140,120,0x1b1f2d).setStrokeStyle(2,0x2d334c);
    const opts = [10,25,50,100];
    const items = [];
    opts.forEach((n,i)=>{
      const t = this.add.text(-48,-44+i*28, String(n), {fontSize:'14px', color:'#e6e6e6'}).setInteractive({useHandCursor:true});
      t.on('pointerdown',()=>{ this.autoSpinsRemaining = n; panel.destroy(); this.autoPanel=null; if(!this.inSpin) this.spin(); });
      items.push(t);
    });
    const stop = this.add.text(-48, -44+opts.length*28, 'Stop', {fontSize:'14px', color:'#ff7b7b'}).setInteractive({useHandCursor:true});
    stop.on('pointerdown',()=>{ this.autoSpinsRemaining = 0; panel.destroy(); this.autoPanel=null; });
    panel.add([bg, ...items, stop]);
    this.autoPanel = panel;
  }
  async seedPRNGForSpin(){
    const base = `${this.serverSeed}|${this.clientSeed}|${this.spinCount}`;
    const hex = await sha256Hex(base);
    this.prng = makePRNG(hex);
  }
  async generateGrid(){
    await this.seedPRNGForSpin();
    const weights = buildWeights(this.rtp);
    for(let r=0;r<GRID_H;r++){
      for(let c=0;c<GRID_W;c++){
        this.grid[r][c] = this.prng.pickWeighted(weights);
      }
    }
  }
  cellPos(r,c){
    const totalW = GRID_W*CELL + (GRID_W-1)*MARGIN;
    const totalH = GRID_H*CELL + (GRID_H-1)*MARGIN;
    const ox = -totalW/2 + CELL/2;
    const oy = -totalH/2 + CELL/2;
    return {x: ox + c*(CELL+MARGIN), y: oy + r*(CELL+MARGIN)};
  }
  makeNode(r,c,sym){
    const {x,y} = this.cellPos(r,c);
    const rect = this.add.rectangle(x,y,CELL,CELL,sym.color).setStrokeStyle(2,0x222638,1);
    const txt = this.add.text(x-12,y-12,sym.key,{fontSize:'20px',color:'#111'});
    const node = this.add.container(0,0,[rect,txt]);
    if(sym.key==='G'){ const glow = this.add.rectangle(x,y,CELL+10,CELL+10,0xffd166,0.12).setStrokeStyle(2,0xffd166,0.5); node.add(glow); }
    return node;
  }
  clearBoard(){ this.board.removeAll(true); }
  renderGrid(first=false){
    this.clearBoard();
    for(let r=0;r<GRID_H;r++){
      for(let c=0;c<GRID_W;c++){
        const n = this.makeNode(r,c,this.grid[r][c]);
        this.board.add(n);
        this.nodes[r][c] = n;
        if(first){ n.list[0].alpha = 0; this.tweens.add({targets:n.list[0], alpha:1, duration:250, delay: (r*GRID_W+c)*8}); }
      }
    }
  }
  async spin(){
    if(this.inSpin) return; this.inSpin = true; this.spinCount++;
    const cost = (this.freeSpinsLeft>0)?0:this.bet;
    if(this.balance < cost){ this.inSpin=false; return; }
    this.balance -= cost; this.balanceText.setText('Saldo: '+this.balance.toFixed(2));
    await this.generateGrid();
    this.renderGrid();
    await this.animateReelDrop();
    const scatters = this.countSymbol('S');
    if(scatters>=5){ this.freeSpinsLeft = 10; this.enterFreeSpins(); }
    else if(scatters===4){ this.goldPersistent = true; this.flashBanner('All That Glitters'); }
    else if(scatters===3){ this.applyLuckMode(); }
    const totalWin = await this.runCascades();
    if(totalWin>0){ this.showWinPopup(totalWin); }
    if(this.freeSpinsLeft>0){ this.freeSpinsLeft--; setTimeout(()=>{ this.inSpin=false; this.spin(); }, 280); }
    else if(this.autoSpinsRemaining>0){ this.autoSpinsRemaining--; setTimeout(()=>{ this.inSpin=false; this.spin(); }, 280); }
    else { this.inSpin=false; }
  }
  async animateDrop(){
    // Droppa en cell i taget, kolumn för kolumn
    for(let c=0;c<GRID_W;c++){
      for(let r=0;r<GRID_H;r++){
        const n = this.nodes[r][c];
        if(!n) continue;
        const raise = Phaser.Math.Between(60,120);
        n.y = -raise;
        await new Promise(resolve=>{
          this.tweens.add({targets:n, y:0, duration:260, ease:'Bounce.easeOut', onComplete:resolve});
        });
      }
    }
  }
  countSymbol(key){
    let k=0; for(let r=0;r<GRID_H;r++) for(let c=0;c<GRID_W;c++) if(this.grid[r][c].key===key) k++; return k;
  }
  neighbors8(r,c){
    const dirs=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
    const out=[]; for(const [dr,dc] of dirs){ const nr=r+dr,nc=c+dc; if(nr>=0&&nr<GRID_H&&nc>=0&&nc<GRID_W) out.push([nr,nc]); } return out;
  }
  findClusters(){
    const vis = Array.from({length:GRID_H},()=>Array(GRID_W).fill(false));
    const clusters=[];
    for(let r=0;r<GRID_H;r++){
      for(let c=0;c<GRID_W;c++){
        const sym = this.grid[r][c];
        if(!sym || vis[r][c]) continue;
        if(!['A','B','C','D'].includes(sym.key)) continue;
        const stack=[[r,c]]; vis[r][c]=true; const cells=[[r,c]];
        while(stack.length){
          const [rr,cc]=stack.pop();
          for(const [nr,nc] of this.neighbors8(rr,cc)){
            if(!vis[nr][nc] && this.grid[nr][nc] && this.grid[nr][nc].key===sym.key){ vis[nr][nc]=true; stack.push([nr,nc]); cells.push([nr,nc]); }
          }
        }
        if(cells.length>=MIN_CLUSTER) clusters.push({key:sym.key, cells});
      }
    }
    return clusters;
  }
  async runCascades(){
    let total=0;
    for(let loop=0; loop<10; loop++){
      const clusters = this.findClusters();
      if(clusters.length===0){ if(this.goldPersistent) this.markRandomGold(2); break; }
      // Simultan borttagning av alla klusterceller
      const allCells = this.unionClusterCells(clusters);
      const winLoop = clusters.reduce((s,cl)=> s + cl.cells.length * this.bet * 0.2 * this.globalMult, 0);
      total += winLoop;
      await this.removeCellsSimul(allCells);
      // Refill rullar en‑och‑en
      await this.dropAndRefill();
      // Specialer efter refill
      if(this.countSymbol('R')>0) await this.applyRainbowReveal(Phaser.Math.Between(1,3));
      if(this.countSymbol('CLO')>0) this.applyCloverMultiplier();
      if(this.countSymbol('P')>0) await this.potCollect();
      this.markRandomGold(1);
    }
    this.balance += total; this.balanceText.setText('Saldo: '+this.balance.toFixed(2));
    return total;
  }
  unionClusterCells(clusters){
    const seen = new Set();
    const out = [];
    for(const cl of clusters){
      for(const [r,c] of cl.cells){
        const k = r+","+c;
        if(!seen.has(k)){ seen.add(k); out.push([r,c]); }
      }
    }
    return out;
  }
  async removeCellsSimul(cells){
    const parts=[];
    for(const [r,c] of cells){
      const n = this.nodes[r][c]; if(!n) continue;
      parts.push(this.makeParticles(n.x, n.y));
      this.tweens.add({targets:n, alpha:0.0, scale:0.85, duration:220});
      this.grid[r][c] = null;
      this.nodes[r][c]?.destroy();
      this.nodes[r][c] = null;
    }
    await new Promise(res=>setTimeout(res, 240));
    parts.forEach(p=>p.stop());
  }
  async removeCluster(cells){
    const parts=[];
    for(const [r,c] of cells){
      const n = this.nodes[r][c];
      parts.push(this.makeParticles(n.x, n.y));
      this.tweens.add({targets:n, alpha:0.0, scale:0.8, duration:200});
      this.grid[r][c] = null;
      if(this.nodes[r][c]){ this.nodes[r][c].destroy(); this.nodes[r][c] = null; }
    }
    await new Promise(res=>setTimeout(res, 220));
    parts.forEach(p=>p.stop());
  }
  makeParticles(x,y){
    const e = this.add.particles(x,y,'');
    const emitter = e.createEmitter({
      speed: {min:40,max:120}, lifespan: {min:200,max:400}, quantity: 6,
      tint: [0xffd166,0x9b5de5,0x3aa6ff], scale: {start:0.25,end:0}, blendMode:'ADD'
    });
    setTimeout(()=>{ emitter.stop(); e.destroy(); }, 300);
    return emitter;
  }
  async dropAndRefill(){
    // Packa kolumnvis
    for(let c=0;c<GRID_W;c++){
      let write = GRID_H-1;
      for(let r=GRID_H-1;r>=0;r--){
        if(this.grid[r][c]){
          if(write!==r){
            this.grid[write][c] = this.grid[r][c];
            this.nodes[write][c] = this.nodes[r][c];
            this.grid[r][c] = null;
            this.nodes[r][c] = null;
          }
          write--;
        }
      }
      while(write>=0){
        this.grid[write][c] = this.prng.pickWeighted(buildWeights(this.rtp));
        this.nodes[write][c] = null;
        write--;
      }
    }
    // Animera befintliga noder som faller en‑och‑en per kolumn
    for(let c=0;c<GRID_W;c++){
      for(let r=GRID_H-1;r>=0;r--){
        const node = this.nodes[r][c];
        if(!node) continue;
        const targetY = this.cellPos(r,c).y;
        const currentY = node.list[0].y;
        const delta = targetY - currentY;
        if(delta!==0){
          await new Promise(resolve=>{
            this.tweens.add({
              targets: node,
              y: delta,
              duration: 220,
              ease: 'Quad.easeOut',
              onComplete: ()=>{
                node.y = 0;
                for(const child of node.list){ child.y += delta; }
                resolve();
              }
            });
          });
        }
      }
      // Skapa nya noder och droppa dem en‑och‑en
      for(let r=0;r<GRID_H;r++){
        if(this.nodes[r][c]) continue;
        const n = this.makeNode(r,c,this.grid[r][c]);
        const {y: targetY} = this.cellPos(r,c);
        for(const child of n.list){ child.y = targetY - 120; }
        n.alpha = 0; this.board.add(n); this.nodes[r][c] = n;
        await new Promise(resolve=>{
          this.tweens.add({
            targets: n,
            alpha: 1,
            y: 120,
            duration: 240,
            ease: 'Quad.easeOut',
            onComplete: ()=>{ n.y = 0; resolve(); }
          });
        });
      }
    }
  }
  markRandomGold(count){
    for(let i=0;i<count;i++){
      const r = this.prng.int(GRID_H), c = this.prng.int(GRID_W);
      this.grid[r][c] = specialSymbols.find(s=>s.key==='G');
      const n = this.nodes[r][c]; const {x,y}=this.cellPos(r,c);
      const glow = this.add.rectangle(x,y,CELL+10,CELL+10,0xffd166,0.12).setStrokeStyle(2,0xffd166,0.5);
      this.board.add(glow);
      this.tweens.add({targets:glow, alpha:0.22, yoyo:true, repeat:2, duration:280});
    }
  }
  applyCloverMultiplier(){
    this.globalMult = 2;
    const hud = this.add.text(this.centerX-40, 90, 'x2', {fontSize:'32px', color:'#8aff80'}).setScrollFactor(0);
    this.tweens.add({targets:hud, alpha:0, duration:600, onComplete:()=>{ hud.destroy(); this.globalMult=1; }});
  }
  async applyRainbowReveal(n=2){
    const goldCells=[]; for(let r=0;r<GRID_H;r++) for(let c=0;c<GRID_W;c++) if(this.grid[r][c] && this.grid[r][c].key==='G') goldCells.push([r,c]);
    for(let i=0;i<Math.min(n,goldCells.length);i++){
      const [r,c]=goldCells[i]; const n = this.nodes[r][c];
      const coin = Phaser.Math.Between(1,5) * this.bet;
      const pop = this.add.text(n.x-12,n.y-28,'+'+coin.toFixed(2),{fontSize:'18px',color:'#ffd166'});
      this.tweens.add({targets:pop, y:pop.y-20, alpha:0, duration:550, onComplete:()=>pop.destroy()});
      this.balance += coin; this.balanceText.setText('Saldo: '+this.balance.toFixed(2));
      const p = this.makeParticles(n.x,n.y); setTimeout(()=>p.stop(),240);
    }
    await new Promise(res=>setTimeout(res, 260));
  }
  async potCollect(){
    let pot = 0;
    for(let r=0;r<GRID_H;r++) for(let c=0;c<GRID_W;c++) if(this.grid[r][c] && ['A','B','C','D'].includes(this.grid[r][c].key)) pot += 0.05*this.bet;
    pot *= this.globalMult;
    const txt = this.add.text(this.centerX-60, 120, 'POT '+pot.toFixed(2), {fontSize:'22px',color:'#9b5de5'}).setScrollFactor(0);
    this.tweens.add({targets:txt, alpha:0, y:90, duration:600, onComplete:()=>txt.destroy()});
    this.cameras.main.shake(120,0.005);
    this.balance += pot; this.balanceText.setText('Saldo: '+this.balance.toFixed(2));
    await new Promise(res=>setTimeout(res, 160));
  }
  applyLuckMode(){
    const boosts = Phaser.Math.Between(2,4);
    for(let i=0;i<boosts;i++){
      const r = this.prng.int(GRID_H), c = this.prng.int(GRID_W);
      const n = this.nodes[r][c]; if(!n) continue;
      this.tweens.add({targets:n, scale:1.08, yoyo:true, repeat:2, duration:140});
      this.balance += 0.25*this.bet; this.balanceText.setText('Saldo: '+this.balance.toFixed(2));
    }
    this.flashBanner('Luck Mode');
  }
  enterFreeSpins(){ this.flashBanner('Treasure Free Spins'); }
  flashBanner(text){
    const bg = this.add.rectangle(this.centerX, 70, 280, 40, 0x2b2f42).setStrokeStyle(2,0x9b5de5).setScrollFactor(0);
    const t = this.add.text(this.centerX-120,56,text,{fontSize:'18px',color:'#e6e6e6'}).setScrollFactor(0);
    this.tweens.add({targets:[bg,t], alpha:0, duration:800, onComplete:()=>{ bg.destroy(); t.destroy(); }});
  }
  showWinPopup(amount){
    const pop = this.add.container(this.centerX, this.centerY-220);
    const bg = this.add.rectangle(0,0,280,80,0x1b1f2d).setStrokeStyle(2,0x2d334c);
    const t = this.add.text(-120,-18,'Vinst: '+amount.toFixed(2),{fontSize:'22px',color:'#ffd166'});
    pop.add([bg,t]);
    const rain = this.add.particles(this.centerX, this.centerY-240,'');
    const em = rain.createEmitter({x:{min:-140,max:140}, y:0, speedY: {min:120,max:220}, speedX:{min:-40,max:40}, lifespan: 600, quantity: 12, tint:[0xffd166,0x9b5de5,0x3aa6ff], scale:{start:0.18,end:0}, blendMode:'ADD'});
    this.tweens.add({targets:pop, alpha:0, duration:900, delay:300, onComplete:()=>{ pop.destroy(); em.stop(); rain.destroy(); }});
  }
  async simulateSpins(n){
    let totalBet=0, totalWin=0, hits=0;
    for(let i=0;i<n;i++){
      await this.seedPRNGForSpin();
      const weights = buildWeights(this.rtp);
      const grid = Array.from({length:GRID_H},()=>Array(GRID_W).fill(null));
      for(let r=0;r<GRID_H;r++) for(let c=0;c<GRID_W;c++) grid[r][c] = this.prng.pickWeighted(weights);
      const win = this.simEvalGrid(grid);
      totalBet += this.bet; totalWin += win; if(win>0) hits++;
      this.spinCount++;
    }
    const RTP = (totalWin/totalBet)*100;
    console.log(`[SIM] n=${n} RTP=${RTP.toFixed(2)}% hits=${hits} (${(hits/n*100).toFixed(2)}%)`);
  }
  simEvalGrid(grid){
    const vis = Array.from({length:GRID_H},()=>Array(GRID_W).fill(false));
    let win=0;
    for(let r=0;r<GRID_H;r++){
      for(let c=0;c<GRID_W;c++){
        const s = grid[r][c]; if(!s || !['A','B','C','D'].includes(s.key) || vis[r][c]) continue;
        const stack=[[r,c]]; vis[r][c]=true; let size=0; const key=s.key;
        while(stack.length){
          const [rr,cc]=stack.pop(); size++;
          const dirs=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
          for(const [dr,dc] of dirs){ const nr=rr+dr,nc=cc+dc; if(nr>=0&&nr<GRID_H&&nc>=0&&nc<GRID_W&&!vis[nr][nc]&&grid[nr][nc]&&grid[nr][nc].key===key){ vis[nr][nc]=true; stack.push([nr,nc]); } }
        }
        if(size>=MIN_CLUSTER) win += size * this.bet * 0.2;
      }
    }
    const scatters = grid.flat().filter(s=>s.key==='S').length;
    if(scatters>=3) win += this.bet*0.5;
    return win;
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 640,
  height: 960,
  backgroundColor: '#0e0f13',
  scene: [GameScene],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
};

new Phaser.Game(config);